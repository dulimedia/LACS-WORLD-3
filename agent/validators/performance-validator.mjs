/**
 * Performance Validator
 * 
 * Validates performance tiers, FPS targets, and frame governor
 */

import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
import MobileKnowledgeBase from '../knowledge-base.mjs';

export class PerformanceValidator {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = {
      serverUrl: config.serverUrl || 'http://localhost:3092',
      measurementDuration: config.measurementDuration || 10000, // 10 seconds
      targetFPS: config.targetFPS || { desktop: 60, mobile: 30 },
      ...config
    };
    this.issues = [];
  }

  async validate() {
    console.log('🔍 Validating performance configuration...');
    this.issues = [];

    // Validate performance tier configuration
    await this.validatePerfFlags();
    
    // Validate frame governor
    await this.validateFrameGovernor();
    
    // Validate DPR and canvas pixel limits
    await this.validateCanvasLimits();
    
    // If server is running, measure actual FPS
    if (this.config.measureFPS) {
      await this.measureRuntimeFPS();
    }

    const passed = this.issues.filter(i => i.severity === 'critical').length === 0;
    
    console.log(`   ${passed ? '✅' : '❌'} Performance validation ${passed ? 'passed' : 'failed'}`);
    console.log(`   Found ${this.issues.length} issues`);
    
    return {
      validator: 'performance',
      passed,
      issues: this.issues,
      criticalCount: this.issues.filter(i => i.severity === 'critical').length,
      highCount: this.issues.filter(i => i.severity === 'high').length,
    };
  }

  async validatePerfFlags() {
    const perfFlagsFile = path.join(this.projectRoot, 'src/perf/PerfFlags.ts');
    
    try {
      const code = await fs.readFile(perfFlagsFile, 'utf-8');
      
      // Check for tier detection
      if (!code.includes('isMobile')) {
        this.issues.push({
          id: 'missing-mobile-detection',
          severity: 'critical',
          category: 'performance',
          description: 'PerfFlags must detect mobile devices',
          file: perfFlagsFile,
          suggestedFix: {
            type: 'code',
            action: 'Add mobile device detection',
            patch: `const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);`,
            risk: 'safe'
          }
        });
      }

      // Check for tier assignment
      if (!code.includes('tier') || !code.includes('mobileLow') && !code.includes('mobile-low')) {
        this.issues.push({
          id: 'missing-tier-assignment',
          severity: 'high',
          category: 'performance',
          description: 'PerfFlags must assign performance tier based on device',
          file: perfFlagsFile,
          suggestedFix: {
            type: 'code',
            action: 'Add tier assignment logic',
            patch: `const tier = isMobile ? 'mobileLow' : 'desktopHigh';`,
            risk: 'safe'
          }
        });
      }

      // Check for shadow disabling on mobile
      const hasShadowDisable = code.includes('SHADOWS_ENABLED') || 
                                code.includes('dynamicShadows: false');
      
      if (!hasShadowDisable) {
        this.issues.push({
          id: 'missing-shadow-disable',
          severity: 'high',
          category: 'performance',
          description: 'Shadows must be disabled on mobile LOW tier',
          file: perfFlagsFile,
          suggestedFix: MobileKnowledgeBase.getSuggestedFix('mobile-shadows-disabled')
        });
      }

      // Check for post-processing disabling
      const hasAoDisable = code.includes('ao: false') || code.includes('ao: qualityTier');
      const hasBloomDisable = code.includes('bloom: false') || code.includes('bloom: qualityTier');
      
      if (!hasAoDisable || !hasBloomDisable) {
        this.issues.push({
          id: 'missing-postprocess-disable',
          severity: 'medium',
          category: 'performance',
          description: 'Post-processing must be disabled/reduced on mobile LOW tier',
          file: perfFlagsFile,
          suggestedFix: MobileKnowledgeBase.getSuggestedFix('mobile-post-processing-disabled')
        });
      }

      // Check for texture size limits
      const hasTextureLimit = code.includes('MAX_TEXTURE_DIM') || code.includes('maxTextureSize');
      
      if (!hasTextureLimit) {
        this.issues.push({
          id: 'missing-texture-limits',
          severity: 'medium',
          category: 'performance',
          description: 'Texture size must be limited based on quality tier',
          file: perfFlagsFile,
          suggestedFix: {
            type: 'code',
            action: 'Add texture size limits',
            patch: `MAX_TEXTURE_DIM: qualityTier === 'LOW' ? 1024 : qualityTier === 'BALANCED' ? 2048 : 4096,`,
            risk: 'safe'
          }
        });
      }

    } catch (error) {
      this.issues.push({
        id: 'perf-flags-read-error',
        severity: 'critical',
        category: 'performance',
        description: `Failed to read PerfFlags: ${error.message}`,
        file: perfFlagsFile,
        suggestedFix: null
      });
    }
  }

  async validateFrameGovernor() {
    const mobileGuardFile = path.join(this.projectRoot, 'src/perf/MobileGuard.tsx');
    
    try {
      const code = await fs.readFile(mobileGuardFile, 'utf-8');
      
      const hasFrameGovernor = code.includes('FrameGovernor') || code.includes('useFrameGovernor');
      const hasJankDetection = code.includes('jankFrames') || code.includes('jank');
      
      if (!hasFrameGovernor) {
        this.issues.push({
          id: 'missing-frame-governor',
          severity: 'medium',
          category: 'performance',
          description: 'Frame governor should monitor mobile performance',
          file: mobileGuardFile,
          suggestedFix: {
            type: 'code',
            action: 'Add frame governor to monitor FPS',
            patch: `export function useFrameGovernor() { /* ... */ }`,
            risk: 'moderate'
          }
        });
      }

      if (hasFrameGovernor && !hasJankDetection) {
        this.issues.push({
          id: 'missing-jank-detection',
          severity: 'low',
          category: 'performance',
          description: 'Frame governor should detect janky frames',
          file: mobileGuardFile,
          suggestedFix: null
        });
      }

    } catch (error) {
      // File might not exist, which is okay
      console.log(`   ⚠️  MobileGuard file not found (optional): ${error.message}`);
    }
  }

  async validateCanvasLimits() {
    const mobileGuardFile = path.join(this.projectRoot, 'src/perf/MobileGuard.tsx');
    
    try {
      const code = await fs.readFile(mobileGuardFile, 'utf-8');
      
      const hasCanvasClamp = code.includes('maxCanvasPixels') || 
                              code.includes('MAX_CANVAS_PIXELS') ||
                              code.includes('useCanvasClamps');
      
      if (!hasCanvasClamp) {
        this.issues.push({
          id: 'missing-canvas-clamp',
          severity: 'high',
          category: 'performance',
          description: 'Canvas pixels must be clamped based on quality tier',
          file: mobileGuardFile,
          suggestedFix: {
            type: 'code',
            action: 'Add canvas pixel clamping',
            patch: `const maxCanvasPixels = tier === 'LOW' ? 900000 : tier === 'BALANCED' ? 1200000 : 3000000;`,
            risk: 'safe'
          }
        });
      }

    } catch (error) {
      console.log(`   ⚠️  MobileGuard file not found: ${error.message}`);
    }
  }

  async measureRuntimeFPS() {
    console.log('   📊 Measuring runtime FPS (requires server running)...');
    
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      
      // Test desktop performance
      const desktopFPS = await this.measureFPSForDevice(browser, 'desktop');
      console.log(`   Desktop FPS: ${desktopFPS.toFixed(1)}`);
      
      if (desktopFPS < this.config.targetFPS.desktop) {
        this.issues.push({
          id: 'low-desktop-fps',
          severity: 'high',
          category: 'performance',
          description: `Desktop FPS too low: ${desktopFPS.toFixed(1)} (target: ${this.config.targetFPS.desktop})`,
          file: 'Performance',
          suggestedFix: {
            type: 'code',
            action: 'Reduce post-processing effects or shadow quality',
            patch: null,
            risk: 'moderate'
          }
        });
      }

      // Test mobile performance
      const mobileFPS = await this.measureFPSForDevice(browser, 'mobile');
      console.log(`   Mobile FPS: ${mobileFPS.toFixed(1)}`);
      
      if (mobileFPS < this.config.targetFPS.mobile) {
        this.issues.push({
          id: 'low-mobile-fps',
          severity: 'critical',
          category: 'performance',
          description: `Mobile FPS too low: ${mobileFPS.toFixed(1)} (target: ${this.config.targetFPS.mobile})`,
          file: 'Performance',
          suggestedFix: {
            type: 'code',
            action: 'Disable more effects on mobile or reduce geometry complexity',
            patch: null,
            risk: 'moderate'
          }
        });
      }

      await browser.close();

    } catch (error) {
      console.log(`   ⚠️  Could not measure FPS: ${error.message}`);
      console.log('   (Server may not be running - skip FPS measurement)');
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  async measureFPSForDevice(browser, deviceType) {
    const context = deviceType === 'mobile' 
      ? await browser.newContext({
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
        })
      : await browser.newContext({
          viewport: { width: 1920, height: 1080 },
        });

    const page = await context.newPage();

    // Inject FPS counter
    await page.addInitScript(() => {
      window.fpsLog = [];
      let lastTime = performance.now();
      let frames = 0;

      function measureFPS() {
        frames++;
        const now = performance.now();
        if (now >= lastTime + 1000) {
          const fps = Math.round((frames * 1000) / (now - lastTime));
          window.fpsLog.push(fps);
          frames = 0;
          lastTime = now;
        }
        requestAnimationFrame(measureFPS);
      }
      requestAnimationFrame(measureFPS);
    });

    // Load app
    await page.goto(this.config.serverUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for measurement
    await page.waitForTimeout(this.config.measurementDuration);

    // Extract FPS data
    const fpsData = await page.evaluate(() => window.fpsLog);
    
    await context.close();

    // Calculate average (ignore first 2 seconds for warmup)
    const validData = fpsData.slice(2);
    const avgFPS = validData.length > 0 
      ? validData.reduce((a, b) => a + b, 0) / validData.length 
      : 0;

    return avgFPS;
  }
}

export default PerformanceValidator;
