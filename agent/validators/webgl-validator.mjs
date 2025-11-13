/**
 * WebGL Configuration Validator
 * 
 * Validates WebGL renderer configuration against mobile requirements
 */

import fs from 'fs/promises';
import path from 'path';
import MobileKnowledgeBase from '../knowledge-base.mjs';

export class WebGLValidator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.issues = [];
  }

  async validate() {
    console.log('🔍 Validating WebGL configuration...');
    this.issues = [];

    const rendererFile = path.join(this.projectRoot, 'src/graphics/makeRenderer.ts');
    
    try {
      const code = await fs.readFile(rendererFile, 'utf-8');
      
      // Run all WebGL-related validation rules
      const webglRules = MobileKnowledgeBase.validationRules.filter(
        r => r.category === 'webgl'
      );
      
      for (const rule of webglRules) {
        const passed = rule.check(code);
        
        if (!passed) {
          const suggestedFix = MobileKnowledgeBase.getSuggestedFix(rule.id);
          
          this.issues.push({
            id: rule.id,
            severity: rule.severity,
            category: rule.category,
            description: rule.message,
            file: rule.file,
            suggestedFix
          });
        }
      }
      
      // Additional checks
      await this.checkRendererConfig(code, rendererFile);
      await this.checkContextLossHandling(code, rendererFile);
      await this.checkPixelRatioSettings(code, rendererFile);
      
    } catch (error) {
      this.issues.push({
        id: 'file-read-error',
        severity: 'critical',
        category: 'webgl',
        description: `Failed to read renderer file: ${error.message}`,
        file: rendererFile,
        suggestedFix: null
      });
    }

    const passed = this.issues.filter(i => i.severity === 'critical').length === 0;
    
    console.log(`   ${passed ? '✅' : '❌'} WebGL validation ${passed ? 'passed' : 'failed'}`);
    console.log(`   Found ${this.issues.length} issues`);
    
    return {
      validator: 'webgl',
      passed,
      issues: this.issues,
      criticalCount: this.issues.filter(i => i.severity === 'critical').length,
      highCount: this.issues.filter(i => i.severity === 'high').length,
    };
  }

  async checkRendererConfig(code, file) {
    const kb = MobileKnowledgeBase.webglConfig;
    
    // Check for required settings
    const requiredChecks = [
      {
        setting: 'antialias: false',
        present: code.includes('antialias: false') || code.includes('antialias:false'),
        severity: 'critical',
        message: 'Mobile renderer must have antialias: false',
      },
      {
        setting: 'stencil: false',
        present: code.includes('stencil: false') || code.includes('stencil:false'),
        severity: 'medium',
        message: 'Stencil buffer should be disabled to save memory',
      },
      {
        setting: 'preserveDrawingBuffer: false',
        present: !code.includes('preserveDrawingBuffer: true'),
        severity: 'high',
        message: 'preserveDrawingBuffer: true causes iOS memory leaks',
      },
      {
        setting: 'logarithmicDepthBuffer: false',
        present: code.includes('logarithmicDepthBuffer: false') || !code.includes('logarithmicDepthBuffer: true'),
        severity: 'medium',
        message: 'Logarithmic depth buffer is expensive on mobile',
      },
    ];

    for (const check of requiredChecks) {
      if (!check.present) {
        this.issues.push({
          id: `renderer-${check.setting.replace(/[:\s]/g, '-')}`,
          severity: check.severity,
          category: 'webgl',
          description: check.message,
          file,
          suggestedFix: {
            type: 'code',
            action: `Add ${check.setting} to renderer config`,
            patch: check.setting,
            risk: 'safe'
          }
        });
      }
    }
  }

  async checkContextLossHandling(code, file) {
    const hasContextLostHandler = code.includes('webglcontextlost');
    const hasPreventDefault = code.includes('preventDefault');
    const hasContextRestoredHandler = code.includes('webglcontextrestored');
    const hasReload = code.includes('location.reload') || code.includes('window.location.reload');

    if (!hasContextLostHandler) {
      this.issues.push({
        id: 'missing-context-lost-handler',
        severity: 'critical',
        category: 'webgl',
        description: 'Missing WebGL context lost event handler',
        file,
        suggestedFix: MobileKnowledgeBase.getSuggestedFix('context-loss-handler')
      });
    }

    if (hasContextLostHandler && !hasPreventDefault) {
      this.issues.push({
        id: 'missing-prevent-default',
        severity: 'high',
        category: 'webgl',
        description: 'Context lost handler must call preventDefault()',
        file,
        suggestedFix: {
          type: 'code',
          action: 'Add e.preventDefault() to context lost handler',
          patch: 'e.preventDefault();',
          risk: 'safe'
        }
      });
    }

    if (!hasContextRestoredHandler) {
      this.issues.push({
        id: 'missing-context-restored-handler',
        severity: 'high',
        category: 'webgl',
        description: 'Missing WebGL context restored event handler',
        file,
        suggestedFix: MobileKnowledgeBase.getSuggestedFix('context-loss-handler')
      });
    }
  }

  async checkPixelRatioSettings(code, file) {
    const hasPixelRatioClamp = code.includes('Math.min') && 
                                code.includes('devicePixelRatio') &&
                                code.includes('setPixelRatio');
    
    if (!hasPixelRatioClamp) {
      this.issues.push({
        id: 'missing-pixel-ratio-clamp',
        severity: 'high',
        category: 'webgl',
        description: 'Device pixel ratio must be clamped for mobile performance',
        file,
        suggestedFix: MobileKnowledgeBase.getSuggestedFix('mobile-pixel-ratio')
      });
    }

    // Check for mobile-specific pixel ratio limits
    if (code.includes('isMobile') || code.includes("tier === 'mobile")) {
      const hasLowDPR = code.includes('1.0') || code.includes('DPR = 1');
      const hasMediumDPR = code.includes('1.25') || code.includes('1.3') || code.includes('1.5');
      
      if (!hasLowDPR && !hasMediumDPR) {
        this.issues.push({
          id: 'mobile-dpr-too-high',
          severity: 'medium',
          category: 'webgl',
          description: 'Mobile pixel ratio should be <= 1.5 for best performance',
          file,
          suggestedFix: {
            type: 'code',
            action: 'Clamp mobile DPR to 1.0 (LOW) or 1.3 (BALANCED)',
            patch: `const DPR = tier === 'mobile-low' ? 1.0 : Math.min(1.3, window.devicePixelRatio);`,
            risk: 'safe'
          }
        });
      }
    }
  }
}

export default WebGLValidator;
