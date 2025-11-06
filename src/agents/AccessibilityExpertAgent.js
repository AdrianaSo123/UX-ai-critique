const BaseAgent = require('./BaseAgent');

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
  async analyze(screenshot) {
    const viewport = screenshot.viewport.name;
    
    console.log(`[${this.name}] Analyzing ${viewport} accessibility...`);

    const findings = [];
    const recommendations = [];

    // Color contrast and visual accessibility
    findings.push(
      this.createFinding(
        'Color Contrast Compliance',
        'WCAG AA requires 4.5:1 contrast for normal text, 3:1 for large text',
        'critical'
      )
    );

    findings.push(
      this.createFinding(
        'Color-Only Information',
        'Information should not be conveyed by color alone (affects color-blind users)',
        'major'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Audit Color Contrast Ratios',
        'Ensure all text meets WCAG AA standards (AAA preferred for body text)',
        'critical',
        [
          'Test all text/background combinations with contrast checker tools',
          'Aim for 4.5:1 minimum for normal text (<18pt)',
          'Aim for 3:1 minimum for large text (≥18pt or ≥14pt bold)',
          'Check contrast for UI controls, buttons, and form inputs',
          'Test in different color modes (light/dark theme)',
          'Consider color-blind simulation tools'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Add Non-Color Indicators',
        'Use icons, patterns, or text labels alongside color-coded information',
        'high',
          'medium',
        [
          'Add icons to success/warning/error messages',
          'Use patterns or textures in charts and graphs',
          'Include text labels for status indicators',
          'Add underlines to links (not just color)',
          'Use shapes in addition to colors for data visualization'
        ]
      )
    );

    // Screen reader and semantic HTML
    findings.push(
      this.createFinding(
        'Semantic HTML Structure',
        'Proper HTML5 semantic elements improve screen reader navigation',
        'major'
      )
    );

    findings.push(
      this.createFinding(
        'Alternative Text',
        'All images need descriptive alt text for screen reader users',
        'critical'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Implement Semantic HTML',
        'Use proper HTML5 elements for better accessibility and SEO',
        'high',
          'medium',
        [
          'Use <header>, <nav>, <main>, <article>, <aside>, <footer>',
          'Implement proper heading hierarchy (h1 → h6, no skipping)',
          'Use <button> for clickable actions, <a> for navigation',
          'Add ARIA landmarks for complex layouts',
          'Use <label> elements for all form inputs',
          'Implement proper list structures (<ul>, <ol>) for grouped content'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Add Descriptive Alt Text',
        'Every meaningful image needs alt text; decorative images need alt=""',
        'critical',
        [
          'Write concise, descriptive alt text (avoid "image of")',
          'Use alt="" for purely decorative images',
          'Include text from images in alt attribute',
          'For complex images (charts), provide longer descriptions',
          'Test with screen reader (VoiceOver, NVDA, JAWS)',
          'Add aria-label for icon-only buttons'
        ]
      )
    );

    // Keyboard navigation (viewport-specific)
    if (viewport === 'desktop') {
      findings.push(
        this.createFinding(
          'Keyboard Navigation',
          'All functionality must be accessible via keyboard alone',
          'critical'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Ensure Full Keyboard Access',
          'Test and optimize complete keyboard navigation support',
          'critical',
          [
            'All interactive elements accessible via Tab/Shift+Tab',
            'Visible focus indicators with 3:1 contrast ratio',
            'Logical tab order matching visual layout',
            'Enter/Space activate buttons, Enter submits forms',
            'Escape closes modals/dropdowns',
            'Arrow keys for radio groups and select dropdowns',
            'Skip-to-content link as first focusable element'
          ]
        )
      );
    }

    // Touch accessibility for mobile
    if (viewport === 'mobile') {
      findings.push(
        this.createFinding(
          'Touch Target Size',
          'WCAG requires minimum 44x44px touch targets for mobile',
          'major'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Optimize Touch Targets',
          'Ensure all interactive elements are easy to tap on mobile devices',
          'high',
          'medium',
          [
            'Minimum 44x44px (iOS) or 48x48dp (Android) touch targets',
            'Add sufficient spacing between adjacent touch targets',
            'Increase tap area beyond visible button size if needed',
            'Test with various finger sizes and dexterity levels',
            'Avoid placing critical actions at screen edges'
          ]
        )
      );
    }

    // Forms and input accessibility
    findings.push(
      this.createFinding(
        'Form Accessibility',
        'Forms require proper labels, error messaging, and validation feedback',
        'major'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Enhance Form Accessibility',
        'Implement comprehensive accessible form patterns',
        'high',
          'medium',
        [
          'Associate <label> with every form input (for/id matching)',
          'Use placeholder text as hints, not labels',
          'Add aria-required="true" for required fields',
          'Show inline validation with both visual and text feedback',
          'Group related inputs with <fieldset> and <legend>',
          'Display error messages near relevant fields',
          'Use autocomplete attributes for common fields',
          'Announce validation errors to screen readers (aria-live)'
        ]
      )
    );

    // Motion and animation
    findings.push(
      this.createFinding(
        'Animation & Motion',
        'Respect prefers-reduced-motion for users with vestibular disorders',
        'major'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Implement Reduced Motion Support',
        'Provide alternative experiences for users who prefer reduced motion',
        'high',
          'medium',
        [
          'Detect prefers-reduced-motion media query',
          'Disable or reduce non-essential animations',
          'Replace animations with instant transitions or fades',
          'Maintain functionality without relying on animations',
          'Avoid auto-playing videos or carousels',
          'Provide play/pause controls for all motion content'
        ]
      )
    );

    // Text and readability
    findings.push(
      this.createFinding(
        'Text Resizing',
        'Content should remain usable at 200% zoom without horizontal scrolling',
        'major'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Support Text Scaling',
        'Ensure layouts adapt gracefully to increased text sizes',
        'medium',
        [
          'Use relative units (rem, em) instead of pixels for font sizes',
          'Test at 200% browser zoom level',
          'Avoid fixed-height containers for text content',
          'Ensure no horizontal scrolling at increased zoom',
          'Allow text reflow on mobile when zoomed',
          'Test with browser accessibility features enabled'
        ]
      )
    );

    return this.generateReport(findings, recommendations);
  }
}

module.exports = AccessibilityExpertAgent;
