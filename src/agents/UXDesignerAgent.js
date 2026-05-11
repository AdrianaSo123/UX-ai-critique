const BaseAgent = require('./BaseAgent');
const heuristics = require('./ux-heuristics');
const { withPage } = require('./playwrightUtil');

/**
 * UXDesignerAgent - Analyzes overall user experience and usability
 * Focuses on: user flows, navigation, accessibility, and conversion optimization
 */
class UXDesignerAgent extends BaseAgent {
  constructor() {
    super('UX Designer Agent', 'User Experience & Usability (Nielsen Heuristics)');
    this.heuristics = heuristics;
  }

  /**
   * Analyze screenshot for UX issues and opportunities
   * @param {Object} screenshot - Screenshot data including path and viewport info
   * @param {string} url - The original website URL
   */
  async analyze(screenshot, url) {
    console.log(`${this.name} analyzing ${screenshot.viewport.name} view (dynamic, Nielsen-based)...`);
    const findings = [];
    const recommendations = [];
    await withPage(
      {
        url,
        viewport: screenshot.viewport,
        viewportName: screenshot.viewport.name,
      },
      async page => {
        // 1. Visibility of system status
        const hasLoading = await page.$('[aria-busy="true"], .loading, [role="status"], [aria-live]');
        if (hasLoading) {
          findings.push(this.createFinding(
            'Visibility of System Status',
            'The site provides feedback about ongoing processes (e.g., loading indicators).',
            'minor',
            { framework: 'Nielsen', heuristic: 1, name: heuristics[0].name }
          ));
        } else {
          findings.push(this.createFinding(
            'No Feedback for System Status',
            'No visible feedback for loading or ongoing processes was detected.',
            'major',
            { framework: 'Nielsen', heuristic: 1, name: heuristics[0].name }
          ));
        }

        // 2. Match between system and the real world
        const navText = await page.$$eval('nav a, nav button', els => els.map(e => (e.textContent || '').trim()).filter(Boolean));
        if (navText.some(t => /home|about|contact|services|products|pricing|blog/i.test(t))) {
          findings.push(this.createFinding(
            'Clear Navigation Labels',
            'Navigation uses familiar, user-centered language.',
            'minor',
            { framework: 'Nielsen', heuristic: 2, name: heuristics[1].name }
          ));
        } else if (navText.length) {
          findings.push(this.createFinding(
            'Unfamiliar Navigation Labels',
            'Navigation may use jargon or unclear terms.',
            'major',
            { framework: 'Nielsen', heuristic: 2, name: heuristics[1].name }
          ));
        }

        // 3. User control and freedom
        const hasHome = navText.some(t => /^home$/i.test(t) || /home\b/i.test(t));
        if (hasHome) {
          findings.push(this.createFinding(
            'User Control: Home Link',
            'A Home link is present, allowing users to recover from navigation errors.',
            'minor',
            { framework: 'Nielsen', heuristic: 3, name: heuristics[2].name }
          ));
        }

        // 4. Consistency and standards
        const buttonCount = await page.$$eval('button', els => els.length);
        const linkCount = await page.$$eval('a', els => els.length);
        if (buttonCount > 0 && linkCount > 0) {
          findings.push(this.createFinding(
            'Consistency in Controls',
            'Buttons and links are both present; check for consistent styling and behavior.',
            'minor',
            { framework: 'Nielsen', heuristic: 4, name: heuristics[3].name }
          ));
        }

        // 5. Error prevention
        const requiredFields = await page.$$eval('form [required]', els => els.length);
        if (requiredFields > 0) {
          findings.push(this.createFinding(
            'Error Prevention in Forms',
            'Some form fields are marked as required, helping prevent errors.',
            'minor',
            { framework: 'Nielsen', heuristic: 5, name: heuristics[4].name }
          ));
        }

        // 6. Recognition rather than recall
        const hasBreadcrumbs = await page.$('.breadcrumb, nav[aria-label="breadcrumb"], [aria-label*="breadcrumb" i]');
        if (hasBreadcrumbs) {
          findings.push(this.createFinding(
            'Recognition: Breadcrumbs',
            'Breadcrumb navigation is present, aiding recognition.',
            'minor',
            { framework: 'Nielsen', heuristic: 6, name: heuristics[5].name }
          ));
        }

        // 7. Flexibility and efficiency of use
        const hasSearch = await page.$('input[type="search"], [role="search"] input, [role="search"]');
        if (hasSearch) {
          findings.push(this.createFinding(
            'Efficiency: Search Available',
            'A search feature is present, improving efficiency for expert users.',
            'minor',
            { framework: 'Nielsen', heuristic: 7, name: heuristics[6].name }
          ));
        }

        // 8. Aesthetic and minimalist design
        const elementCount = await page.$$eval('body *', els => els.length);
        if (elementCount > 400) {
          findings.push(this.createFinding(
            'Potential Clutter',
            'The page has a very high number of elements, which may increase cognitive load.',
            'minor',
            { framework: 'Nielsen', heuristic: 8, name: heuristics[7].name, elementCount }
          ));
        }

        // 9. Help users recognize, diagnose, and recover from errors
        const hasError = await page.$('.error, [role="alert"], .alert, .alert-danger');
        if (hasError) {
          findings.push(this.createFinding(
            'Error Feedback Present',
            'Error/alert patterns are present and visible to users (verify clarity and helpfulness).',
            'minor',
            { framework: 'Nielsen', heuristic: 9, name: heuristics[8].name }
          ));
        }

        // 10. Help and documentation
        const hasHelp = await page.$('a[href*="help" i], a[href*="faq" i], a[href*="support" i], [role="doc-help"]');
        if (hasHelp) {
          findings.push(this.createFinding(
            'Help/Documentation Available',
            'Help or documentation links are present.',
            'minor',
            { framework: 'Nielsen', heuristic: 10, name: heuristics[9].name }
          ));
        }
      }
    );
    return this.generateReport(findings, recommendations);
  }
}

module.exports = UXDesignerAgent;
