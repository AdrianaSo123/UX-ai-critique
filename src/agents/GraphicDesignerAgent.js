const BaseAgent = require('./BaseAgent');

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
  async analyze(screenshot) {
    const viewport = screenshot.viewport.name;
    
    console.log(`[${this.name}] Analyzing ${viewport} visual design...`);

    const findings = [];
    const recommendations = [];

    // Color palette and theory
    findings.push(
      this.createFinding(
        'Color Palette Consistency',
        'A cohesive color system strengthens brand identity and improves usability',
        'major'
      )
    );

    findings.push(
      this.createFinding(
        'Color Psychology',
        'Strategic color choices influence user perception and emotional response',
        'minor'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Establish Color System',
        'Create a comprehensive, purposeful color palette',
        'high',
          'medium',
        [
          'Define primary, secondary, and accent colors',
          'Create semantic colors (success, warning, error, info)',
          'Use 60-30-10 rule: 60% dominant, 30% secondary, 10% accent',
          'Generate color scales (100-900) for each main color',
          'Document color usage guidelines',
          'Consider color meaning in different cultures',
          'Use color to guide attention, not just decoration'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Apply Color Psychology',
        'Use color strategically to evoke appropriate emotions and actions',
        'medium',
        [
          'Blue: trust, professionalism (tech, finance, healthcare)',
          'Green: growth, health, eco-friendly (sustainability, wellness)',
          'Red: urgency, passion, energy (call-to-action, alerts)',
          'Yellow: optimism, attention (warnings, highlights)',
          'Purple: creativity, luxury (premium brands)',
          'Orange: friendly, energetic (social, entertainment)',
          'Use color to create visual hierarchy and focus'
        ]
      )
    );

    // Visual hierarchy and composition
    findings.push(
      this.createFinding(
        'Visual Hierarchy',
        'Clear visual hierarchy guides users through content and actions',
        'major'
      )
    );

    findings.push(
      this.createFinding(
        'White Space Usage',
        'Strategic white space improves readability and visual breathing room',
        'minor'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Strengthen Visual Hierarchy',
        'Use size, color, contrast, and spacing to guide attention',
        'high',
          'medium',
        [
          'Make primary actions stand out (size, color, placement)',
          'Use consistent heading sizes to show content structure',
          'Apply the F-pattern or Z-pattern for content layout',
          'Increase contrast for important elements',
          'Group related content with proximity and borders',
          'Use visual weight to indicate importance',
          'Test by squinting at design - hierarchy should remain clear'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Optimize White Space',
        'Balance content density with breathing room for clarity',
        'medium',
        [
          'Increase line-height for better readability (1.5-1.8 for body text)',
          'Add padding around clickable elements',
          'Use margins to separate distinct content sections',
          'Leave generous whitespace around headlines',
          'Avoid cramming too much content in limited space',
          'Use white space to create natural visual flow',
          'Consider different spacing scales for mobile vs desktop'
        ]
      )
    );

    // Imagery and graphics
    findings.push(
      this.createFinding(
        'Image Quality',
        'High-quality, purposeful imagery enhances professionalism and engagement',
        'major'
      )
    );

    findings.push(
      this.createFinding(
        'Visual Consistency',
        'Consistent image style (photography, illustration, icons) strengthens brand',
        'minor'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Implement Image Strategy',
        'Use high-quality, relevant imagery that supports content goals',
        'high',
          'medium',
        [
          'Use high-resolution images (2x for retina displays)',
          'Choose authentic photos over generic stock imagery',
          'Apply consistent filters or color grading',
          'Ensure images have clear purpose and context',
          'Optimize image file sizes for web performance',
          'Consider custom illustrations for unique brand identity',
          'Add loading states for images (blur-up, skeleton screens)'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Establish Icon System',
        'Create or adopt a cohesive icon set with consistent style',
        'medium',
        [
          'Use single icon family (outline vs filled, rounded vs sharp)',
          'Maintain consistent icon sizes and stroke weights',
          'Ensure icons are recognizable at small sizes',
          'Use icons to support text, not replace it',
          'Consider accessibility (icons need labels)',
          'Popular systems: Heroicons, Feather, Material Icons',
          'Create custom icons for unique brand needs'
        ]
      )
    );

    // Layout and grid systems
    if (viewport === 'desktop') {
      findings.push(
        this.createFinding(
          'Grid System',
          'A consistent grid structure creates visual harmony and balance',
          'minor'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Implement Grid System',
          'Use a flexible grid to organize content and maintain alignment',
          'medium',
          [
            'Use 12-column grid for flexible layouts',
            'Define consistent gutter width (20-30px)',
            'Align elements to grid for visual harmony',
            'Use CSS Grid or Flexbox for implementation',
            'Break the grid intentionally for emphasis',
            'Consider asymmetric grids for visual interest',
            'Document grid specifications in design system'
          ]
        )
      );
    }

    // Mobile-specific visual design
    if (viewport === 'mobile') {
      findings.push(
        this.createFinding(
          'Mobile Visual Simplicity',
          'Limited screen space requires focused, minimal visual design',
          'major'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Simplify Mobile Visuals',
          'Prioritize clarity and functionality on small screens',
          'high',
          'medium',
          [
            'Reduce visual complexity and decorative elements',
            'Use larger, bolder typography for readability',
            'Increase contrast for outdoor/sunlight viewing',
            'Simplify navigation with clear icons',
            'Use progressive disclosure to reduce clutter',
            'Optimize hero images for mobile aspect ratios',
            'Consider vertical (9:16) composition for mobile'
          ]
        )
      );
    }

    // Brand consistency
    findings.push(
      this.createFinding(
        'Brand Identity',
        'Consistent visual language reinforces brand recognition and trust',
        'major'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Strengthen Brand Consistency',
        'Apply cohesive visual identity across all touchpoints',
        'high',
          'medium',
        [
          'Define brand colors, fonts, and visual style',
          'Create style guide or design system documentation',
          'Use consistent button styles, form inputs, and components',
          'Apply brand personality (playful, serious, innovative, traditional)',
          'Ensure logo usage follows brand guidelines',
          'Maintain consistent photography or illustration style',
          'Review all pages for visual consistency'
        ]
      )
    );

    // Modern design trends and polish
    findings.push(
      this.createFinding(
        'Visual Polish',
        'Subtle details like shadows, borders, and animations elevate perceived quality',
        'minor'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Add Visual Refinement',
        'Enhance design with subtle, purposeful details',
        'medium',
        [
          'Use subtle shadows for depth (avoid heavy drop shadows)',
          'Add smooth transitions and micro-animations (0.2-0.3s)',
          'Apply border-radius consistently (4px, 8px, or 16px)',
          'Use gradient overlays on hero images for text readability',
          'Add subtle hover effects for interactive elements',
          'Consider glassmorphism or neumorphism for modern look',
          'Polish loading states and empty states',
          'Test on high-DPI displays for sharp rendering'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Implement Dark Mode',
        'Offer dark theme option for user preference and accessibility',
        'low',
        [
          'Use CSS custom properties for theme switching',
          'Design with OLED screens in mind (true black)',
          'Reduce contrast slightly in dark mode (avoid pure white text)',
          'Test with prefers-color-scheme media query',
          'Adjust shadows and borders for dark backgrounds',
          'Provide manual toggle in addition to system preference',
          'Ensure all UI elements work in both themes'
        ]
      )
    );

    return this.generateReport(findings, recommendations);
  }
}

module.exports = GraphicDesignerAgent;
