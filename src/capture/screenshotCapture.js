const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;
const { formatPlaywrightLaunchError } = require('../playwrightError');

/**
 * ScreenshotCapture - Captures website screenshots at various viewport sizes
 * using Playwright for comprehensive UX analysis
 */
class ScreenshotCapture {
  constructor() {
    this.browser = null;
    this.screenshotDir = path.join(__dirname, '../../screenshots');
    
    // Common device viewports for responsive analysis
    this.viewports = {
      mobile: { width: 375, height: 667, name: 'mobile' },
      tablet: { width: 768, height: 1024, name: 'tablet' },
      desktop: { width: 1920, height: 1080, name: 'desktop' },
    };
  }

  /**
   * Initialize the browser instance
   */
  async initialize() {
    try {
      this.browser = await chromium.launch({
        headless: true,
      });
      console.log('Browser initialized successfully');
    } catch (error) {
      throw new Error(formatPlaywrightLaunchError(error), { cause: error });
    }
  }

  /**
   * Capture screenshots of a website at multiple viewport sizes
   * @param {string} url - The website URL to capture
   * @param {Object} options - Additional options for capture
   * @returns {Object} Paths to captured screenshots
   */
  async captureWebsite(url, options = {}) {
    if (!this.browser) {
      await this.initialize();
    }

    const timestamp = Date.now();
    const screenshots = {};

    try {
      console.log(`\nCapturing screenshots for: ${url}`);

      // Capture for each viewport size
      for (const [device, viewport] of Object.entries(this.viewports)) {
        const context = await this.browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          userAgent: this.getUserAgent(device),
        });

        const page = await context.newPage();
        
        // Navigate to the URL with more flexible settings
        try {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });
        } catch (error) {
          // If networkidle fails, try with just domcontentloaded
          console.log(`⚠️  Using fallback loading strategy for ${device}`);
        }

        // Wait for page to stabilize
        await page.waitForTimeout(2000);

        // Generate filename
        const filename = `${timestamp}_${viewport.name}.png`;
        const filepath = path.join(this.screenshotDir, filename);

        // Capture full page screenshot
        await page.screenshot({
          path: filepath,
          fullPage: options.fullPage !== false,
        });

        screenshots[device] = {
          path: filepath,
          viewport: viewport,
          filename: filename,
        };

        console.log(`✓ Captured ${device} view (${viewport.width}x${viewport.height})`);

        await context.close();
      }

      console.log('\n✅ All screenshots captured successfully\n');
      return screenshots;

    } catch (error) {
      console.error('Error capturing screenshots:', error);
      throw error;
    }
  }

  /**
   * Capture a single screenshot with custom viewport
   * @param {string} url - The website URL to capture
   * @param {Object} viewport - Custom viewport dimensions
   * @param {string} outputName - Custom output filename
   */
  async captureSingle(url, viewport = { width: 1920, height: 1080 }, outputName = 'screenshot') {
    if (!this.browser) {
      await this.initialize();
    }

    try {
      const context = await this.browser.newContext({ viewport });
      const page = await context.newPage();
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      await page.waitForTimeout(2000);

      const timestamp = Date.now();
      const filename = `${timestamp}_${outputName}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      await page.screenshot({ path: filepath, fullPage: true });
      
      console.log(`✓ Screenshot saved: ${filename}`);
      
      await context.close();
      
      return { path: filepath, filename };

    } catch (error) {
      console.error('Error capturing screenshot:', error);
      throw error;
    }
  }

  /**
   * Get appropriate user agent for device type
   * @param {string} device - Device type (mobile, tablet, desktop)
   */
  getUserAgent(device) {
    const userAgents = {
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      tablet: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    };
    return userAgents[device] || userAgents.desktop;
  }

  /**
   * Clean up and close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed');
    }
  }
}

module.exports = ScreenshotCapture;
