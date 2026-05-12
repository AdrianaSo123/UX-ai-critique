const { spawnSync } = require('child_process');

function isTruthy(value) {
  return value === '1' || value === 'true' || value === 'yes';
}

// Vercel builds should not download browsers or attempt OS deps.
// The Vercel deployment in this repo is intended to be the static frontend.
if (process.env.VERCEL || process.env.NOW_REGION) {
  console.log('[postinstall] Detected Vercel environment; skipping Playwright browser install.');
  process.exit(0);
}

// Allow explicit opt-out anywhere.
if (isTruthy(process.env.SKIP_PLAYWRIGHT_INSTALL)) {
  console.log('[postinstall] SKIP_PLAYWRIGHT_INSTALL is set; skipping Playwright browser install.');
  process.exit(0);
}

// On normal hosts (local dev, Render, Railway, etc.) install Chromium.
// System dependencies are platform-specific; for Linux images missing deps, use:
//   npx playwright install --with-deps chromium
console.log('[postinstall] Installing Playwright Chromium browser...');

const result = spawnSync('npx', ['playwright', 'install', 'chromium'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status || 0);
