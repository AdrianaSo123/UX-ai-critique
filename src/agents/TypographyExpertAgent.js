const BaseAgent = require('./BaseAgent');

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
    console.log(`${this.name} analyzing ${screenshot.viewport.name} view...`);

    const findings = [];
    const recommendations = [];

    // Example typography analysis
    
    findings.push(
      this.createFinding(
        'Font Size Analysis',
        `Body text should be at least ${this.standards.minFontSize[screenshot.viewport.name]}px for optimal readability on ${screenshot.viewport.name} devices.`,
        'major'
      )
    );

    findings.push(
      this.createFinding(
        'Line Height',
        'Line height (leading) should be between 1.4-1.6 times the font size for comfortable reading.',
        'minor'
      )
    );

    findings.push(
      this.createFinding(
        'Typographic Hierarchy',
        'Establish clear hierarchy using font size, weight, and spacing to distinguish between headings, subheadings, and body text.',
        'major'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Optimize Body Text Readability',
        'Adjust font size, line height, and line length to meet readability best practices.',
        'high',
        'low',
        [
          `Set minimum font size to ${this.standards.minFontSize[screenshot.viewport.name]}px`,
          'Apply line-height: 1.6 for body text',
          'Limit line length to 45-75 characters',
          'Use comfortable letter-spacing',
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Enhance Typography Hierarchy',
        'Create clear visual distinction between heading levels and body text.',
        'high',
        'medium',
        [
          'Use modular scale for heading sizes (e.g., 1.25, 1.5, 2)',
          'Apply font-weight to differentiate importance',
          'Increase spacing above headings',
          'Consider using different font for headings',
          'Maintain consistent hierarchy across all pages',
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Improve Text Contrast',
        'Ensure text meets WCAG AA standards with minimum 4.5:1 contrast ratio.',
        'critical',
        'low',
        [
          'Test contrast ratios with accessibility tools',
          'Darken text or lighten backgrounds where needed',
          'Avoid gray text below #767676 on white',
          'Consider different color for links',
        ]
      )
    );

    if (screenshot.viewport.name === 'mobile') {
      recommendations.push(
        this.createRecommendation(
          'Mobile Typography Optimization',
          'Optimize typography specifically for mobile reading experience.',
          'medium',
          'low',
          [
            'Increase font size for small screens if needed',
            'Reduce line length for easier reading',
            'Adjust spacing for touch interfaces',
            'Test readability in various lighting conditions',
          ]
        )
      );
    }

    return this.generateReport(findings, recommendations);
  }
}

module.exports = TypographyExpertAgent;
