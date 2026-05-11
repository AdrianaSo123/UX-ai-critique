const BaseAgent = require('./BaseAgent');
const { withPage } = require('./playwrightUtil');

/**
 * Graphic Designer Agent
 * Evaluates visual design, color theory, imagery, and brand consistency
 */
class GraphicDesignerAgent extends BaseAgent {
  constructor() {
    super('Graphic Designer Agent', 'Visual Design & Brand Aesthetics');
  }

  /**
   * Analyze graphic design and visual aesthetics
   * @param {Object} screenshot - Screenshot data with path and viewport info
   */
  async analyze(screenshot, url) {
    const viewport = screenshot.viewport.name;
    
    console.log(`[${this.name}] Analyzing ${viewport} visual design...`);

    const findings = [];
    const recommendations = [];

    await withPage(
      {
        url,
        viewport: screenshot.viewport,
        viewportName: viewport,
      },
      async page => {
        // Color palette sampling: count unique text/background colors on visible elements
        const colorStats = await page.evaluate(() => {
          const isVisible = el => {
            const s = getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden') return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          };

          const normalize = c => (c || '').replace(/\s+/g, '');
          const isTransparent = c => /rgba\(0,0,0,0\)|transparent/i.test(c);

          const els = Array.from(document.querySelectorAll('body *')).filter(isVisible).slice(0, 800);
          const textColors = new Map();
          const bgColors = new Map();

          for (const el of els) {
            const s = getComputedStyle(el);
            const tc = normalize(s.color);
            const bc = normalize(s.backgroundColor);
            if (tc) textColors.set(tc, (textColors.get(tc) || 0) + 1);
            if (bc && !isTransparent(bc)) bgColors.set(bc, (bgColors.get(bc) || 0) + 1);
          }

          const topN = (m, n) => Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);

          return {
            uniqueText: textColors.size,
            uniqueBg: bgColors.size,
            topText: topN(textColors, 5),
            topBg: topN(bgColors, 5),
          };
        });

        const totalUnique = colorStats.uniqueText + colorStats.uniqueBg;
        if (totalUnique > 60) {
          findings.push(this.createFinding(
            'Inconsistent Color Palette',
            `High variety of colors detected (text: ${colorStats.uniqueText}, backgrounds: ${colorStats.uniqueBg}). This can weaken brand consistency.`,
            'major',
            { colors: colorStats }
          ));
          recommendations.push(this.createRecommendation(
            'Reduce Palette Complexity',
            'Define a smaller set of brand + semantic colors and reuse them consistently across components.',
            'high',
            'medium',
            [
              'Identify primary/secondary/accent colors from the current design',
              'Replace near-duplicate grays and off-brand variants',
              'Document usage rules (buttons, links, backgrounds, borders)',
            ]
          ));
        } else {
          findings.push(this.createFinding(
            'Color Palette Scope',
            `Color variety appears bounded (text: ${colorStats.uniqueText}, backgrounds: ${colorStats.uniqueBg}).`,
            'minor',
            { colors: colorStats }
          ));
        }

        // Visual density (proxy for clutter / whitespace)
        const density = await page.evaluate(() => document.querySelectorAll('body *').length);
        if (density > 1200) {
          findings.push(this.createFinding(
            'High Visual Density',
            `The page contains many elements (${density}), which can increase cognitive load and reduce perceived clarity.`,
            'minor',
            { elementCount: density }
          ));
          recommendations.push(this.createRecommendation(
            'Increase Visual Breathing Room',
            'Use spacing and grouping to reduce perceived clutter and improve scanability.',
            'medium',
            'medium',
            [
              'Increase spacing between sections and cards',
              'Reduce decorative elements that don’t support user goals',
              'Group related content with alignment and proximity',
            ]
          ));
        }

        // Imagery quality: check for visibly-upscaled raster images
        const imageStats = await page.evaluate(() => {
          const imgs = Array.from(document.images || []);
          let total = 0;
          let likelyUpscaled = 0;
          let missingAlt = 0;

          for (const img of imgs) {
            const rect = img.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;
            total++;

            const nw = img.naturalWidth || 0;
            const nh = img.naturalHeight || 0;
            if (nw && rect.width > nw * 1.2) likelyUpscaled++;

            if (!img.hasAttribute('alt')) missingAlt++;
          }
          return { total, likelyUpscaled, missingAlt };
        });

        if (imageStats.total > 0 && imageStats.likelyUpscaled > 0) {
          findings.push(this.createFinding(
            'Potentially Low-Resolution Images',
            `${imageStats.likelyUpscaled} of ${imageStats.total} images appear to be displayed larger than their native resolution, which can look blurry.`,
            'minor',
            { images: imageStats }
          ));
          recommendations.push(this.createRecommendation(
            'Improve Image Fidelity',
            'Serve images at an appropriate resolution (including retina/2x) and use responsive image techniques.',
            'medium',
            'medium',
            [
              'Provide higher-resolution source assets for hero images',
              'Use `srcset`/`sizes` for responsive delivery',
              'Avoid stretching raster images beyond native dimensions',
            ]
          ));
        }

        if (imageStats.total > 0 && imageStats.missingAlt > 0) {
          // This is primarily accessibility, but also impacts professionalism/quality.
          findings.push(this.createFinding(
            'Images Missing Alt Attributes',
            `${imageStats.missingAlt} images are missing an alt attribute; this hurts accessibility and content quality.`,
            'minor',
            { images: imageStats }
          ));
        }
      }
    );

    return this.generateReport(findings, recommendations);
  }
}

module.exports = GraphicDesignerAgent;
