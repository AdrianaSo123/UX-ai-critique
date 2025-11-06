/**
 * BaseAgent - Abstract base class for all design analysis agents
 * Each specialized agent extends this class and implements the analyze method
 */
class BaseAgent {
  constructor(name, specialty) {
    this.name = name;
    this.specialty = specialty;
    this.version = '1.0.0';
  }

  /**
   * Analyze a screenshot and provide feedback
   * Must be implemented by subclasses
   * @param {Object} screenshot - Screenshot data including path and viewport info
   * @param {string} url - The original website URL
   * @returns {Object} Analysis results with recommendations
   */
  async analyze(screenshot, url) {
    throw new Error('analyze() must be implemented by subclass');
  }

  /**
   * Generate a structured report section
   * @param {Array} findings - Array of finding objects
   * @param {Array} recommendations - Array of recommendation objects
   */
  generateReport(findings, recommendations) {
    return {
      agent: this.name,
      specialty: this.specialty,
      version: this.version,
      timestamp: new Date().toISOString(),
      findings: findings,
      recommendations: recommendations,
      summary: this.generateSummary(findings, recommendations),
    };
  }

  /**
   * Generate a summary of findings
   * @param {Array} findings - Array of findings
   * @param {Array} recommendations - Array of recommendations
   */
  generateSummary(findings, recommendations) {
    const criticalIssues = findings.filter(f => f.severity === 'critical').length;
    const majorIssues = findings.filter(f => f.severity === 'major').length;
    const minorIssues = findings.filter(f => f.severity === 'minor').length;

    return {
      totalFindings: findings.length,
      totalRecommendations: recommendations.length,
      criticalIssues,
      majorIssues,
      minorIssues,
    };
  }

  /**
   * Create a finding object with consistent structure
   * @param {string} title - Finding title
   * @param {string} description - Detailed description
   * @param {string} severity - 'critical', 'major', or 'minor'
   * @param {Object} location - Location info (optional)
   */
  createFinding(title, description, severity = 'minor', location = null) {
    return {
      title,
      description,
      severity,
      location,
      agent: this.name,
    };
  }

  /**
   * Create a recommendation object with consistent structure
   * @param {string} title - Recommendation title
   * @param {string} description - Detailed description
   * @param {string} priority - 'high', 'medium', or 'low'
   * @param {string} effort - 'low', 'medium', or 'high'
   * @param {Array} implementation - Implementation steps
   */
  createRecommendation(title, description, priority = 'medium', effort = 'medium', implementation = []) {
    return {
      title,
      description,
      priority,
      effort,
      implementation,
      agent: this.name,
    };
  }
}

module.exports = BaseAgent;
