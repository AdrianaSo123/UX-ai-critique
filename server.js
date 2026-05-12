const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const UXDesignAnalyzer = require('./src/index');
const validateUrl = require('./src/validateUrl');
const logger = require('./src/logger');
const pathModule = require('path');

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
const jobs = new Map();

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
  const jobId = Date.now().toString();
  
  // Store job info
  jobs.set(jobId, {
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
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

/**
 * Get list of all analyses
 */
app.get('/api/analyses', (req, res) => {
  const allJobs = Array.from(jobs.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50); // Return last 50 jobs

  res.json(allJobs);
});

/**
 * Run analysis asynchronously
 */
async function runAnalysis(jobId, url) {
  const job = jobs.get(jobId);
  job.status = 'running';
  job.startedAt = new Date().toISOString();
  job.progress = 0;
  job.step = 'Starting...';

  try {
    const analyzer = new UXDesignAnalyzer();
    const analysisPromise = analyzer.analyzeWebsite(url, {
      onProgress: payload => {
        if (!payload) return;
        if (typeof payload.progress === 'number') job.progress = payload.progress;
        if (payload.message) job.step = payload.message;
        job.updatedAt = new Date().toISOString();
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
    job.results = report.data;

    logger.info(`Analysis completed for job ${jobId}`);

  } catch (error) {
    logger.error(`Analysis failed for job ${jobId}: ${error.message}`);
    job.status = 'failed';
    job.step = 'Analysis failed.';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
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

// Start server
app.listen(PORT, () => {
  logger.info('========================================');
  logger.info('🚀 UX DESIGN ANALYZER - WEB INTERFACE');
  logger.info('========================================');
  logger.info(`Server running at: http://localhost:${PORT}`);
  logger.info(`Open your browser and visit: http://localhost:${PORT}`);
  logger.info('========================================');
});
