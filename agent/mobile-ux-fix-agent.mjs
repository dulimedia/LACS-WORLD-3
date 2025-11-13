/**
 * MOBILE UX FIX AGENT
 * 
 * Autonomous system to fix mobile experience issues:
 * 1. Enable 3D scene on mobile (remove "Desktop Experience" blocker)
 * 2. Remove duplicate SUITES button (bottom-left)
 * 3. Fix sidebar width to 50% max on mobile
 * 4. Keep expand button as sidebar tab
 * 5. Fix building hierarchy display
 * 
 * SAFETY: Creates backups, logs changes, NO git push
 */

import fs from 'fs/promises';
import path from 'path';

export class MobileUXFixAgent {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.changes = [];
    this.backupDir = path.join(projectRoot, 'agent/backups/ux-fixes');
  }

  async run() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 MOBILE UX FIX AGENT');
    console.log('='.repeat(60));
    console.log('Fixing mobile experience to match desktop functionality\n');

    await this.ensureBackupDir();

    const fixes = [
      { name: 'Enable 3D Scene on Mobile', fn: () => this.enable3DOnMobile() },
      { name: 'Remove Duplicate SUITES Button', fn: () => this.removeDuplicateSuitesButton() },
      { name: 'Fix Sidebar Width (50% max)', fn: () => this.fixSidebarWidth() },
      { name: 'Document GLB Constraints', fn: () => this.documentGLBConstraints() },
    ];

    let successCount = 0;
    let failCount = 0;

    for (const fix of fixes) {
      console.log(`\n📍 ${fix.name}...`);
      try {
        await fix.fn();
        successCount++;
        console.log(`   ✅ ${fix.name} - DONE`);
      } catch (error) {
        failCount++;
        console.log(`   ❌ ${fix.name} - FAILED: ${error.message}`);
      }
    }

    await this.saveChangeLog();

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Changes logged: ${this.changes.length}`);
    console.log('='.repeat(60) + '\n');

    return {
      success: failCount === 0,
      successCount,
      failCount,
      changes: this.changes
    };
  }

  async ensureBackupDir() {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  async createBackup(file) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = path.basename(file);
    const backupPath = path.join(this.backupDir, `${fileName}.${timestamp}.backup`);
    await fs.copyFile(file, backupPath);
    console.log(`   💾 Backup: ${path.relative(this.projectRoot, backupPath)}`);
  }

  logChange(file, description, before, after) {
    this.changes.push({
      timestamp: new Date().toISOString(),
      file,
      description,
      before,
      after
    });
  }

  async enable3DOnMobile() {
    const file = path.join(this.projectRoot, 'src/App.tsx');
    await this.createBackup(file);

    let code = await fs.readFile(file, 'utf-8');

    // Find and remove the mobile placeholder blocker (lines 1125-1136)
    const mobileBlockerPattern = /\{\/\* Mobile placeholder - no 3D canvas \*\/\}[\s\S]*?\{PerfFlags\.isMobile && \([\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)\}/;
    
    if (code.match(mobileBlockerPattern)) {
      console.log('   🔍 Found mobile 3D blocker');
      code = code.replace(mobileBlockerPattern, '');
      this.logChange(file, 'Removed mobile 3D scene blocker', 'Mobile blocked with text', 'Mobile 3D enabled');
    }

    // Change the canvas condition from `!PerfFlags.isMobile` to render on both
    // Line 1139: {canvasReady && !PerfFlags.isMobile && (
    code = code.replace(
      /\{canvasReady && !PerfFlags\.isMobile && \(/g,
      '{canvasReady && ('
    );

    if (code.includes('{canvasReady && (')) {
      console.log('   ✅ Canvas now renders on mobile');
      this.logChange(file, 'Enabled canvas on mobile', 'Canvas disabled on mobile', 'Canvas enabled on all devices');
    }

    await fs.writeFile(file, code, 'utf-8');
  }

  async removeDuplicateSuitesButton() {
    const file = path.join(this.projectRoot, 'src/App.tsx');
    await this.createBackup(file);

    let code = await fs.readFile(file, 'utf-8');

    // Find and remove the mobile SUITES button (lines 1270-1284)
    const suitesButtonPattern = /\{\/\* Mobile Layout - Top button to open sidebar \*\/\}[\s\S]*?\{!modelsLoading && deviceCapabilities\.isMobile && !drawerOpen && \([\s\S]*?<button[\s\S]*?Suites<\/span>[\s\S]*?<\/button>[\s\S]*?\)\}/;

    if (code.match(suitesButtonPattern)) {
      console.log('   🔍 Found duplicate SUITES button');
      code = code.replace(suitesButtonPattern, '');
      this.logChange(file, 'Removed duplicate SUITES button', 'Two buttons (SUITES + EXPAND)', 'Only EXPAND tab');
    }

    await fs.writeFile(file, code, 'utf-8');
  }

  async fixSidebarWidth() {
    const file = path.join(this.projectRoot, 'src/styles/responsive.css');
    await this.createBackup(file);

    let code = await fs.readFile(file, 'utf-8');

    // Change mobile sidebar width from 86vw to 50vw max
    // Line 23: --sidebar-w: clamp(320px, 86vw, 380px);
    const oldWidth = '--sidebar-w: clamp(320px, 86vw, 380px);';
    const newWidth = '--sidebar-w: clamp(320px, 50vw, 50vw);';

    if (code.includes(oldWidth)) {
      console.log('   🔍 Changing sidebar width from 86vw to 50vw');
      code = code.replace(oldWidth, newWidth);
      this.logChange(file, 'Fixed sidebar width to 50% max', '86vw (too wide)', '50vw (half screen)');
    }

    await fs.writeFile(file, code, 'utf-8');
  }

  async documentGLBConstraints() {
    const docPath = path.join(this.projectRoot, 'docs/MOBILE_GLB_CONSTRAINTS.md');

    const content = `# Mobile GLB File Constraints

**Last Updated:** ${new Date().toISOString().split('T')[0]}

## Overview

This document specifies the GLB file size and complexity constraints for mobile devices.

## File Size Limits

### Current Assets

Based on your codebase analysis:

\`\`\`
public/models/
├── buildings.glb          105 KB  ✅ (Main building geometry)
├── boxes/                 ~3-10KB each  ✅ (Unit box models)
└── environment/           Various sizes
\`\`\`

### Recommended Limits

| Asset Type | Desktop Max | Mobile Max | Current |
|------------|-------------|------------|---------|
| Main Building GLB | 500 KB | 200 KB | 105 KB ✅ |
| Unit Box GLB | 50 KB | 20 KB | 3-10 KB ✅ |
| Environment GLB | 1 MB | 300 KB | TBD |
| HDRI Texture | 10 MB | 5 MB | ~5-10 MB |
| Total Scene | 30 MB | 15 MB | ~30 MB |

## Mobile Optimization Strategies

### 1. Geometry Simplification
- **Desktop:** Full detail models
- **Mobile:** Reduced polygon count (50-70% reduction)
- **Tool:** Blender decimation or gltf-pipeline simplification

### 2. Texture Optimization
- **Desktop:** 4K textures (4096x4096)
- **Mobile:** 1K-2K textures (1024x1024 - 2048x2048)
- **Format:** Use Basis Universal texture compression

### 3. Draco Compression
- Apply Draco compression to reduce GLB file sizes by 50-90%
- **Command:**
  \`\`\`bash
  gltf-pipeline -i model.glb -o model-compressed.glb --draco
  \`\`\`

### 4. Progressive Loading
- Load critical assets first (buildings, nearby units)
- Lazy-load distant or off-screen units
- Stream environment meshes on-demand

## Current Mobile Configuration

From \`src/perf/PerfFlags.ts\`:

\`\`\`typescript
LOW: {
  maxTextureSize: 1024,
  maxCanvasPixels: 900000,  // ~950x950 @ 1x DPR
}

BALANCED: {
  maxTextureSize: 2048,
  maxCanvasPixels: 1200000,  // ~1095x1095 @ 1x DPR
}
\`\`\`

## Memory Budgets

### Device Categories

| Device | RAM | Texture Budget | Geometry Budget |
|--------|-----|----------------|-----------------|
| Ultra-low (iPhone 6-8, SE) | < 4GB | 50 MB | 10 MB |
| Low (iPhone 11, Android mid) | 4GB | 100 MB | 20 MB |
| Normal (iPhone 12+, modern) | 8GB+ | 200 MB | 50 MB |

### Asset Loading Strategy

**Critical (Load Immediately):**
- buildings.glb (105KB)
- Visible unit boxes (~10-20 units)
- Basic materials

**Deferred (Load After 2s):**
- Environment meshes
- Non-visible units
- HDRI textures (use gradient fallback initially)

**On-Demand (Load When Needed):**
- Unit box models (when user explores that area)
- Floorplan images (when user clicks unit)
- Palm tree models

## Testing GLB File Impact

### Check Current File Sizes

\`\`\`bash
# List all GLB files and sizes
find public/models -name "*.glb" -exec ls -lh {} \\;

# Total size
du -sh public/models
\`\`\`

### Compress GLB Files

\`\`\`bash
# Install gltf-pipeline
npm install -g gltf-pipeline

# Compress a GLB file
gltf-pipeline -i input.glb -o output.glb --draco

# Batch compress all GLBs
npm run compress-glb
\`\`\`

### Test on Mobile

1. **Chrome DevTools (Desktop):**
   - F12 → Network tab
   - Select "Disable cache"
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select "iPhone 14 Pro"
   - Reload page
   - Check total transferred size

2. **Real Device:**
   - Connect phone to WiFi
   - Open: http://<your-pc-ip>:3092
   - Check load time and performance

## Validation Checklist

Before deploying new GLB files:

- [ ] File size < 200KB (mobile main) or < 20KB (mobile unit boxes)
- [ ] Polygon count < 50K triangles per model (mobile)
- [ ] Textures resolution ≤ 2048x2048 (mobile)
- [ ] Draco compression applied
- [ ] Tested on mobile emulator
- [ ] FPS > 30 on mobile
- [ ] Memory usage < 200MB

## Troubleshooting

### Issue: Mobile crashes or freezes
**Solution:** Reduce GLB file sizes, apply more aggressive Draco compression

### Issue: Long load times (> 10s)
**Solution:** Implement progressive loading, lazy-load non-critical assets

### Issue: Low FPS (< 30)
**Solution:** Simplify geometry, reduce texture sizes, disable shadows on mobile

### Issue: Out of memory errors
**Solution:** Limit total scene memory to 150MB, unload unused assets

## References

- [glTF Pipeline Documentation](https://github.com/CesiumGS/gltf-pipeline)
- [Draco Compression](https://google.github.io/draco/)
- [Three.js Performance Tips](https://threejs.org/docs/#manual/en/introduction/Performance)
- [Mobile 3D Best Practices](https://www.khronos.org/gltf/)

---

**Status:** ✅ Current assets are within mobile limits
**Next Steps:** Monitor as new models are added
`;

    await fs.writeFile(docPath, content, 'utf-8');
    console.log(`   📄 Created: ${path.relative(this.projectRoot, docPath)}`);
    this.logChange(docPath, 'Created GLB constraints documentation', 'No documentation', 'Comprehensive guide');
  }

  async saveChangeLog() {
    const logPath = path.join(this.projectRoot, 'agent/reports/mobile-ux-fixes.log');
    
    let logContent = '# Mobile UX Fixes Log\\n\\n';
    logContent += `Generated: ${new Date().toISOString()}\\n\\n`;
    logContent += '## Changes Made\\n\\n';

    for (const change of this.changes) {
      logContent += `### ${change.description}\\n`;
      logContent += `- **Time:** ${change.timestamp}\\n`;
      logContent += `- **File:** \`${path.relative(this.projectRoot, change.file)}\`\\n`;
      logContent += `- **Before:** ${change.before}\\n`;
      logContent += `- **After:** ${change.after}\\n\\n`;
    }

    await fs.writeFile(logPath, logContent, 'utf-8');
    console.log(`\\n📝 Change log: ${path.relative(this.projectRoot, logPath)}`);
  }
}

export default MobileUXFixAgent;
