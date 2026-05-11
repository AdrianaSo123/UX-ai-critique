const BaseAgent = require('./BaseAgent');
const { withPage } = require('./playwrightUtil');

/**
 * TypographyExpertAgent - Analyzes text presentation and readability
 * Focuses on: font choices, hierarchy, spacing, contrast, and readability
 */
class TypographyExpertAgent extends BaseAgent {
  constructor() {
    super('Typography Expert Agent', 'Typography & Readability');
    
    // Typography best practices
    this.standards = {
      minFontSize: {
        mobile: 16,
        tablet: 16,
        desktop: 16,
      },
      lineHeight: {
        min: 1.4,
        ideal: 1.6,
      },
      lineLength: {
        min: 45, // characters
        max: 75, // characters
      },
      contrastRatio: {
        normal: 4.5,
        large: 3,
      },
    };
  }

  /**
   * Analyze screenshot for typography issues
   * @param {Object} screenshot - Screenshot data including path and viewport info
   * @param {string} url - The original website URL
   */
  async analyze(screenshot, url) {
    console.log(`${this.name} analyzing ${screenshot.viewport.name} view (dynamic)...`);
    const findings = [];
    const recommendations = [];

    await withPage(
      {
        url,
        viewport: screenshot.viewport,
        viewportName: screenshot.viewport.name,
      },
      async page => {
        // 1. Font size analysis (sample common text elements)
        const fontSizes = await page.$$eval('p, li, a, span, label, button', els => {
          const sizes = [];
          for (const el of els) {
            const style = getComputedStyle(el);
            const size = parseFloat(style.fontSize);
            if (!Number.isNaN(size)) sizes.push(size);
          }
          return sizes;
        });

        const minFontSize = fontSizes.length ? Math.min(...fontSizes) : null;
        const targetMin = this.standards.minFontSize[screenshot.viewport.name];

        if (minFontSize !== null && minFontSize < targetMin) {
          findings.push(this.createFinding(
            'Font Size Too Small',
            `Some text is smaller than ${targetMin}px (min detected: ${minFontSize}px).`,
            'major'
          ));
        } else if (minFontSize !== null) {
          findings.push(this.createFinding(
            'Font Size OK',
            `Minimum detected font size meets ${targetMin}px (min detected: ${minFontSize}px).`,
            'minor'
          ));
        }

        // 2. Line height analysis
        const ratios = await page.$$eval('p, li', els => {
          const out = [];
          for (const el of els) {
            const s = getComputedStyle(el);
            const fs = parseFloat(s.fontSize);
            let lh = s.lineHeight;
            if (!fs || Number.isNaN(fs)) continue;
            if (lh === 'normal') continue;
            const lhp = parseFloat(lh);
            if (!lhp || Number.isNaN(lhp)) continue;
            out.push(lhp / fs);
          }
          return out;
        });

        if (ratios.length) {
          const minRatio = Math.min(...ratios);
          const maxRatio = Math.max(...ratios);
          if (minRatio < this.standards.lineHeight.min || maxRatio > (this.standards.lineHeight.ideal + 0.4)) {
            findings.push(this.createFinding(
              'Line Height Risk',
              `Detected line-height ratios range from ${minRatio.toFixed(2)} to ${maxRatio.toFixed(2)}. Aim for ~${this.standards.lineHeight.ideal}.`,
              'minor'
            ));
          } else {
            findings.push(this.createFinding(
              'Line Height OK',
              `Detected line-height ratios are within a readable range (min ${minRatio.toFixed(2)}).`,
              'minor'
            ));
          }
        }

        // 3. Typographic hierarchy: heading level variety
        const headingTags = await page.$$eval('h1, h2, h3, h4, h5, h6', els => els.map(e => e.tagName.toLowerCase()));
        const uniqueHeadings = new Set(headingTags);
        if (uniqueHeadings.size >= 3) {
          findings.push(this.createFinding(
            'Typographic Hierarchy Present',
            `Detected heading levels: ${Array.from(uniqueHeadings).join(', ')}.`,
            'minor'
          ));
        } else {
          findings.push(this.createFinding(
            'Weak Typographic Hierarchy',
            'Fewer than 3 heading levels detected; hierarchy may be unclear.',
            'major'
          ));
        }
      }
    );
    return this.generateReport(findings, recommendations);
  }
}

module.exports = TypographyExpertAgent;
