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
      await Promise.race([
        browser.close(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('browser.close timeout')), 10000)),
      ]);
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
  // Keep UA consistent with screenshot capture so the analyzed DOM matches the screenshots.
  if (viewportName === 'mobile') {
    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
  }
  if (viewportName === 'tablet') {
    return 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
  }
  return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
}

async function withPage({ url, viewport, viewportName, navigationTimeoutMs, stabilizationMs, waitUntil }, fn) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: getUserAgent(viewportName),
  });
  activeContexts += 1;

  try {
    const page = await context.newPage();
    const gotoTimeout = Number(navigationTimeoutMs || process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT_MS || 60000);
    const settleMs = Number(stabilizationMs || process.env.PLAYWRIGHT_STABILIZATION_MS || 1000);
    const until = String(waitUntil || process.env.PLAYWRIGHT_WAIT_UNTIL || 'domcontentloaded');

    // Navigation can fail on bot-protected or heavy sites (timeouts, aborted requests, etc.).
    // For analysis, treat navigation as best-effort so we still return a structured report.
    try {
      await page.goto(url, { waitUntil: until, timeout: gotoTimeout });
    } catch {
      // ignore; agents can still attempt DOM-based checks on partial load
    }

    await page.waitForTimeout(settleMs);
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
