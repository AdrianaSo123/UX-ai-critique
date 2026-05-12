const express = require('express');
const cors = require('cors');
const path = require('path');
const { randomUUID } = require('crypto');
require('dotenv').config();
const UXDesignAnalyzer = require('./src/index');
const validateUrl = require('./src/validateUrl');
const logger = require('./src/logger');
const pathModule = require('path');
const { createJobStore, safeStructuredClone } = require('./src/jobStore');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public', {
  etag: false,
  lastModified: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  },
}));
app.use('/screenshots', express.static('screenshots'));
app.use('/reports', express.static('reports'));

// Store analysis jobs (in production, use a database)
const jobStore = createJobStore({
  mode: process.env.JOB_STORE || 'memory',
  filePath: process.env.JOB_STORE_FILE || path.join(__dirname, 'data', 'jobs.json'),
  logger,
});

function getLocalReportJsonPath(publicReportPath) {
  const publicPath = String(publicReportPath || '');
  const filename = pathModule.basename(publicPath);
  return path.join(__dirname, 'reports', filename);
}

function withTimeout(promise, timeoutMs, label) {
  const ms = Number(timeoutMs);
  if (!Number.isFinite(ms) || ms <= 0) return promise;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        const message = label ? `${label} timed out after ${ms}ms` : `Timed out after ${ms}ms`;
        reject(new Error(message));
      }, ms);
      // Avoid keeping the event loop alive for long timeouts.
      if (typeof timer.unref === 'function') timer.unref();
    }),
  ]);
}

/**
 * Home page
 */
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Start a new analysis
 */
app.post('/api/analyze', validateUrl, async (req, res) => {
  const { url } = req.body;

  // Generate job ID
  const jobId = typeof randomUUID === 'function'
    ? randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  
  // Store job info
  jobStore.set(jobId, {
    id: jobId,
    url,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });

  // Return job ID immediately
  res.json({
    jobId,
    status: 'pending',
    message: 'Analysis started',
  });

  // Run analysis in background
  runAnalysis(jobId, url);
});

/**
 * Get analysis status and results
 */
app.get('/api/analyze/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStore.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const responseJob = safeStructuredClone(job);

  // If the server restarted, the job may have been reloaded without in-memory results.
  // Hydrate results from the saved report JSON (if available) so the UI can still render.
  if (responseJob.status === 'completed' && !responseJob.results && responseJob.report?.path) {
    const localReportPath = getLocalReportJsonPath(responseJob.report.path);
    require('fs').promises
      .readFile(localReportPath, 'utf8')
      .then(raw => {
        const reportData = JSON.parse(raw);
        responseJob.results = reportData;
        if (!responseJob.report.summary && reportData?.summary) {
          responseJob.report.summary = reportData.summary;
        }
        if (!responseJob.report.screenshots && reportData?.screenshots) {
          responseJob.report.screenshots = reportData.screenshots;
        }
        res.json(responseJob);
      })
      .catch(() => {
        // If hydration fails, still return job metadata.
        res.json(responseJob);
      });
    return;
  }

  res.json(responseJob);
});

/**
 * Get list of all analyses
 */
app.get('/api/analyses', (req, res) => {
  const allJobs = Array.from(jobStore.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50); // Return last 50 jobs

  res.json(allJobs);
});

/**
 * Run analysis asynchronously
 */
async function runAnalysis(jobId, url) {
  const job = jobStore.get(jobId);
  if (!job) return;
  job.status = 'running';
  job.startedAt = new Date().toISOString();
  job.progress = 0;
  job.step = 'Starting...';
  jobStore.schedulePersist();

  try {
    const analyzer = new UXDesignAnalyzer();
    const analysisPromise = analyzer.analyzeWebsite(url, {
      onProgress: payload => {
        if (!payload) return;
        if (typeof payload.progress === 'number') job.progress = payload.progress;
        if (payload.message) job.step = payload.message;
        job.updatedAt = new Date().toISOString();
        jobStore.schedulePersist();
      },
    });
    // Prevent unhandled rejections if a timeout wins the race.
    analysisPromise.catch(() => {});

    const timeoutMs = Number(process.env.ANALYSIS_TIMEOUT_MS || 10 * 60 * 1000);
    const report = await withTimeout(analysisPromise, timeoutMs, 'Analysis');

    // Update job with results
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.progress = 100;
    job.step = 'Analysis complete.';
    job.updatedAt = new Date().toISOString();

    const reportFilename = pathModule.basename(report.path);
    const textFilename = pathModule.basename(report.textPath);
    job.report = {
      path: `/reports/${reportFilename}`,
      textPath: `/reports/${textFilename}`,
      summary: report.data.summary,
      screenshots: report.data.screenshots,
    };
    // Do not store full results in the job store; they are already written to /reports.
    // The GET endpoint hydrates results from the saved report JSON when needed.
    delete job.results;

    jobStore.schedulePersist();

    logger.info(`Analysis completed for job ${jobId}`);

  } catch (error) {
    logger.error(`Analysis failed for job ${jobId}: ${error.message}`);
    job.status = 'failed';
    job.step = 'Analysis failed.';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
    jobStore.schedulePersist();
  }
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Frontend config endpoint (useful for Vercel-hosted frontend + external API)
 */
app.get('/api/config', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    apiBaseUrl: process.env.ANALYZER_API_BASE_URL || '',
  });
});

// Start server (after loading persisted jobs, if enabled)
(async () => {
  try {
    await jobStore.load();
  } catch (error) {
    logger.warn(`Job store load failed: ${error.message}`);
  }

  app.listen(PORT, () => {
    logger.info('========================================');
    logger.info('🚀 UX DESIGN ANALYZER - WEB INTERFACE');
    logger.info('========================================');
    logger.info(`Server running at: http://localhost:${PORT}`);
    logger.info(`Open your browser and visit: http://localhost:${PORT}`);
    logger.info('========================================');
  });
})();
