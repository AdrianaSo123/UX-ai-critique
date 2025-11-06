const BaseAgent = require('./BaseAgent');

/**
 * UXDesignerAgent - Analyzes overall user experience and usability
 * Focuses on: user flows, navigation, accessibility, and conversion optimization
 */
class UXDesignerAgent extends BaseAgent {
  constructor() {
    super('UX Designer Agent', 'User Experience & Usability');
    
    // UX best practices checklist
    this.checkpoints = {
      navigation: ['clear hierarchy', 'visible navigation', 'breadcrumbs'],
      cta: ['clear call-to-action', 'button visibility', 'action hierarchy'],
      content: ['content hierarchy', 'readability', 'white space'],
      forms: ['field labels', 'error messages', 'validation'],
    };
  }

  /**
   * Analyze screenshot for UX issues and opportunities
   * @param {Object} screenshot - Screenshot data including path and viewport info
   * @param {string} url - The original website URL
   */
  async analyze(screenshot, url) {
    console.log(`${this.name} analyzing ${screenshot.viewport.name} view...`);

    const findings = [];
    const recommendations = [];

    // Simulate UX analysis (in production, this would use AI/computer vision)
    // For now, we'll provide example structure for different viewport analyses
    
    if (screenshot.viewport.name === 'mobile') {
      findings.push(
        this.createFinding(
          'Touch Target Sizes',
          'Some interactive elements may be too small for comfortable mobile interaction. Ensure touch targets are at least 44x44 pixels.',
          'major'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Optimize Mobile Touch Targets',
          'Increase button and link sizes for mobile devices to meet minimum touch target requirements.',
          'high',
          'low',
          [
            'Review all interactive elements',
            'Apply minimum 44x44px touch target size',
            'Add adequate spacing between interactive elements',
            'Test with real users on mobile devices',
          ]
        )
      );
    }

    if (screenshot.viewport.name === 'desktop') {
      findings.push(
        this.createFinding(
          'Information Hierarchy',
          'The visual hierarchy could be improved to guide users through key content more effectively.',
          'minor'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Enhance Visual Hierarchy',
          'Strengthen the content hierarchy using size, weight, and spacing to guide user attention.',
          'medium',
          'medium',
          [
            'Use larger headings for primary content',
            'Increase spacing between sections',
            'Consider F-pattern or Z-pattern layout',
            'Highlight primary call-to-action',
          ]
        )
      );
    }

    // Add general UX findings applicable to all viewports
    findings.push(
      this.createFinding(
        'User Flow Analysis',
        'Review the primary user journey to ensure logical flow and minimal friction points.',
        'minor'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Simplify User Journey',
        'Streamline the path to key actions by reducing steps and cognitive load.',
        'high',
        'high',
        [
          'Map current user journeys',
          'Identify friction points and drop-off areas',
          'Reduce form fields and required steps',
          'Add progress indicators for multi-step processes',
          'Conduct user testing to validate improvements',
        ]
      )
    );

    return this.generateReport(findings, recommendations);
  }
}

module.exports = UXDesignerAgent;
