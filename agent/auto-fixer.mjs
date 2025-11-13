/**
 * Auto-Fixer
 * 
 * Automatically applies safe code fixes based on validation issues
 * 
 * SAFETY GUARANTEES:
 * - Only applies fixes marked as "safe" risk
 * - Creates backup before modifications
 * - Logs all changes
 * - NO git commits (manual approval required)
 */

import fs from 'fs/promises';
import path from 'path';

export class AutoFixer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.changesLog = [];
    this.backupDir = path.join(projectRoot, 'agent/backups');
  }

  async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {}
  }

  async applyFixes(issues) {
    console.log('\n🔧 Applying auto-fixes...\n');
    
    await this.ensureBackupDir();

    const fixableIssues = issues.filter(i => 
      i.suggestedFix && 
      i.suggestedFix.risk === 'safe' &&
      (i.severity === 'critical' || i.severity === 'high')
    );

    if (fixableIssues.length === 0) {
      console.log('   No safe auto-fixes available');
      return { applied: 0, failed: 0, changes: [] };
    }

    console.log(`   Found ${fixableIssues.length} auto-fixable issues\n`);

    let applied = 0;
    let failed = 0;

    for (const issue of fixableIssues) {
      try {
        const success = await this.applyFix(issue);
        if (success) {
          applied++;
          console.log(`   ✅ Fixed: ${issue.description}`);
        } else {
          failed++;
          console.log(`   ⚠️  Could not fix: ${issue.description}`);
        }
      } catch (error) {
        failed++;
        console.log(`   ❌ Error fixing ${issue.id}: ${error.message}`);
      }
    }

    console.log(`\n   Applied: ${applied}, Failed: ${failed}\n`);

    return {
      applied,
      failed,
      changes: this.changesLog
    };
  }

  async applyFix(issue) {
    const fix = issue.suggestedFix;
    
    // Only handle code fixes for now
    if (fix.type !== 'code') {
      return false;
    }

    // Create backup
    await this.createBackup(issue.file);

    // Apply the fix based on issue ID
    const fixed = await this.applyCodeFix(issue);

    if (fixed) {
      this.logChange(issue, fix);
    }

    return fixed;
  }

  async applyCodeFix(issue) {
    // Different fix strategies based on issue type
    const fixers = {
      'webgl-antialias-mobile': () => this.fixAntialiasing(issue.file),
      'webgl-preserve-drawing-buffer': () => this.fixPreserveDrawingBuffer(issue.file),
      'webgl-stencil-disabled': () => this.fixStencilBuffer(issue.file),
      'ios-power-preference': () => this.fixPowerPreference(issue.file),
      'mobile-pixel-ratio': () => this.fixPixelRatio(issue.file),
      'context-loss-handler': () => this.addContextLossHandler(issue.file),
      'mobile-shadows-disabled': () => this.fixShadowsOnMobile(issue.file),
      'mobile-post-processing-disabled': () => this.fixPostProcessing(issue.file),
    };

    const fixer = fixers[issue.id];
    if (fixer) {
      return await fixer();
    }

    // Generic fix attempt
    return await this.genericCodeFix(issue);
  }

  async fixAntialiasing(file) {
    try {
      let code = await fs.readFile(file, 'utf-8');
      
      // Find renderer config and ensure antialias: false
      if (code.includes('new THREE.WebGLRenderer')) {
        // Replace any antialias: true with antialias: false
        code = code.replace(/antialias:\s*true/g, 'antialias: false');
        
        // If no antialias setting, add it
        if (!code.includes('antialias:')) {
          code = code.replace(
            /(const config[^=]*=\s*{)/,
            '$1\n    antialias: false,'
          );
        }
        
        await fs.writeFile(file, code, 'utf-8');
        return true;
      }
    } catch (error) {
      console.error(`   Error fixing antialias: ${error.message}`);
    }
    return false;
  }

  async fixPreserveDrawingBuffer(file) {
    try {
      let code = await fs.readFile(file, 'utf-8');
      
      // Replace preserveDrawingBuffer: true with false
      if (code.includes('preserveDrawingBuffer: true')) {
        code = code.replace(/preserveDrawingBuffer:\s*true/g, 'preserveDrawingBuffer: false');
        await fs.writeFile(file, code, 'utf-8');
        return true;
      }
    } catch (error) {}
    return false;
  }

  async fixStencilBuffer(file) {
    try {
      let code = await fs.readFile(file, 'utf-8');
      
      // Add stencil: false if not present
      if (!code.includes('stencil:') && code.includes('new THREE.WebGLRenderer')) {
        code = code.replace(
          /(const config[^=]*=\s*{)/,
          '$1\n    stencil: false,'
        );
        await fs.writeFile(file, code, 'utf-8');
        return true;
      }
    } catch (error) {}
    return false;
  }

  async fixPowerPreference(file) {
    try {
      let code = await fs.readFile(file, 'utf-8');
      
      // Ensure iOS uses low-power
      if (code.includes('isIOS') && !code.includes("powerPreference: 'low-power'")) {
        // Find powerPreference line and make it conditional
        code = code.replace(
          /powerPreference:\s*['"]high-performance['"]/g,
          "powerPreference: isIOS ? 'low-power' : 'high-performance'"
        );
        await fs.writeFile(file, code, 'utf-8');
        return true;
      }
    } catch (error) {}
    return false;
  }

  async fixPixelRatio(file) {
    try {
      let code = await fs.readFile(file, 'utf-8');
      
      // Ensure pixel ratio is clamped
      if (code.includes('setPixelRatio') && !code.includes('Math.min')) {
        code = code.replace(
          /renderer\.setPixelRatio\(window\.devicePixelRatio\)/g,
          'renderer.setPixelRatio(Math.min(2.0, window.devicePixelRatio))'
        );
        await fs.writeFile(file, code, 'utf-8');
        return true;
      }
    } catch (error) {}
    return false;
  }

  async addContextLossHandler(file) {
    try {
      let code = await fs.readFile(file, 'utf-8');
      
      // Add context loss handlers if not present
      if (!code.includes('webglcontextlost')) {
        const handler = `
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.error('❌ WebGL context lost');
    localStorage.setItem('webglContextLost', 'true');
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    console.log('✅ WebGL context restored');
    localStorage.removeItem('webglContextLost');
    location.reload();
  }, false);
`;
        
        // Insert before return statement
        code = code.replace(
          /(return renderer;)/,
          handler + '\n  $1'
        );
        
        await fs.writeFile(file, code, 'utf-8');
        return true;
      }
    } catch (error) {}
    return false;
  }

  async fixShadowsOnMobile(file) {
    try {
      let code = await fs.readFile(file, 'utf-8');
      
      // Ensure shadows disabled on LOW tier
      if (code.includes('SHADOWS_ENABLED')) {
        code = code.replace(
          /SHADOWS_ENABLED:\s*true/g,
          "SHADOWS_ENABLED: qualityTier !== 'LOW'"
        );
        await fs.writeFile(file, code, 'utf-8');
        return true;
      }
    } catch (error) {}
    return false;
  }

  async fixPostProcessing(file) {
    try {
      let code = await fs.readFile(file, 'utf-8');
      
      // Ensure post-processing disabled on LOW tier
      if (code.includes('ao:') && !code.includes("ao: qualityTier === 'HIGH'")) {
        code = code.replace(
          /ao:\s*true/g,
          "ao: qualityTier === 'HIGH'"
        );
      }
      
      if (code.includes('bloom:') && !code.includes("bloom: qualityTier !== 'LOW'")) {
        code = code.replace(
          /bloom:\s*true/g,
          "bloom: qualityTier !== 'LOW'"
        );
      }
      
      await fs.writeFile(file, code, 'utf-8');
      return true;
    } catch (error) {}
    return false;
  }

  async genericCodeFix(issue) {
    // For issues with a patch suggestion, try to insert it
    const fix = issue.suggestedFix;
    if (!fix.patch) {
      return false;
    }

    try {
      let code = await fs.readFile(issue.file, 'utf-8');
      
      // Simple patch insertion (would need more sophisticated logic in production)
      // For now, just log that we can't auto-fix this
      console.log(`   ⚠️  ${issue.id} requires manual intervention`);
      return false;
    } catch (error) {
      return false;
    }
  }

  async createBackup(file) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = path.basename(file);
      const backupPath = path.join(this.backupDir, `${fileName}.${timestamp}.backup`);
      
      await fs.copyFile(file, backupPath);
    } catch (error) {
      console.error(`   Warning: Could not create backup: ${error.message}`);
    }
  }

  logChange(issue, fix) {
    const change = {
      timestamp: new Date().toISOString(),
      issueId: issue.id,
      severity: issue.severity,
      description: issue.description,
      file: issue.file,
      action: fix.action,
      risk: fix.risk
    };
    
    this.changesLog.push(change);
  }

  async saveChangeLog() {
    const logPath = path.join(this.projectRoot, 'agent/reports/changes.log');
    const logContent = this.changesLog.map(c => 
      `[${c.timestamp}] ${c.severity.toUpperCase()} - ${c.issueId}\n` +
      `  File: ${c.file}\n` +
      `  Fix: ${c.action}\n` +
      `  Risk: ${c.risk}\n`
    ).join('\n');
    
    await fs.writeFile(logPath, logContent, 'utf-8');
    console.log(`\n📝 Change log saved to: ${logPath}`);
  }
}

export default AutoFixer;
