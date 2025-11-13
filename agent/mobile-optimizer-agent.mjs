/**
 * MOBILE OPTIMIZATION AGENT
 * 
 * Autonomous system that iteratively validates and fixes mobile performance issues
 * 
 * SAFETY GUARANTEES:
 * - NO GitHub pushes (always requires manual git push)
 * - Only applies safe fixes
 * - Creates backups before modifications
 * - Logs all changes
 * - Stops after max iterations or success
 */

import MobileValidator from './validator.mjs';
import AutoFixer from './auto-fixer.mjs';
import fs from 'fs/promises';
import path from 'path';

export class MobileOptimizerAgent {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = {
      maxIterations: config.maxIterations || 10,
      targetFPS: config.targetFPS || { desktop: 60, mobile: 30 },
      validationTimeout: config.validationTimeout || 30000,
      autoFix: config.autoFix !== undefined ? config.autoFix : true,
      githubPush: false,  // ALWAYS false
      quickMode: config.quickMode || false,  // Skip slow validations
      ...config
    };
    
    this.validator = new MobileValidator(projectRoot, this.config);
    this.fixer = new AutoFixer(projectRoot);
    
    this.iteration = 0;
    this.history = [];
  }

  async run() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 MOBILE OPTIMIZATION AGENT');
    console.log('='.repeat(60));
    console.log('Configuration:');
    console.log(`  Max Iterations: ${this.config.maxIterations}`);
    console.log(`  Auto-Fix: ${this.config.autoFix}`);
    console.log(`  Quick Mode: ${this.config.quickMode}`);
    console.log(`  Target FPS: ${this.config.targetFPS.mobile}+ (mobile)`);
    console.log(`  GitHub Push: ${this.config.githubPush} (NEVER)`);
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();

    while (this.iteration < this.config.maxIterations) {
      this.iteration++;
      
      console.log('\n' + '─'.repeat(60));
      console.log(`📍 ITERATION ${this.iteration}/${this.config.maxIterations}`);
      console.log('─'.repeat(60));

      // Step 1: Validate
      const validationResult = this.config.quickMode 
        ? await this.validator.quickValidate()
        : await this.validator.validate();
      
      this.history.push({
        iteration: this.iteration,
        timestamp: new Date().toISOString(),
        validation: validationResult
      });

      // Step 2: Check for success
      const criticalIssues = validationResult.issues.filter(i => i.severity === 'critical');
      const highIssues = validationResult.issues.filter(i => i.severity === 'high');

      if (validationResult.passed && criticalIssues.length === 0) {
        console.log('\n' + '🎉'.repeat(30));
        console.log('✅ SUCCESS! Mobile optimization complete.');
        console.log('🎉'.repeat(30));
        console.log(`\n   Issues found: ${validationResult.summary.total}`);
        console.log(`   Critical: ${validationResult.summary.critical}`);
        console.log(`   High: ${validationResult.summary.high}`);
        console.log(`   Iterations: ${this.iteration}`);
        console.log(`   Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);
        
        await this.generateReport('SUCCESS');
        return { 
          success: true, 
          iterations: this.iteration, 
          result: validationResult,
          duration: Date.now() - startTime
        };
      }

      // Step 3: Check if we have actionable issues
      const actionableIssues = [...criticalIssues, ...highIssues];
      
      if (actionableIssues.length === 0) {
        console.log('\n⚠️  No critical/high issues found, but validation not perfect');
        console.log('   This may require manual intervention\n');
        
        await this.generateReport('PARTIAL_SUCCESS');
        return { 
          success: false, 
          iterations: this.iteration, 
          result: validationResult,
          reason: 'No actionable issues',
          duration: Date.now() - startTime
        };
      }

      // Step 4: Apply fixes (if autoFix enabled)
      if (this.config.autoFix) {
        console.log(`\n🔧 Found ${actionableIssues.length} actionable issues`);
        
        // Limit to top 5 issues per iteration to avoid too many changes at once
        const issuesToFix = actionableIssues.slice(0, 5);
        
        const fixResult = await this.fixer.applyFixes(issuesToFix);
        
        this.history[this.history.length - 1].fixes = fixResult;

        if (fixResult.applied === 0) {
          console.log('\n⚠️  No fixes could be applied automatically');
          console.log('   Manual intervention required\n');
          
          await this.generateReport('NEEDS_MANUAL_FIX');
          return {
            success: false,
            iterations: this.iteration,
            result: validationResult,
            reason: 'No auto-fixes available',
            duration: Date.now() - startTime
          };
        }

        // Wait a bit for changes to settle
        console.log('\n   ⏳ Waiting for changes to take effect...');
        await this.sleep(2000);

      } else {
        console.log('\n📝 Auto-fix disabled - logging issues only\n');
        await this.generateReport('AUTO_FIX_DISABLED');
        return { 
          success: false, 
          iterations: this.iteration, 
          result: validationResult,
          reason: 'Auto-fix disabled',
          duration: Date.now() - startTime
        };
      }
    }

    // Max iterations reached
    console.log('\n' + '❌'.repeat(30));
    console.log('❌ Max iterations reached without full success');
    console.log('❌'.repeat(30));
    console.log(`\n   Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s\n`);
    
    await this.generateReport('MAX_ITERATIONS');
    return { 
      success: false, 
      iterations: this.iteration, 
      result: null,
      reason: 'Max iterations reached',
      duration: Date.now() - startTime
    };
  }

  async generateReport(status) {
    console.log('\n📊 Generating comprehensive report...');

    const reportPath = path.join(this.projectRoot, 'agent/reports/mobile-optimization-report.md');
    
    const report = this.buildMarkdownReport(status);
    
    await fs.writeFile(reportPath, report, 'utf-8');
    
    // Also save JSON version for programmatic access
    const jsonPath = path.join(this.projectRoot, 'agent/reports/mobile-optimization-report.json');
    await fs.writeFile(jsonPath, JSON.stringify({
      status,
      iterations: this.iteration,
      history: this.history,
      timestamp: new Date().toISOString()
    }, null, 2), 'utf-8');

    // Save change log
    if (this.fixer.changesLog.length > 0) {
      await this.fixer.saveChangeLog();
    }

    console.log(`\n✅ Report saved to: ${reportPath}`);
    console.log(`✅ JSON data saved to: ${jsonPath}\n`);
  }

  buildMarkdownReport(status) {
    const latestResult = this.history[this.history.length - 1]?.validation;
    
    let report = `# Mobile Optimization Agent Report\n\n`;
    report += `**Status:** ${status}\n`;
    report += `**Iterations:** ${this.iteration}\n`;
    report += `**Timestamp:** ${new Date().toISOString()}\n`;
    report += `**Quick Mode:** ${this.config.quickMode}\n\n`;
    
    report += `---\n\n`;
    
    // Summary
    report += `## Summary\n\n`;
    if (latestResult) {
      report += `- **Total Issues:** ${latestResult.summary.total}\n`;
      report += `- **Critical:** ${latestResult.summary.critical}\n`;
      report += `- **High:** ${latestResult.summary.high}\n`;
      report += `- **Medium:** ${latestResult.summary.medium}\n`;
      report += `- **Low:** ${latestResult.summary.low}\n\n`;
    }

    // Iteration History
    report += `## Iteration History\n\n`;
    for (const entry of this.history) {
      report += `### Iteration ${entry.iteration}\n\n`;
      report += `**Timestamp:** ${entry.timestamp}\n\n`;
      
      if (entry.validation) {
        report += `**Issues Found:** ${entry.validation.summary.total}\n`;
        report += `- Critical: ${entry.validation.summary.critical}\n`;
        report += `- High: ${entry.validation.summary.high}\n\n`;
      }
      
      if (entry.fixes) {
        report += `**Fixes Applied:** ${entry.fixes.applied}\n`;
        report += `**Fixes Failed:** ${entry.fixes.failed}\n\n`;
      }
    }

    // Current Issues
    if (latestResult && latestResult.issues.length > 0) {
      report += `## Current Issues\n\n`;
      
      const bySeverity = {
        critical: latestResult.issues.filter(i => i.severity === 'critical'),
        high: latestResult.issues.filter(i => i.severity === 'high'),
        medium: latestResult.issues.filter(i => i.severity === 'medium'),
        low: latestResult.issues.filter(i => i.severity === 'low'),
      };

      for (const [severity, issues] of Object.entries(bySeverity)) {
        if (issues.length > 0) {
          report += `### ${severity.toUpperCase()} (${issues.length})\n\n`;
          for (const issue of issues) {
            report += `- **${issue.id}**: ${issue.description}\n`;
            report += `  - File: \`${issue.file}\`\n`;
            if (issue.suggestedFix) {
              report += `  - Fix: ${issue.suggestedFix.action}\n`;
              report += `  - Risk: ${issue.suggestedFix.risk}\n`;
            }
            report += `\n`;
          }
        }
      }
    }

    // Changes Made
    if (this.fixer.changesLog.length > 0) {
      report += `## Changes Made\n\n`;
      for (const change of this.fixer.changesLog) {
        report += `- **${change.issueId}** (${change.severity})\n`;
        report += `  - ${change.description}\n`;
        report += `  - File: \`${change.file}\`\n`;
        report += `  - Action: ${change.action}\n\n`;
      }
    }

    // Next Steps
    report += `## Next Steps\n\n`;
    
    if (status === 'SUCCESS') {
      report += `✅ Mobile optimization complete! No critical issues remaining.\n\n`;
      report += `### Optional Improvements\n`;
      if (latestResult && latestResult.summary.medium > 0) {
        report += `- Address ${latestResult.summary.medium} medium severity issues\n`;
      }
      if (latestResult && latestResult.summary.low > 0) {
        report += `- Address ${latestResult.summary.low} low severity issues\n`;
      }
      report += `\n### Commit Changes\n`;
      report += `\`\`\`bash\n`;
      report += `git add .\n`;
      report += `git commit -m "Mobile optimizations via agent"\n`;
      report += `git push origin main\n`;
      report += `\`\`\`\n\n`;
    } else if (status === 'NEEDS_MANUAL_FIX') {
      report += `⚠️  Some issues require manual intervention.\n\n`;
      report += `Review the issues above and apply fixes manually, then re-run the agent.\n\n`;
    } else if (status === 'MAX_ITERATIONS') {
      report += `❌ Agent reached maximum iterations without full success.\n\n`;
      report += `This may indicate:\n`;
      report += `- Complex issues requiring manual fixes\n`;
      report += `- Issues that cannot be auto-fixed\n`;
      report += `- Configuration problems\n\n`;
      report += `Review the issues and iteration history above.\n\n`;
    }

    report += `---\n\n`;
    report += `*Generated by Mobile Optimization Agent*\n`;

    return report;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default MobileOptimizerAgent;
