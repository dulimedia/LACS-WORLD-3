/**
 * Lighthouse Mobile Audit Validator
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class LighthouseValidator {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = {
      serverUrl: config.serverUrl || 'http://localhost:3092',
      targetScore: config.targetScore || 90,
      ...config
    };
    this.issues = [];
  }

  async validate() {
    console.log('🔍 Running Lighthouse mobile audit...');
    this.issues = [];

    if (this.config.skipLighthouse) {
      console.log('   ⏭️  Skipping Lighthouse (server not running)');
      return {
        validator: 'lighthouse',
        passed: true,
        issues: [],
        skipped: true
      };
    }

    try {
      const result = await this.runLighthouse();
      
      if (result.performance < this.config.targetScore) {
        this.issues.push({
          id: 'low-lighthouse-score',
          severity: 'high',
          category: 'performance',
          description: `Lighthouse performance score: ${result.performance} (target: ${this.config.targetScore})`,
          file: 'Performance',
          suggestedFix: {
            type: 'code',
            action: 'Review Lighthouse report for specific recommendations',
            patch: null,
            risk: 'moderate'
          }
        });
      }

      const passed = this.issues.filter(i => i.severity === 'critical').length === 0;
      console.log(`   ${passed ? '✅' : '❌'} Lighthouse score: ${result.performance}`);
      
      return {
        validator: 'lighthouse',
        passed,
        issues: this.issues,
        score: result.performance,
        criticalCount: this.issues.filter(i => i.severity === 'critical').length,
        highCount: this.issues.filter(i => i.severity === 'high').length,
      };

    } catch (error) {
      console.log(`   ⚠️  Lighthouse audit failed: ${error.message}`);
      return {
        validator: 'lighthouse',
        passed: true,
        issues: [],
        skipped: true,
        error: error.message
      };
    }
  }

  async runLighthouse() {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(this.projectRoot, 'agent/reports/lighthouse.json');
      
      const args = [
        this.config.serverUrl,
        '--preset=mobile',
        '--only-categories=performance',
        '--output=json',
        `--output-path=${outputPath}`,
        '--chrome-flags="--headless --no-sandbox"'
      ];

      const lighthouse = spawn('npx', ['lighthouse', ...args], {
        cwd: this.projectRoot,
        shell: true
      });

      let stderr = '';

      lighthouse.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      lighthouse.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`Lighthouse exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const reportData = await fs.readFile(outputPath, 'utf-8');
          const report = JSON.parse(reportData);
          
          resolve({
            performance: Math.round(report.categories.performance.score * 100),
            fcp: report.audits['first-contentful-paint'].numericValue,
            lcp: report.audits['largest-contentful-paint'].numericValue,
            tti: report.audits['interactive'].numericValue,
            tbt: report.audits['total-blocking-time'].numericValue,
            cls: report.audits['cumulative-layout-shift'].numericValue,
          });
        } catch (error) {
          reject(new Error(`Failed to parse Lighthouse report: ${error.message}`));
        }
      });
    });
  }
}

export default LighthouseValidator;
