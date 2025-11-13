/**
 * Master Validator Orchestrator
 * 
 * Runs all validation checks and aggregates results
 */

import WebGLValidator from './validators/webgl-validator.mjs';
import PerformanceValidator from './validators/performance-validator.mjs';
import MemoryValidator from './validators/memory-validator.mjs';
import CSSValidator from './validators/css-validator.mjs';
import AssetValidator from './validators/asset-validator.mjs';
import LighthouseValidator from './validators/lighthouse-validator.mjs';

export class MobileValidator {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = config;
    
    this.validators = {
      webgl: new WebGLValidator(projectRoot),
      performance: new PerformanceValidator(projectRoot, config),
      memory: new MemoryValidator(projectRoot),
      css: new CSSValidator(projectRoot),
      asset: new AssetValidator(projectRoot),
      lighthouse: new LighthouseValidator(projectRoot, config),
    };
  }

  async validate() {
    console.log('\n🔍 Running mobile validation suite...\n');
    
    const results = {};
    const allIssues = [];

    // Run all validators
    for (const [name, validator] of Object.entries(this.validators)) {
      try {
        const result = await validator.validate();
        results[name] = result;
        allIssues.push(...result.issues);
      } catch (error) {
        console.error(`   ❌ ${name} validator failed:`, error.message);
        results[name] = {
          validator: name,
          passed: false,
          error: error.message,
          issues: []
        };
      }
    }

    // Aggregate results
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const highIssues = allIssues.filter(i => i.severity === 'high');
    const mediumIssues = allIssues.filter(i => i.severity === 'medium');
    const lowIssues = allIssues.filter(i => i.severity === 'low');

    const passed = criticalIssues.length === 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Issues: ${allIssues.length}`);
    console.log(`  🔴 Critical: ${criticalIssues.length}`);
    console.log(`  🟠 High: ${highIssues.length}`);
    console.log(`  🟡 Medium: ${mediumIssues.length}`);
    console.log(`  🟢 Low: ${lowIssues.length}`);
    console.log('='.repeat(60));
    console.log(`Overall: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);

    return {
      passed,
      timestamp: new Date().toISOString(),
      results,
      issues: allIssues,
      summary: {
        total: allIssues.length,
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: lowIssues.length,
      }
    };
  }

  async quickValidate() {
    // Faster validation - skip FPS measurement and Lighthouse
    console.log('\n🔍 Running quick validation (code checks only)...\n');
    
    const fastValidators = ['webgl', 'performance', 'memory'];
    const results = {};
    const allIssues = [];

    for (const name of fastValidators) {
      try {
        const result = await this.validators[name].validate();
        results[name] = result;
        allIssues.push(...result.issues);
      } catch (error) {
        console.error(`   ❌ ${name} validator failed:`, error.message);
      }
    }

    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const passed = criticalIssues.length === 0;

    console.log('\n' + '='.repeat(60));
    console.log(`Quick Validation: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Issues: ${allIssues.length} (${criticalIssues.length} critical)`);
    console.log('='.repeat(60) + '\n');

    return {
      passed,
      timestamp: new Date().toISOString(),
      results,
      issues: allIssues,
      summary: {
        total: allIssues.length,
        critical: criticalIssues.length,
      }
    };
  }
}

export default MobileValidator;
