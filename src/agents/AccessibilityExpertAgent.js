const BaseAgent = require('./BaseAgent');
const { withPage } = require('./playwrightUtil');

/**
 * Accessibility Expert Agent
 * Evaluates WCAG compliance, inclusive design, and assistive technology compatibility
 */
class AccessibilityExpertAgent extends BaseAgent {
  constructor() {
    super('Accessibility Expert Agent', 'WCAG Compliance & Inclusive Design');
  }

  /**
   * Analyze accessibility compliance
   * @param {Object} screenshot - Screenshot data with path and viewport info
   */
  async analyze(screenshot, url) {
    const viewport = screenshot.viewport.name;
    
    console.log(`[${this.name}] Analyzing ${viewport} accessibility...`);

    const findings = [];
    const recommendations = [];

    await withPage(
      {
        url,
        viewport: screenshot.viewport,
        viewportName: viewport,
      },
      async page => {
        const a11y = await page.evaluate(() => {
          const visibleTextEls = Array.from(document.querySelectorAll('p, a, li, span, label, button'))
            .filter(el => (el.textContent || '').trim().length > 10)
            .slice(0, 60);

          const parseRGB = s => {
            const m = (s || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
            if (!m) return null;
            return {
              r: Number(m[1]),
              g: Number(m[2]),
              b: Number(m[3]),
              a: m[4] !== undefined ? Number(m[4]) : 1,
            };
          };

          const srgbToLin = c => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          };

          const luminance = rgb => 0.2126 * srgbToLin(rgb.r) + 0.7152 * srgbToLin(rgb.g) + 0.0722 * srgbToLin(rgb.b);

          const contrastRatio = (fg, bg) => {
            const L1 = luminance(fg);
            const L2 = luminance(bg);
            const hi = Math.max(L1, L2);
            const lo = Math.min(L1, L2);
            return (hi + 0.05) / (lo + 0.05);
          };

          const effectiveBg = el => {
            let cur = el;
            while (cur && cur !== document.documentElement) {
              const bg = parseRGB(getComputedStyle(cur).backgroundColor);
              if (bg && bg.a !== 0) return bg;
              cur = cur.parentElement;
            }
            return parseRGB(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
          };

          let lowContrastCount = 0;
          for (const el of visibleTextEls) {
            const fg = parseRGB(getComputedStyle(el).color);
            if (!fg) continue;
            const bg = effectiveBg(el);
            if (!bg) continue;
            const ratio = contrastRatio(fg, bg);
            if (ratio < 4.5) lowContrastCount++;
          }

          const imgs = Array.from(document.images || []);
          const missingAlt = imgs.filter(img => img.getBoundingClientRect().width > 0 && !img.hasAttribute('alt')).length;

          const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => Number(h.tagName.substring(1)));
          let headingSkips = 0;
          for (let i = 1; i < headings.length; i++) {
            if (headings[i] - headings[i - 1] > 1) headingSkips++;
          }

          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'));
          const unlabeled = inputs.filter(input => {
            const id = input.getAttribute('id');
            const hasLabelFor = id ? !!document.querySelector(`label[for="${CSS.escape(id)}"]`) : false;
            const wrappedLabel = !!input.closest('label');
            const ariaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
            return !(hasLabelFor || wrappedLabel || ariaLabel);
          }).length;

          const hasReducedMotion = (() => {
            for (const sheet of Array.from(document.styleSheets)) {
              let rules;
              try { rules = sheet.cssRules; } catch { continue; }
              if (!rules) continue;
              for (const rule of Array.from(rules)) {
                if (rule.type === CSSRule.MEDIA_RULE && (rule.conditionText || '').includes('prefers-reduced-motion')) {
                  return true;
                }
              }
            }
            return false;
          })();

          const hasSkipLink = !!document.querySelector('a[href^="#"]');

          return {
            lowContrastCount,
            sampledTextCount: visibleTextEls.length,
            missingAlt,
            headingSkips,
            unlabeled,
            totalInputs: inputs.length,
            hasReducedMotion,
            hasSkipLink,
          };
        });

        if (a11y.sampledTextCount && a11y.lowContrastCount > 0) {
          findings.push(this.createFinding(
            'Low Text Contrast Detected',
            `${a11y.lowContrastCount} of ${a11y.sampledTextCount} sampled text elements appear below ~4.5:1 contrast (best-effort estimate).`,
            a11y.lowContrastCount > 10 ? 'critical' : 'major',
            { wcag: '1.4.3', sample: a11y }
          ));
          recommendations.push(this.createRecommendation(
            'Fix Color Contrast',
            'Adjust text/background colors to meet WCAG AA (4.5:1 for normal text).',
            'critical',
            'medium',
            [
              'Use a contrast checker to validate key text styles',
              'Darken text or lighten backgrounds for body copy',
              'Re-check links, disabled states, and form hints',
            ]
          ));
        }

        if (a11y.missingAlt > 0) {
          findings.push(this.createFinding(
            'Missing Alt Attributes',
            `${a11y.missingAlt} image(s) are missing an ` + 'alt' + ` attribute (decorative images should still use alt="").`,
            'critical',
            { wcag: '1.1.1', sample: a11y }
          ));
          recommendations.push(this.createRecommendation(
            'Add Alt Text',
            'Add meaningful alt text to informative images and empty alt to decorative images.',
            'critical',
            'low',
            [
              'Add alt text that conveys purpose, not appearance',
              'Use alt="" for decorative images',
              'Ensure icon-only buttons have aria-label',
            ]
          ));
        }

        if (a11y.headingSkips > 0) {
          findings.push(this.createFinding(
            'Heading Hierarchy Issues',
            `Detected ${a11y.headingSkips} heading level skip(s) (e.g., h2 → h4), which can confuse assistive tech navigation.`,
            'major',
            { wcag: '1.3.1', sample: a11y }
          ));
        }

        if (a11y.totalInputs > 0 && a11y.unlabeled > 0) {
          findings.push(this.createFinding(
            'Form Inputs Missing Accessible Labels',
            `${a11y.unlabeled} of ${a11y.totalInputs} inputs appear unlabeled (no <label>, aria-label, or aria-labelledby).`,
            'major',
            { wcag: '3.3.2', sample: a11y }
          ));
          recommendations.push(this.createRecommendation(
            'Label Form Controls',
            'Ensure every input has a programmatically-associated label.',
            'high',
            'low',
            [
              'Use <label for="id"> and matching input id',
              'Avoid placeholder-only labels',
              'Use aria-label only when a visible label is not feasible',
            ]
          ));
        }

        if (!a11y.hasReducedMotion) {
          findings.push(this.createFinding(
            'No Reduced Motion Support Detected',
            'No `prefers-reduced-motion` media query detected (best-effort check).',
            'minor',
            { wcag: '2.3.3', sample: a11y }
          ));
        }

        if (viewport === 'desktop' && !a11y.hasSkipLink) {
          findings.push(this.createFinding(
            'Missing Skip Link',
            'No obvious skip-to-content link detected; this can slow keyboard navigation.',
            'minor',
            { wcag: '2.4.1', sample: a11y }
          ));
        }
      }
    );

    return this.generateReport(findings, recommendations);
  }
}

module.exports = AccessibilityExpertAgent;
