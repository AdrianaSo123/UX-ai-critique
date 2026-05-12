const { chromium } = require('playwright');
const { formatPlaywrightLaunchError } = require('../playwrightError');

let browserPromise = null;
let activeContexts = 0;
let closeRequested = false;
let closeInProgress = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true }).catch(error => {
      browserPromise = null;
      throw new Error(formatPlaywrightLaunchError(error), { cause: error });
    });
  }
  return browserPromise;
}

async function closeBrowserIfIdle() {
  if (!closeRequested) return;
  if (activeContexts > 0) return;
  if (!browserPromise) {
    closeRequested = false;
    return;
  }
  if (closeInProgress) return closeInProgress;

  closeInProgress = (async () => {
    try {
      const browser = await browserPromise;
      await browser.close();
    } catch {
      // Best-effort shutdown; browser may already be closed.
    } finally {
      browserPromise = null;
      closeRequested = false;
      closeInProgress = null;
    }
  })();

  return closeInProgress;
}

function getUserAgent(viewportName) {
  if (viewportName === 'mobile') {
    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1';
  }
  if (viewportName === 'tablet') {
    return 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A5341f Safari/604.1';
  }
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36';
}

async function withPage({ url, viewport, viewportName }, fn) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: getUserAgent(viewportName),
  });
  activeContexts += 1;

  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    return await fn(page);
  } finally {
    try {
      await context.close();
    } catch {
      // If another job closed the shared browser, context.close() can throw.
    } finally {
      activeContexts = Math.max(0, activeContexts - 1);
      await closeBrowserIfIdle();
    }
  }
}

async function closeSharedBrowser() {
  closeRequested = true;
  await closeBrowserIfIdle();
}

module.exports = {
  withPage,
  getUserAgent,
  closeSharedBrowser,
};
