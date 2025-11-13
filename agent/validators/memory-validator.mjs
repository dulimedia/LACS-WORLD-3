/**
 * Memory Management Validator
 */

import fs from 'fs/promises';
import path from 'path';

export class MemoryValidator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.issues = [];
  }

  async validate() {
    console.log('🔍 Validating memory management...');
    this.issues = [];

    await this.checkDeviceMemoryDetection();
    await this.checkAssetSizes();
    await this.checkTextureLimit();

    const passed = this.issues.filter(i => i.severity === 'critical').length === 0;
    console.log(`   ${passed ? '✅' : '❌'} Memory validation ${passed ? 'passed' : 'failed'}`);
    
    return {
      validator: 'memory',
      passed,
      issues: this.issues,
      criticalCount: this.issues.filter(i => i.severity === 'critical').length,
      highCount: this.issues.filter(i => i.severity === 'high').length,
    };
  }

  async checkDeviceMemoryDetection() {
    const file = path.join(this.projectRoot, 'src/utils/deviceDetection.ts');
    try {
      const code = await fs.readFile(file, 'utf-8');
      if (!code.includes('deviceMemory')) {
        this.issues.push({
          id: 'missing-memory-detection',
          severity: 'medium',
          category: 'memory',
          description: 'Should detect device memory for tier selection',
          file,
          suggestedFix: {
            type: 'code',
            action: 'Add device memory detection',
            patch: `const deviceMemoryGB = navigator.deviceMemory || 4;`,
            risk: 'safe'
          }
        });
      }
    } catch (error) {
      console.log(`   ⚠️  Device detection file not found`);
    }
  }

  async checkAssetSizes() {
    const modelsDir = path.join(this.projectRoot, 'public/models');
    try {
      const files = await fs.readdir(modelsDir);
      for (const file of files) {
        if (file.endsWith('.glb')) {
          const filePath = path.join(modelsDir, file);
          const stats = await fs.stat(filePath);
          const sizeMB = stats.size / (1024 * 1024);
          
          if (sizeMB > 10) {
            this.issues.push({
              id: `large-asset-${file}`,
              severity: 'medium',
              category: 'memory',
              description: `Large GLB file: ${file} (${sizeMB.toFixed(1)}MB)`,
              file: filePath,
              suggestedFix: {
                type: 'asset',
                action: 'Compress GLB file or split into smaller chunks',
                patch: null,
                risk: 'moderate'
              }
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not check asset sizes`);
    }
  }

  async checkTextureLimit() {
    const files = ['src/graphics/makeRenderer.ts', 'src/perf/PerfFlags.ts'];
    for (const file of files) {
      try {
        const code = await fs.readFile(path.join(this.projectRoot, file), 'utf-8');
        if (!code.includes('maxTextureSize') && !code.includes('MAX_TEXTURE')) {
          this.issues.push({
            id: 'missing-texture-size-limit',
            severity: 'medium',
            category: 'memory',
            description: 'Texture sizes should be limited based on device memory',
            file,
            suggestedFix: {
              type: 'code',
              action: 'Add texture size limiting',
              patch: `maxTextureSize: tier === 'LOW' ? 1024 : 2048`,
              risk: 'safe'
            }
          });
          break;
        }
      } catch (error) {}
    }
  }
}

export default MemoryValidator;
