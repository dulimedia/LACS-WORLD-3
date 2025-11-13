/**
 * Asset Validator
 */

import fs from 'fs/promises';
import path from 'path';

export class AssetValidator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.issues = [];
  }

  async validate() {
    console.log('🔍 Validating assets...');
    this.issues = [];

    await this.checkAssetSizes();
    await this.checkAssetFormats();

    const passed = this.issues.filter(i => i.severity === 'critical').length === 0;
    console.log(`   ${passed ? '✅' : '❌'} Asset validation ${passed ? 'passed' : 'failed'}`);
    
    return {
      validator: 'asset',
      passed,
      issues: this.issues,
      criticalCount: this.issues.filter(i => i.severity === 'critical').length,
      highCount: this.issues.filter(i => i.severity === 'high').length,
    };
  }

  async checkAssetSizes() {
    const publicDir = path.join(this.projectRoot, 'public');
    await this.checkDirectory(publicDir);
  }

  async checkDirectory(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          await this.checkDirectory(fullPath);
        } else if (entry.isFile()) {
          await this.checkFile(fullPath, entry.name);
        }
      }
    } catch (error) {}
  }

  async checkFile(filePath, fileName) {
    try {
      const stats = await fs.stat(filePath);
      const sizeMB = stats.size / (1024 * 1024);
      
      const ext = path.extname(fileName).toLowerCase();
      
      if (ext === '.glb' && sizeMB > 10) {
        this.issues.push({
          id: `large-glb-${fileName}`,
          severity: 'medium',
          category: 'asset',
          description: `Large GLB: ${fileName} (${sizeMB.toFixed(1)}MB)`,
          file: filePath,
          suggestedFix: {
            type: 'asset',
            action: 'Compress with Draco or gltf-pipeline',
            patch: null,
            risk: 'moderate'
          }
        });
      }
      
      if (ext === '.hdr' && sizeMB > 15) {
        this.issues.push({
          id: `large-hdr-${fileName}`,
          severity: 'low',
          category: 'asset',
          description: `Large HDR: ${fileName} (${sizeMB.toFixed(1)}MB)`,
          file: filePath,
          suggestedFix: {
            type: 'asset',
            action: 'Reduce resolution to 2K or compress',
            patch: null,
            risk: 'safe'
          }
        });
      }
      
      if (['.png', '.jpg', '.jpeg'].includes(ext) && sizeMB > 1) {
        this.issues.push({
          id: `large-image-${fileName}`,
          severity: 'low',
          category: 'asset',
          description: `Large image: ${fileName} (${sizeMB.toFixed(1)}MB)`,
          file: filePath,
          suggestedFix: {
            type: 'asset',
            action: 'Convert to WebP or compress',
            patch: null,
            risk: 'safe'
          }
        });
      }
    } catch (error) {}
  }

  async checkAssetFormats() {
    const floorplansDir = path.join(this.projectRoot, 'public/floorplans');
    try {
      const files = await fs.readdir(floorplansDir);
      const pngFiles = files.filter(f => f.endsWith('.png'));
      
      if (pngFiles.length > 5) {
        this.issues.push({
          id: 'png-to-webp-conversion',
          severity: 'low',
          category: 'asset',
          description: `Found ${pngFiles.length} PNG files - consider converting to WebP`,
          file: floorplansDir,
          suggestedFix: {
            type: 'asset',
            action: 'Convert PNGs to WebP for better compression',
            patch: null,
            risk: 'safe'
          }
        });
      }
    } catch (error) {}
  }
}

export default AssetValidator;
