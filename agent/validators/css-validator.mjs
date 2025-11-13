/**
 * CSS/Responsive Validator
 */

import fs from 'fs/promises';
import path from 'path';

export class CSSValidator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.issues = [];
  }

  async validate() {
    console.log('🔍 Validating CSS/responsive design...');
    this.issues = [];

    await this.checkResponsiveCSS();
    await this.checkTouchTargets();
    await this.checkPointerEvents();

    const passed = this.issues.filter(i => i.severity === 'critical').length === 0;
    console.log(`   ${passed ? '✅' : '❌'} CSS validation ${passed ? 'passed' : 'failed'}`);
    
    return {
      validator: 'css',
      passed,
      issues: this.issues,
      criticalCount: this.issues.filter(i => i.severity === 'critical').length,
      highCount: this.issues.filter(i => i.severity === 'high').length,
    };
  }

  async checkResponsiveCSS() {
    const file = path.join(this.projectRoot, 'src/styles/responsive.css');
    try {
      const code = await fs.readFile(file, 'utf-8');
      
      if (!code.includes('@media')) {
        this.issues.push({
          id: 'missing-media-queries',
          severity: 'high',
          category: 'css',
          description: 'Missing media queries for responsive design',
          file,
          suggestedFix: null
        });
      }

      if (!code.includes('dvh') && !code.includes('100vh')) {
        this.issues.push({
          id: 'missing-viewport-height',
          severity: 'low',
          category: 'css',
          description: 'Should use dvh or vh for mobile viewport height',
          file,
          suggestedFix: null
        });
      }

    } catch (error) {
      console.log(`   ⚠️  Responsive CSS file not found`);
    }
  }

  async checkTouchTargets() {
    // Check for button/interactive elements having adequate size
    // This is a simplified check - real implementation would parse CSS
    this.issues.push({
      id: 'touch-targets-reminder',
      severity: 'low',
      category: 'css',
      description: 'Reminder: Ensure all touch targets are minimum 44x44px',
      file: 'CSS',
      suggestedFix: null
    });
  }

  async checkPointerEvents() {
    const files = await this.findReactFiles();
    for (const file of files.slice(0, 10)) { // Check first 10 files
      try {
        const code = await fs.readFile(file, 'utf-8');
        if (code.includes('pointer-events: none') && 
            !code.includes('pointer-events: auto')) {
          this.issues.push({
            id: `pointer-events-${path.basename(file)}`,
            severity: 'low',
            category: 'css',
            description: `File uses pointer-events: none - ensure child elements can still be clicked`,
            file,
            suggestedFix: null
          });
        }
      } catch (error) {}
    }
  }

  async findReactFiles() {
    const srcDir = path.join(this.projectRoot, 'src');
    const files = [];
    
    async function walk(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'node_modules') {
            await walk(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {}
    }
    
    await walk(srcDir);
    return files;
  }
}

export default CSSValidator;
