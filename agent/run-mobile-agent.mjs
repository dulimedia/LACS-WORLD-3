#!/usr/bin/env node

/**
 * Mobile Optimization Agent CLI Runner
 * 
 * Usage:
 *   node agent/run-mobile-agent.mjs
 *   npm run agent:mobile
 *   npm run agent:mobile:quick  (skip FPS/Lighthouse tests)
 */

import { MobileOptimizerAgent } from './mobile-optimizer-agent.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Parse command line args
const args = process.argv.slice(2);
const quickMode = args.includes('--quick') || args.includes('-q');
const dryRun = args.includes('--dry-run') || args.includes('--no-fix');
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
Mobile Optimization Agent - CLI Runner

Usage:
  node agent/run-mobile-agent.mjs [options]
  npm run agent:mobile [-- options]

Options:
  --quick, -q        Quick mode (skip FPS measurement and Lighthouse)
  --dry-run          Validation only (no auto-fixes)
  --no-fix           Same as --dry-run
  --help, -h         Show this help message

Examples:
  # Full validation and auto-fix
  npm run agent:mobile

  # Quick validation only (code checks)
  npm run agent:mobile -- --quick

  # Dry run (report issues without fixing)
  npm run agent:mobile -- --dry-run

Configuration:
  - Max iterations: 10
  - Target FPS: 30+ (mobile), 60+ (desktop)
  - Auto-fix: Safe fixes only
  - GitHub push: NEVER (manual approval required)

Output:
  - Report: agent/reports/mobile-optimization-report.md
  - JSON data: agent/reports/mobile-optimization-report.json
  - Change log: agent/reports/changes.log
  - Backups: agent/backups/

Safety:
  - Only applies fixes marked as "safe" risk
  - Creates backups before modifications
  - Logs all changes
  - NO git commits (you must manually review and commit)
`);
  process.exit(0);
}

console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║         🤖  MOBILE OPTIMIZATION AGENT v1.0  🤖          ║
║                                                          ║
║  Autonomous mobile performance optimization system      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`);

// Agent configuration
const config = {
  maxIterations: 10,
  targetFPS: {
    desktop: 60,
    mobile: 30
  },
  validationTimeout: 30000,
  autoFix: !dryRun,
  githubPush: false,  // ALWAYS false
  quickMode: quickMode,
  
  // Skip FPS measurement and Lighthouse in quick mode
  measureFPS: !quickMode,
  skipLighthouse: quickMode,
  
  serverUrl: process.env.SERVER_URL || 'http://localhost:3092',
};

console.log('Configuration:');
console.log(`  Project Root: ${projectRoot}`);
console.log(`  Quick Mode: ${config.quickMode}`);
console.log(`  Auto-Fix: ${config.autoFix}`);
console.log(`  Server URL: ${config.serverUrl}`);
console.log('');

// Create and run agent
const agent = new MobileOptimizerAgent(projectRoot, config);

try {
  const result = await agent.run();

  console.log('\n' + '='.repeat(60));
  console.log('🎯 FINAL RESULT');
  console.log('='.repeat(60));
  console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ INCOMPLETE'}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
  
  if (result.result) {
    console.log(`Total Issues: ${result.result.summary.total}`);
    console.log(`  Critical: ${result.result.summary.critical}`);
    console.log(`  High: ${result.result.summary.high}`);
    console.log(`  Medium: ${result.result.summary.medium}`);
    console.log(`  Low: ${result.result.summary.low}`);
  }
  
  if (result.reason) {
    console.log(`Reason: ${result.reason}`);
  }
  
  console.log('='.repeat(60));

  // Instructions for next steps
  if (result.success) {
    console.log(`
✅ SUCCESS! Mobile optimization complete.

Next steps:
  1. Review changes: git diff
  2. Test the application: npm run dev
  3. Commit changes: git add . && git commit -m "Mobile optimizations"
  4. Push to GitHub: git push origin main

Reports:
  - Detailed report: agent/reports/mobile-optimization-report.md
  - JSON data: agent/reports/mobile-optimization-report.json
  - Change log: agent/reports/changes.log
`);
    process.exit(0);
  } else {
    console.log(`
⚠️  Agent did not achieve full success.

Reason: ${result.reason || 'Unknown'}

Next steps:
  1. Review report: agent/reports/mobile-optimization-report.md
  2. Address remaining issues manually
  3. Re-run agent: npm run agent:mobile

If issues persist:
  - Check if dev server is running (for FPS/Lighthouse tests)
  - Review complex issues that may need manual intervention
  - Run in quick mode to skip slow tests: npm run agent:mobile -- --quick
`);
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Agent crashed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
