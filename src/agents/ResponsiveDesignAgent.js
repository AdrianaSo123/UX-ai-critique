const BaseAgent = require('./BaseAgent');
const { withPage } = require('./playwrightUtil');

/**
 * Responsive Design Agent
 * Analyzes cross-device compatibility, breakpoint optimization, and fluid layouts
 */
class ResponsiveDesignAgent extends BaseAgent {
  constructor() {
    super('Responsive Design Agent', 'Cross-Device & Breakpoint Optimization');
  }

  /**
   * Analyze responsive design patterns
   * @param {Object} screenshot - Screenshot data with path and viewport info
   */
  async analyze(screenshot, url) {
    const viewport = screenshot.viewport.name;
    
    console.log(`[${this.name}] Analyzing ${viewport} responsive design...`);

    return await withPage(
      {
        url,
        viewport: screenshot.viewport,
        viewportName: viewport,
      },
      async page => {
        return await this.analyzePage(page, screenshot, url);
      }
    );
  }

  async analyzePage(page, screenshot, url) {
    const viewport = screenshot.viewport.name;
    const findings = [];
    const recommendations = [];

    const metrics = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const sw = document.documentElement.scrollWidth;
      const hasViewportMeta = !!document.querySelector('meta[name="viewport"]');

      // Responsive images: srcset/sizes or CSS max-width:100% on imgs
      const imgs = Array.from(document.images || []);
      const responsiveImgs = imgs.filter(img => img.hasAttribute('srcset') || img.hasAttribute('sizes')).length;
      const overflowingImgs = imgs.filter(img => {
        const r = img.getBoundingClientRect();
        return r.width > w + 1;
      }).length;

      // Check for media queries (best-effort; cross-origin styles may be blocked)
      let mediaQueryCount = 0;
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          if (rule.type === CSSRule.MEDIA_RULE) mediaQueryCount++;
        }
      }

      return {
        clientWidth: w,
        scrollWidth: sw,
        hasHorizontalOverflow: sw > w + 2,
        hasViewportMeta,
        responsiveImgs,
        totalImgs: imgs.length,
        overflowingImgs,
        mediaQueryCount,
      };
    });

    if (!metrics.hasViewportMeta) {
      findings.push(this.createFinding(
        'Missing Viewport Meta Tag',
        'No `<meta name="viewport">` detected. This can break mobile scaling and responsiveness.',
        viewport === 'mobile' ? 'critical' : 'major'
      ));
      recommendations.push(this.createRecommendation(
        'Add Viewport Meta',
        'Add a viewport meta tag for correct mobile rendering.',
        'high',
        'low',
        ['Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to the document head.']
      ));
    }

    if (metrics.hasHorizontalOverflow) {
      findings.push(this.createFinding(
        'Horizontal Overflow',
        `Content overflows horizontally (scrollWidth ${metrics.scrollWidth}px > clientWidth ${metrics.clientWidth}px).`,
        'critical'
      ));
      recommendations.push(this.createRecommendation(
        'Eliminate Horizontal Scrolling',
        'Identify the overflowing element(s) and constrain widths to the viewport.',
        'critical',
        'medium',
        [
          'Inspect wide elements (tables, images, code blocks, fixed-width containers)',
          'Apply `max-width: 100%` to media',
          'Prefer fluid containers and responsive grids',
        ]
      ));
    }

    if (metrics.totalImgs > 0 && metrics.responsiveImgs === 0) {
      findings.push(this.createFinding(
        'Non-Responsive Images',
        'No `srcset`/`sizes` detected on images; the site may be serving oversized images to smaller viewports.',
        viewport === 'mobile' ? 'major' : 'minor'
      ));
      recommendations.push(this.createRecommendation(
        'Serve Responsive Images',
        'Use `srcset`/`sizes` (or `<picture>`) so different viewports download appropriately-sized images.',
        'high',
        'medium',
        [
          'Add `srcset` and `sizes` to `<img>` elements',
          'Use modern formats (WebP/AVIF) with fallbacks',
          'Lazy-load below-the-fold media',
        ]
      ));
    }

    if (metrics.overflowingImgs > 0) {
      findings.push(this.createFinding(
        'Images Overflowing Viewport',
        `${metrics.overflowingImgs} image(s) render wider than the viewport at this breakpoint.`,
        'major'
      ));
    }

    if (metrics.mediaQueryCount === 0) {
      findings.push(this.createFinding(
        'No Media Queries Detected',
        'No CSS media queries were detected (best-effort check). The layout may not adapt across breakpoints.',
        viewport === 'desktop' ? 'minor' : 'major'
      ));
    } else {
      findings.push(this.createFinding(
        'Breakpoint Support Present',
        `Detected ${metrics.mediaQueryCount} media query block(s) (best-effort check).`,
        'minor'
      ));
    }

    return this.generateReport(findings, recommendations);
  }
}

module.exports = ResponsiveDesignAgent;
