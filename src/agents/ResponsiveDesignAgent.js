const BaseAgent = require('./BaseAgent');

/**
 * Responsive Design Agent
 * Analyzes cross-device compatibility, breakpoint optimization, and fluid layouts
 */
class ResponsiveDesignAgent extends BaseAgent {
  constructor() {
    super('Responsive Design Agent', 'Cross-Device & Breakpoint Optimization');
  }

  /**
   * Analyze responsive design patterns
   * @param {Object} screenshot - Screenshot data with path and viewport info
   */
  async analyze(screenshot) {
    const viewport = screenshot.viewport.name;
    
    console.log(`[${this.name}] Analyzing ${viewport} responsive design...`);

    const findings = [];
    const recommendations = [];

    // Mobile-first responsive analysis
    if (viewport === 'mobile') {
      findings.push(
        this.createFinding(
          'Mobile Layout Optimization',
          'Mobile viewports require single-column layouts and optimized touch interactions',
          'major'
        )
      );

      findings.push(
        this.createFinding(
          'Horizontal Scrolling',
          'Content should fit within viewport width without horizontal scrolling',
          'critical'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Implement Mobile-First Design',
          'Start with mobile layout and progressively enhance for larger screens',
          'high',
          'medium',
          [
            'Use single-column layout for primary content',
            'Stack navigation items vertically or in hamburger menu',
            'Increase font sizes for better mobile readability (16px minimum)',
            'Optimize images for mobile bandwidth',
            'Use viewport meta tag: width=device-width, initial-scale=1',
            'Test on actual mobile devices, not just desktop browser resize'
          ]
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Prevent Horizontal Scrolling',
          'Ensure all content fits within mobile viewport width',
          'critical',
          [
            'Set max-width: 100% on images and media',
            'Use CSS breakpoints to adjust layout at narrow widths',
            'Avoid fixed-width containers that exceed viewport',
            'Test with Chrome DevTools mobile viewport',
            'Use overflow-x: hidden carefully (can hide important content)',
            'Implement responsive tables (stack or horizontal scroll container)'
          ]
        )
      );

      findings.push(
        this.createFinding(
          'Mobile Performance',
          'Mobile devices have limited bandwidth and processing power',
          'major'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Optimize Mobile Performance',
          'Reduce payload and improve load times for mobile connections',
          'high',
          'medium',
          [
            'Implement responsive images with srcset/sizes',
            'Use modern image formats (WebP, AVIF) with fallbacks',
            'Lazy load below-the-fold images and content',
            'Minimize JavaScript execution on mobile',
            'Use mobile-specific media queries to load smaller assets',
            'Test on 3G connection speeds'
          ]
        )
      );
    }

    // Tablet-specific responsive analysis
    if (viewport === 'tablet') {
      findings.push(
        this.createFinding(
          'Tablet Layout Strategy',
          'Tablets benefit from hybrid layouts between mobile and desktop',
          'minor'
        )
      );

      findings.push(
        this.createFinding(
          'Orientation Changes',
          'Tablet users frequently switch between portrait and landscape orientations',
          'major'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Optimize Tablet Layout',
          'Design flexible layouts that work in both portrait and landscape',
          'medium',
          [
            'Use 2-column layouts where appropriate',
            'Implement collapsible side navigation',
            'Adjust grid systems for tablet breakpoints (768px - 1024px)',
            'Consider both touch and pointer interactions',
            'Test both orientations (portrait 768px, landscape 1024px)',
            'Use CSS Grid for flexible multi-column layouts'
          ]
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Handle Orientation Changes',
          'Ensure smooth transitions between portrait and landscape modes',
          'medium',
          [
            'Use CSS orientation media queries (@media orientation: landscape)',
            'Reflow content appropriately in each orientation',
            'Maintain scroll position during orientation change',
            'Adjust image aspect ratios for different orientations',
            'Test with iOS Safari and Android Chrome',
            'Ensure fixed elements reposition correctly'
          ]
        )
      );
    }

    // Desktop responsive analysis
    if (viewport === 'desktop') {
      findings.push(
        this.createFinding(
          'Large Screen Layout',
          'Desktop viewports should use multi-column layouts and maximize screen space',
          'minor'
        )
      );

      findings.push(
        this.createFinding(
          'Ultra-Wide Displays',
          'Content should not become uncomfortably wide on large monitors',
          'major'
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Optimize Desktop Layout',
          'Take advantage of desktop screen real estate while maintaining readability',
          'medium',
          [
            'Use multi-column layouts (2-4 columns)',
            'Implement sidebar navigation for easy access',
            'Show additional content (related articles, metadata)',
            'Use hover states and tooltips for enhanced interactions',
            'Implement keyboard shortcuts for power users',
            'Consider split-screen or dashboard layouts'
          ]
        )
      );

      recommendations.push(
        this.createRecommendation(
          'Set Maximum Content Width',
          'Constrain content width for comfortable reading on large displays',
          'high',
          'medium',
          [
            'Set max-width on main content area (1200-1440px recommended)',
            'Center content with auto margins',
            'Keep text line length between 50-75 characters',
            'Use wider breakpoints for navigation and backgrounds',
            'Test on 4K displays and ultra-wide monitors',
            'Consider using CSS Container Queries for component-level responsiveness'
          ]
        )
      );
    }

    // Universal responsive design principles
    findings.push(
      this.createFinding(
        'Breakpoint Strategy',
        'Strategic breakpoints ensure smooth transitions across all device sizes',
        'major'
      )
    );

    findings.push(
      this.createFinding(
        'Flexible Units',
        'Relative units (rem, em, %, vw/vh) create more adaptable layouts',
        'minor'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Implement Strategic Breakpoints',
        'Define breakpoints based on content needs, not specific devices',
        'high',
          'medium',
        [
          'Common breakpoints: 640px (mobile), 768px (tablet), 1024px (desktop), 1280px (large)',
          'Test between breakpoints to catch edge cases',
          'Use min-width (mobile-first) rather than max-width',
          'Consider intermediate breakpoints for edge cases',
          'Use em units for media queries (better for text scaling)',
          'Document breakpoint strategy in design system'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Use Flexible CSS Units',
        'Implement relative units for fluid, scalable designs',
        'medium',
        [
          'Use rem for font sizes (scalable, predictable)',
          'Use em for spacing relative to font size',
          'Use % for flexible container widths',
          'Use vw/vh for full-viewport elements',
          'Use CSS clamp() for fluid typography',
          'Avoid fixed pixel values for layout containers',
          'Test with browser zoom at 200%'
        ]
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Implement Responsive Images',
        'Serve appropriately sized images for each device',
        'high',
          'medium',
        [
          'Use <picture> element for art direction',
          'Implement srcset and sizes attributes',
          'Serve WebP with JPEG/PNG fallback',
          'Use image CDN with automatic resizing',
          'Implement lazy loading for below-fold images',
          'Consider CSS image-set() for background images',
          'Test image quality at different viewport sizes'
        ]
      )
    );

    findings.push(
      this.createFinding(
        'Touch vs Mouse Interaction',
        'Design patterns should accommodate both touch and mouse input',
        'major'
      )
    );

    recommendations.push(
      this.createRecommendation(
        'Support Multiple Input Methods',
        'Design flexible interactions that work across input types',
        'medium',
        [
          'Use @media (hover: hover) to detect hover-capable devices',
          'Provide tap-friendly alternatives to hover interactions',
          'Size touch targets appropriately (44px minimum)',
          'Avoid hover-only critical functionality',
          'Support both click and touch events',
          'Test with touch-enabled laptops and hybrid devices'
        ]
      )
    );

    return this.generateReport(findings, recommendations);
  }
}

module.exports = ResponsiveDesignAgent;
