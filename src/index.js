const ScreenshotCapture = require('./capture/screenshotCapture');
const UXDesignerAgent = require('./agents/UXDesignerAgent');
const TypographyExpertAgent = require('./agents/TypographyExpertAgent');
const InteractionDesignerAgent = require('./agents/InteractionDesignerAgent');
const GraphicDesignerAgent = require('./agents/GraphicDesignerAgent');
const ResponsiveDesignAgent = require('./agents/ResponsiveDesignAgent');
const AccessibilityExpertAgent = require('./agents/AccessibilityExpertAgent');
const { closeSharedBrowser, withPage } = require('./agents/playwrightUtil');
const fs = require('fs').promises;
const path = require('path');

/**
 * Main UX Design Analyzer
 * Orchestrates screenshot capture and multi-agent analysis
 */
class UXDesignAnalyzer {
  constructor() {
    this.capture = new ScreenshotCapture();
    this.agents = [
      new UXDesignerAgent(),
      new TypographyExpertAgent(),
      new InteractionDesignerAgent(),
      new GraphicDesignerAgent(),
      new ResponsiveDesignAgent(),
      new AccessibilityExpertAgent(),
    ];
    this.reportsDir = path.join(__dirname, '../reports');
  }

  /**
   * Analyze a website with all available agents
   * @param {string} url - Website URL to analyze
   * @param {Object} options - Analysis options
   */
  async analyzeWebsite(url, options = {}) {
    console.log('\n========================================');
    console.log('🔍 UX DESIGN ANALYZER');
    console.log('========================================\n');
    console.log(`Target URL: ${url}\n`);

    const agentTimeoutMs = Number(options.agentTimeoutMs || process.env.AGENT_TIMEOUT_MS || 90000);
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    function withTimeout(promise, timeoutMs, label) {
      const ms = Number(timeoutMs);
      if (!Number.isFinite(ms) || ms <= 0) return promise;

      return Promise.race([
        promise,
        new Promise((_, reject) => {
          const timer = setTimeout(() => {
            const message = label ? `${label} timed out after ${ms}ms` : `Timed out after ${ms}ms`;
            reject(new Error(message));
          }, ms);
          if (typeof timer.unref === 'function') timer.unref();
        }),
      ]);
    }

    async function bestEffort(promise, timeoutMs) {
      try {
        await withTimeout(promise, timeoutMs, 'Cleanup');
      } catch {
        // Best-effort cleanup; never block completion.
      }
    }

    function emitProgress(payload) {
      if (!onProgress) return;
      try {
        onProgress(payload);
      } catch {
        // never fail the analysis due to progress callbacks
      }
    }

    try {
      // Step 1: Capture screenshots
      console.log('📸 Step 1: Capturing Screenshots...');
      console.log('─────────────────────────────────────');
      emitProgress({ step: 'screenshots', message: 'Capturing screenshots...', progress: 0 });
      const screenshots = await this.capture.captureWebsite(url, options);

      const totalSteps = 2 + (Object.keys(screenshots).length * this.agents.length);
      const progressState = { completed: 1, total: totalSteps };
      emitProgress({
        step: 'analysis',
        message: `Screenshots captured (${Object.keys(screenshots).length} viewport${Object.keys(screenshots).length === 1 ? '' : 's'})`,
        progress: Math.round((progressState.completed / progressState.total) * 100),
      });

      // Step 2: Run agent analysis
      console.log('🤖 Step 2: Running Agent Analysis...');
      console.log('─────────────────────────────────────');
      const analysis = await this.runAgentAnalysis(screenshots, url, {
        agentTimeoutMs,
        progressState,
        emitProgress,
      });

      // Step 3: Generate comprehensive report
      console.log('📊 Step 3: Generating Report...');
      console.log('─────────────────────────────────────');
      emitProgress({ step: 'report', message: 'Generating report...', progress: Math.round((progressState.completed / progressState.total) * 100) });
      const report = await this.generateReport(url, screenshots, analysis);

      progressState.completed = progressState.total;
      emitProgress({ step: 'done', message: 'Finalizing...', progress: 100 });

      console.log('\n✅ Analysis Complete!\n');
      console.log(`📁 Report saved to: ${report.path}\n`);
      console.log('========================================\n');

      return report;

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    } finally {
      await bestEffort(this.capture.close(), 10000);
      await bestEffort(closeSharedBrowser(), 10000);
    }
  }

  /**
   * Run all agents on the captured screenshots
   * @param {Object} screenshots - Screenshot data from capture
   * @param {string} url - Original URL
   */
  async runAgentAnalysis(screenshots, url, options = {}) {
    const results = {
      byViewport: {},
      byAgent: {},
    };

    const agentTimeoutMs = Number(options.agentTimeoutMs || 90000);
    const progressState = options.progressState;
    const emitProgress = typeof options.emitProgress === 'function' ? options.emitProgress : null;

    function withTimeout(promise, timeoutMs, label) {
      const ms = Number(timeoutMs);
      if (!Number.isFinite(ms) || ms <= 0) return promise;

      return Promise.race([
        promise,
        new Promise((_, reject) => {
          const timer = setTimeout(() => {
            const message = label ? `${label} timed out after ${ms}ms` : `Timed out after ${ms}ms`;
            reject(new Error(message));
          }, ms);
          if (typeof timer.unref === 'function') timer.unref();
        }),
      ]);
    }

    // Analyze each viewport
    for (const [device, screenshot] of Object.entries(screenshots)) {
      console.log(`\nAnalyzing ${device} view...`);
      results.byViewport[device] = [];

      if (emitProgress) {
        emitProgress({
          step: 'navigate',
          message: `Loading ${device} viewport...`,
          progress: progressState ? Math.round((progressState.completed / progressState.total) * 100) : undefined,
        });
      }

      // Navigate once per viewport, run all agents on the same page.
      await withPage(
        {
          url,
          viewport: screenshot.viewport,
          viewportName: screenshot.viewport.name,
        },
        async page => {
          for (const agent of this.agents) {
            if (emitProgress) {
              emitProgress({
                step: 'agent',
                message: `${agent.name}: analyzing ${device}...`,
                progress: progressState ? Math.round((progressState.completed / progressState.total) * 100) : undefined,
              });
            }

            let agentResult;
            try {
              if (typeof agent.analyzePage !== 'function') {
                throw new Error(`${agent.name} does not implement analyzePage()`);
              }
              agentResult = await withTimeout(
                agent.analyzePage(page, screenshot, url),
                agentTimeoutMs,
                `${agent.name} (${device})`
              );
            } catch (error) {
              agentResult = agent.generateReport([], []);
              agentResult.error = error.message;
            } finally {
              if (progressState) {
                progressState.completed = Math.min(progressState.total, (progressState.completed || 0) + 1);
              }
            }

            results.byViewport[device].push(agentResult);

            if (!results.byAgent[agent.name]) {
              results.byAgent[agent.name] = [];
            }
            results.byAgent[agent.name].push({
              viewport: device,
              ...agentResult,
            });
          }
        }
      );
    }

    console.log('\n✓ All agents completed analysis');
    return results;
  }

  /**
   * Generate a comprehensive report
   * @param {string} url - Website URL
   * @param {Object} screenshots - Screenshot data
   * @param {Object} analysis - Agent analysis results
   */
  async generateReport(url, screenshots, analysis) {
    const timestamp = Date.now();
    await fs.mkdir(this.reportsDir, { recursive: true });
    const reportData = {
      url,
      timestamp: new Date().toISOString(),
      screenshots: Object.keys(screenshots).reduce((acc, device) => {
        acc[device] = screenshots[device].filename;
        return acc;
      }, {}),
      analysis,
      summary: this.generateExecutiveSummary(analysis),
    };

    // Save JSON report
    const reportFilename = `report_${timestamp}.json`;
    const reportPath = path.join(this.reportsDir, reportFilename);
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));

    // Generate and save readable text report
    const textReport = this.generateTextReport(reportData);
    const textReportPath = path.join(this.reportsDir, `report_${timestamp}.txt`);
    await fs.writeFile(textReportPath, textReport);

    return {
      path: reportPath,
      textPath: textReportPath,
      data: reportData,
    };
  }

  /**
   * Generate executive summary of all findings
   * @param {Object} analysis - Agent analysis results
   */
  generateExecutiveSummary(analysis) {
    let totalFindings = 0;
    let totalRecommendations = 0;
    let criticalIssues = 0;
    let majorIssues = 0;
    let minorIssues = 0;

    // Aggregate metrics from all agents
    Object.values(analysis.byAgent).forEach(agentResults => {
      agentResults.forEach(result => {
        totalFindings += result.summary.totalFindings;
        totalRecommendations += result.summary.totalRecommendations;
        criticalIssues += result.summary.criticalIssues;
        majorIssues += result.summary.majorIssues;
        minorIssues += result.summary.minorIssues;
      });
    });

    return {
      totalFindings,
      totalRecommendations,
      criticalIssues,
      majorIssues,
      minorIssues,
      agentsUsed: Object.keys(analysis.byAgent).length,
      viewportsAnalyzed: Object.keys(analysis.byViewport).length,
    };
  }

  /**
   * Generate human-readable text report
   * @param {Object} reportData - Report data
   */
  generateTextReport(reportData) {
    let text = '';
    
    text += '═══════════════════════════════════════════════════════\n';
    text += '          UX DESIGN ANALYSIS REPORT\n';
    text += '═══════════════════════════════════════════════════════\n\n';
    
    text += `Website: ${reportData.url}\n`;
    text += `Date: ${new Date(reportData.timestamp).toLocaleString()}\n\n`;
    
    text += '───────────────────────────────────────────────────────\n';
    text += 'EXECUTIVE SUMMARY\n';
    text += '───────────────────────────────────────────────────────\n\n';
    
    const summary = reportData.summary;
    text += `Total Findings: ${summary.totalFindings}\n`;
    text += `  • Critical Issues: ${summary.criticalIssues}\n`;
    text += `  • Major Issues: ${summary.majorIssues}\n`;
    text += `  • Minor Issues: ${summary.minorIssues}\n\n`;
    text += `Total Recommendations: ${summary.totalRecommendations}\n`;
    text += `Agents Used: ${summary.agentsUsed}\n`;
    text += `Viewports Analyzed: ${summary.viewportsAnalyzed}\n\n`;
    
    // Agent-by-agent analysis
    for (const [agentName, results] of Object.entries(reportData.analysis.byAgent)) {
      text += '═══════════════════════════════════════════════════════\n';
      text += `${agentName.toUpperCase()}\n`;
      text += '═══════════════════════════════════════════════════════\n\n';
      
      results.forEach(result => {
        text += `Viewport: ${result.viewport}\n`;
        text += `Specialty: ${result.specialty}\n\n`;
        
        if (result.findings.length > 0) {
          text += '📋 FINDINGS:\n';
          text += '───────────────────────────────────────────────────────\n';
          result.findings.forEach((finding, idx) => {
            text += `${idx + 1}. [${finding.severity.toUpperCase()}] ${finding.title}\n`;
            text += `   ${finding.description}\n\n`;
          });
        }
        
        if (result.recommendations.length > 0) {
          text += '💡 RECOMMENDATIONS:\n';
          text += '───────────────────────────────────────────────────────\n';
          result.recommendations.forEach((rec, idx) => {
            text += `${idx + 1}. ${rec.title}\n`;
            text += `   Priority: ${rec.priority} | Effort: ${rec.effort}\n`;
            text += `   ${rec.description}\n`;
            if (rec.implementation.length > 0) {
              text += `   Implementation:\n`;
              rec.implementation.forEach(step => {
                text += `     • ${step}\n`;
              });
            }
            text += '\n';
          });
        }
        
        text += '\n';
      });
    }
    
    text += '═══════════════════════════════════════════════════════\n';
    text += 'END OF REPORT\n';
    text += '═══════════════════════════════════════════════════════\n';
    
    return text;
  }
}

module.exports = UXDesignAnalyzer;
