const BaseAgent = require('./BaseAgent');

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
  async analyze(screenshot) {
    const viewport = screenshot.viewport.name;
    
    console.log(`[${this.name}] Analyzing ${viewport} interactions...`);

    const findings = [];
    const recommendations = [];

    // Mobile-specific interaction analysis
    if (viewport === 'mobile') {
      findings.push(
        this.createFinding(
          'Touch Target Sizing',
          'Interactive elements should be at least 44x44px for comfortable touch interaction',
          'major'
        )
      );

      findings.push(
        this.createFinding(
          'Swipe Gestures',
          'Limited visual affordances for swipe-based navigation detected',
          'minor'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Implement Touch-Friendly Controls',
          'Ensure all buttons, links, and interactive elements meet minimum touch target size of 44x44px with adequate spacing',
          'high',
          'medium',
          [
            'Audit all clickable elements for minimum size compliance',
            'Add padding around smaller interactive elements',
            'Implement visual feedback for touch interactions (active states)',
            'Test with actual device touch interactions'
          ]
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Add Gesture Indicators',
          'Include visual cues for swipeable content (dots, arrows, or edge shadows)',
          'medium',
          'low',
          [
            'Add pagination dots for carousels and galleries',
            'Implement subtle edge gradients for horizontal scrollable content',
            'Include left/right arrows for desktop users',
            'Add haptic feedback for native mobile apps'
          ]
        )
      );
    }

    // Tablet-specific interaction analysis
    if (viewport === 'tablet') {
      findings.push(
        this.createFinding(
          'Hover State Ambiguity',
          'Tablets support both touch and hover interactions - design should accommodate both',
          'minor'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Hybrid Interaction Design',
          'Design interactions that work well for both touch and hover-capable input methods',
          'medium',
          'medium',
          [
            'Avoid hover-only interactions (use tap/click instead)',
            'Implement visible active states for touch feedback',
            'Make dropdowns work with both tap and hover',
            'Test with iPad + trackpad scenarios'
          ]
        )
      );
    }

    // Desktop-specific interaction analysis
    if (viewport === 'desktop') {
      findings.push(
        this.createFinding(
          'Hover State Design',
          'Desktop users expect rich hover feedback for interactive elements',
          'minor'
        )
      );

      findings.push(
        this.createFinding(
          'Keyboard Navigation',
          'Keyboard accessibility requires proper focus indicators and tab order',
          'major'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Enhance Hover Micro-interactions',
          'Add smooth transitions, tooltips, and visual feedback for desktop hover states',
          'high',
          'medium',
          [
            'Implement 0.2-0.3s transitions for hover effects',
            'Add cursor: pointer for all clickable elements',
            'Show tooltips on icon-only buttons',
            'Use color shifts or elevation changes for hover feedback',
            'Add subtle scale or lift effects for cards/buttons'
          ]
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Implement Keyboard Navigation',
          'Ensure complete keyboard accessibility with visible focus indicators',
          'high',
          'medium',
          [
            'Add :focus-visible styles for all interactive elements',
            'Maintain logical tab order (left-to-right, top-to-bottom)',
            'Implement skip-to-content links',
            'Add keyboard shortcuts for common actions',
            'Test navigation with Tab, Shift+Tab, and Arrow keys'
          ]
        )
      );
    }

    // Universal interaction patterns
    findings.push(
      this.createFinding(
        'Loading States',
        'User feedback during async operations improves perceived performance',
        'minor'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Add Loading & Empty States',
        'Implement skeleton screens, spinners, and helpful empty state messages',
        'high',
          'medium',
        [
          'Use skeleton screens for content that takes >500ms to load',
          'Add spinner indicators for buttons with async actions',
          'Show progress bars for multi-step processes',
          'Design helpful empty states with clear next actions',
          'Implement optimistic UI updates where appropriate'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Enhance Button States',
        'Clearly communicate all interaction states (default, hover, active, disabled, loading)',
        'medium',
        'low',
        [
          'Design distinct visual states for each interaction phase',
          'Add loading spinners to buttons during async operations',
          'Disable buttons after click to prevent double-submission',
          'Use reduced opacity and cursor: not-allowed for disabled states',
          'Add success/error feedback after form submissions'
        ]
      )
    );

    return this.generateReport(findings, recommendations);
  }
}

module.exports = InteractionDesignerAgent;
