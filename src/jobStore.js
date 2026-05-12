const fs = require('fs').promises;
const path = require('path');

function safeStructuredClone(value) {
  if (typeof global.structuredClone === 'function') {
    try {
      return global.structuredClone(value);
    } catch {
      // fall through
    }
  }
  return JSON.parse(JSON.stringify(value));
}

function createJobStore(options = {}) {
  const mode = String(options.mode || 'memory').toLowerCase();
  const filePath = String(options.filePath || '').trim();
  const logger = options.logger;

  const jobs = new Map();
  let persistTimer = null;
  let persistInFlight = Promise.resolve();

  function log(level, message) {
    if (logger && typeof logger[level] === 'function') return logger[level](message);
    if (logger && typeof logger.info === 'function') return logger.info(message);
    // eslint-disable-next-line no-console
    console.log(message);
  }

  async function load() {
    if (mode !== 'file') return;
    if (!filePath) {
      log('warn', 'JOB_STORE=file but JOB_STORE_FILE is not set; falling back to memory');
      return;
    }

    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [];

      for (const job of arr) {
        if (!job || !job.id) continue;
        // If the server restarted, any "running" jobs can no longer complete.
        if (job.status === 'running') {
          job.status = 'failed';
          job.step = 'Analysis interrupted.';
          job.error = 'Server restarted during analysis; job state was recovered but the analysis did not finish.';
          job.completedAt = new Date().toISOString();
          job.updatedAt = new Date().toISOString();
        }
        jobs.set(String(job.id), job);
      }

      log('info', `Loaded ${jobs.size} jobs from ${filePath}`);
    } catch (error) {
      if (error && error.code === 'ENOENT') return;
      log('warn', `Failed to load jobs from disk: ${error.message}`);
    }
  }

  async function persist() {
    if (mode !== 'file') return;
    if (!filePath) return;

    const dir = path.dirname(filePath);
    const tmp = `${filePath}.tmp`;

    const payload = Array.from(jobs.values()).map(job => {
      const cloned = safeStructuredClone(job);
      // Results can be very large and are already written to /reports as JSON.
      delete cloned.results;
      return cloned;
    });

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8');
    await fs.rename(tmp, filePath);
  }

  function schedulePersist() {
    if (mode !== 'file') return;
    if (!filePath) return;
    if (persistTimer) return;

    persistTimer = setTimeout(() => {
      persistTimer = null;
      // Serialize writes to avoid interleaving.
      persistInFlight = persistInFlight
        .then(() => persist())
        .catch(error => log('warn', `Failed to persist jobs: ${error.message}`));
    }, 500);

    if (typeof persistTimer.unref === 'function') persistTimer.unref();
  }

  function get(jobId) {
    return jobs.get(String(jobId));
  }

  function set(jobId, job) {
    jobs.set(String(jobId), job);
    schedulePersist();
  }

  function has(jobId) {
    return jobs.has(String(jobId));
  }

  function deleteJob(jobId) {
    jobs.delete(String(jobId));
    schedulePersist();
  }

  function values() {
    return Array.from(jobs.values());
  }

  return {
    mode,
    filePath,
    load,
    get,
    set,
    has,
    delete: deleteJob,
    values,
    schedulePersist,
  };
}

module.exports = { createJobStore, safeStructuredClone };
