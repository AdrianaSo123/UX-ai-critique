const express = require('express');
const cors = require('cors');
const path = require('path');
const UXDesignAnalyzer = require('./src/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/screenshots', express.static('screenshots'));
app.use('/reports', express.static('reports'));

// Store analysis jobs (in production, use a database)
const jobs = new Map();

/**
 * Home page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Start a new analysis
 */
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

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

  try {
    const analyzer = new UXDesignAnalyzer();
    const report = await analyzer.analyzeWebsite(url);

    // Update job with results
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    job.report = {
      path: report.path,
      textPath: report.textPath,
      summary: report.data.summary,
      screenshots: report.data.screenshots,
    };
    job.results = report.data;

    console.log(`✅ Analysis completed for job ${jobId}`);

  } catch (error) {
    console.error(`❌ Analysis failed for job ${jobId}:`, error.message);
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
  }
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 UX DESIGN ANALYZER - WEB INTERFACE');
  console.log('========================================\n');
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`\nOpen your browser and visit: http://localhost:${PORT}\n`);
  console.log('========================================\n');
});
