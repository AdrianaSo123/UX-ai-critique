const BaseAgent = require('./BaseAgent');
const { withPage } = require('./playwrightUtil');

/**
 * Interaction Designer Agent
 * Analyzes user interaction patterns, micro-interactions, and engagement flows
 */
class InteractionDesignerAgent extends BaseAgent {
  constructor() {
    super('Interaction Designer Agent', 'User Interaction & Engagement Patterns');
  }

  /**
   * Analyze interaction design patterns
   * @param {Object} screenshot - Screenshot data with path and viewport info
   */
  async analyze(screenshot, url) {
    const viewport = screenshot.viewport.name;
    
    console.log(`[${this.name}] Analyzing ${viewport} interactions...`);

    const findings = [];
    const recommendations = [];

    await withPage(
      {
        url,
        viewport: screenshot.viewport,
        viewportName: viewport,
      },
      async page => {
        // Touch target sizing (primarily relevant on mobile/tablet)
        const minTarget = 44;
        const tapStats = await page.evaluate(minPx => {
          const candidates = Array.from(
            document.querySelectorAll('a, button, input, select, textarea, [role="button"], [tabindex]')
          ).filter(el => {
            const style = getComputedStyle(el);
            if (style.visibility === 'hidden' || style.display === 'none') return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });

          let tooSmall = 0;
          let total = 0;
          let minW = Infinity;
          let minH = Infinity;

          for (const el of candidates) {
            const rect = el.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            if (!w || !h) continue;
            total++;
            minW = Math.min(minW, w);
            minH = Math.min(minH, h);
            if (w < minPx || h < minPx) tooSmall++;
          }

          return {
            total,
            tooSmall,
            minW: Number.isFinite(minW) ? Math.round(minW) : null,
            minH: Number.isFinite(minH) ? Math.round(minH) : null,
          };
        }, minTarget);

        if (viewport !== 'desktop' && tapStats.total > 0) {
          const ratio = tapStats.tooSmall / tapStats.total;
          if (ratio > 0.15) {
            findings.push(this.createFinding(
              'Touch Target Sizing',
              `${tapStats.tooSmall} of ${tapStats.total} interactive elements are smaller than ${minTarget}x${minTarget}px (min detected: ${tapStats.minW}x${tapStats.minH}).`,
              ratio > 0.35 ? 'major' : 'minor'
            ));
            recommendations.push(this.createRecommendation(
              'Improve Touch Targets',
              `Increase tap target size to at least ${minTarget}x${minTarget}px and add spacing between adjacent targets.`,
              'high',
              'medium',
              [
                'Audit primary CTAs, nav items, and form controls',
                `Increase padding to reach ${minTarget}px minimum size`,
                'Add spacing between adjacent links/buttons',
                'Verify on real devices (not only emulator)',
              ]
            ));
          }
        }

        // Focus visibility (keyboard navigation) — detect any :focus-visible rules or outline suppression
        const focusSignals = await page.evaluate(() => {
          let hasFocusVisibleRule = false;
          let suppressesOutline = false;

          const styleSheets = Array.from(document.styleSheets);
          for (const sheet of styleSheets) {
            let rules;
            try {
              rules = sheet.cssRules;
            } catch {
              continue;
            }
            if (!rules) continue;

            for (const rule of Array.from(rules)) {
              const text = rule.cssText || '';
              if (text.includes(':focus-visible') || text.includes(':focus')) hasFocusVisibleRule = true;
              if (text.includes('outline: none') || text.includes('outline:none')) suppressesOutline = true;
            }
          }
          return { hasFocusVisibleRule, suppressesOutline };
        });

        if (viewport === 'desktop') {
          if (focusSignals.suppressesOutline && !focusSignals.hasFocusVisibleRule) {
            findings.push(this.createFinding(
              'Keyboard Focus Visibility',
              'The site appears to suppress outlines without providing explicit focus styling, which can break keyboard navigation.',
              'major'
            ));
            recommendations.push(this.createRecommendation(
              'Add Focus Styles',
              'Ensure all interactive elements have visible `:focus-visible` styles with sufficient contrast.',
              'high',
              'medium',
              [
                'Add `:focus-visible` styles for links, buttons, and inputs',
                'Avoid blanket `outline: none` without replacements',
                'Test tab order and focus visibility end-to-end',
              ]
            ));
          }
        }

        // Hover affordances (desktop): detect presence of :hover rules
        if (viewport === 'desktop') {
          const hasHoverRules = await page.evaluate(() => {
            const styleSheets = Array.from(document.styleSheets);
            for (const sheet of styleSheets) {
              let rules;
              try {
                rules = sheet.cssRules;
              } catch {
                continue;
              }
              if (!rules) continue;
              for (const rule of Array.from(rules)) {
                const t = rule.cssText || '';
                if (t.includes(':hover')) return true;
              }
            }
            return false;
          });

          if (!hasHoverRules) {
            findings.push(this.createFinding(
              'Hover Feedback',
              'No CSS `:hover` rules were detected; interactive affordances may feel flat on desktop.',
              'minor'
            ));
          }
        }

        // Loading/status patterns
        const hasStatus = await page.$('[role="status"], [aria-live], .loading, .spinner');
        if (!hasStatus) {
          findings.push(this.createFinding(
            'Loading States',
            'No obvious loading/status patterns detected; users may not get feedback during async operations.',
            'minor'
          ));
        }
      }
    );

    return this.generateReport(findings, recommendations);
  }
}

module.exports = InteractionDesignerAgent;
