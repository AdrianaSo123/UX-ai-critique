#!/usr/bin/env node

const UXDesignAnalyzer = require('./src/index');

/**
 * CLI interface for the UX Design Analyzer
 */
async function main() {
  // Get URL from command line arguments
  const url = process.argv[2];

  if (!url) {
    console.error('\n❌ Error: Please provide a URL to analyze\n');
    console.log('Usage: node analyzer.js <url>\n');
    console.log('Example: node analyzer.js https://example.com\n');
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    console.error('\n❌ Error: Invalid URL format\n');
    console.log('Please provide a valid URL including protocol (http:// or https://)\n');
    console.log('Example: node analyzer.js https://example.com\n');
    process.exit(1);
  }

  // Run the analyzer
  const analyzer = new UXDesignAnalyzer();
  
  try {
    const report = await analyzer.analyzeWebsite(url);
    
    console.log('📊 Analysis Results:');
    console.log(`   • ${report.data.summary.totalFindings} findings`);
    console.log(`   • ${report.data.summary.criticalIssues} critical issues`);
    console.log(`   • ${report.data.summary.totalRecommendations} recommendations`);
    console.log(`\n📄 Reports generated:`);
    console.log(`   • JSON: ${report.path}`);
    console.log(`   • Text: ${report.textPath}`);
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run the CLI
main();
