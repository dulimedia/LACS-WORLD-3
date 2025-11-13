/**
 * MOBILE WEB

GL/THREE.JS KNOWLEDGE BASE
 * 
 * Comprehensive requirements database for mobile optimization
 * Extracted from actual codebase analysis and industry best practices
 */

export const MobileKnowledgeBase = {
  /**
   * WebGL Renderer Configuration Requirements
   */
  webglConfig: {
    required: {
      antialias: false,                    // Mobile GPUs struggle with MSAA
      stencil: false,                      // Save memory
      preserveDrawingBuffer: false,        // Prevents iOS memory leaks
      alpha: false,                        // Performance gain
      depth: true,                         // Required for z-sorting
      logarithmicDepthBuffer: false,       // Expensive on mobile
    },
    
    mobile: {
      powerPreference: 'low-power',        // Battery conscious
      failIfMajorPerformanceCaveat: false, // Don't fail on slow hardware
    },
    
    ios: {
      powerPreference: 'low-power',        // iOS battery management critical
      preferWebGL1: true,                  // WebGL1 more stable on older iOS
      pixelRatio: 1.0,                     // iOS Safari is DPR sensitive
    },
    
    desktop: {
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
    }
  },

  /**
   * Performance Tier Requirements
   */
  performanceTiers: {
    LOW: {
      trigger: {
        deviceMemory: '<= 4GB',
        iosOlderModels: true,
        androidOld: true,
      },
      config: {
        pixelRatio: 1.0,
        shadowMapSize: 1024,
        maxTextureSize: 1024,
        anisotropy: 1,
        postProcessing: false,
        dynamicShadows: false,
        ao: false,
        bloom: false,
        ssgi: false,
        ssr: false,
        maxCanvasPixels: 900000,  // ~950x950 @ 1x DPR
      }
    },
    
    BALANCED: {
      trigger: {
        deviceMemory: '4-8GB',
        modernMobile: true,
      },
      config: {
        pixelRatio: 1.3,
        shadowMapSize: 1024,
        maxTextureSize: 2048,
        anisotropy: 2,
        postProcessing: 'minimal',
        dynamicShadows: false,
        ao: false,
        bloom: true,
        ssgi: false,
        ssr: false,
        maxCanvasPixels: 1200000,  // ~1095x1095 @ 1x DPR
      }
    },
    
    HIGH: {
      trigger: {
        deviceMemory: '> 8GB',
        desktop: true,
      },
      config: {
        pixelRatio: 2.0,
        shadowMapSize: 2048,
        maxTextureSize: 4096,
        anisotropy: 4,
        postProcessing: true,
        dynamicShadows: true,
        ao: true,
        bloom: true,
        ssgi: false,  // Still expensive
        ssr: false,   // Known to be buggy
        maxCanvasPixels: 3000000,  // ~1732x1732 @ 1x DPR
      }
    }
  },

  /**
   * Memory Management Requirements
   */
  memoryLimits: {
    ultraLowMemory: {
      deviceMemoryGB: '< 4',
      iosModels: ['iPhone 6', 'iPhone 7', 'iPhone 8', 'iPhone X', 'iPhone SE', 'iPhone 11'],
      maxTextureSize: 1024,
      maxCanvasPixels: 900000,
    },
    
    lowMemory: {
      deviceMemoryGB: '4',
      maxTextureSize: 2048,
      maxCanvasPixels: 1200000,
    },
    
    normalMemory: {
      deviceMemoryGB: '8+',
      maxTextureSize: 4096,
      maxCanvasPixels: 3000000,
    },
    
    assetLimits: {
      totalBundleSize: '< 30MB',
      mainGLB: '< 200KB',
      unitBoxes: '< 10KB each',
      hdriTextures: '< 10MB each (2K resolution)',
      floorplans: '< 500KB each (WebP)',
    }
  },

  /**
   * Device Detection Patterns
   */
  deviceDetection: {
    mobileUA: [
      'Mobi',
      'Android',
      'iPhone',
      'iPad',
      'iPod',
      'Mobile',
    ],
    
    lowPowerDevices: [
      'iPhone [1-9]',
      'iPhone X',
      'iPhone SE',
      'iPhone 11',
      'iPad [1-4]',
      'Android [1-6]',
    ],
    
    touchDetection: {
      methods: [
        "'ontouchstart' in window",
        "navigator.maxTouchPoints > 0",
      ]
    },
    
    viewportThreshold: 768,  // pixels
    
    iosDetection: '/iPad|iPhone|iPod/.test(navigator.userAgent)',
    androidDetection: '/Android/.test(navigator.userAgent)',
    safariDetection: '/Safari/.test(userAgent) && !/Chrome/.test(userAgent)',
  },

  /**
   * WebGL Context Loss Handling
   */
  contextLoss: {
    required: {
      addEventListener_contextlost: true,
      preventDefault_on_loss: true,
      addEventListener_contextrestored: true,
      reload_on_restore: true,
      localStorage_flag: true,
      user_error_banner: true,
    },
    
    implementation: {
      lostHandler: `
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  console.error('WebGL context lost');
  localStorage.setItem('webglContextLost', 'true');
  // Show user-friendly error banner
}, false);
      `.trim(),
      
      restoredHandler: `
canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  localStorage.removeItem('webglContextLost');
  location.reload();
}, false);
      `.trim()
    }
  },

  /**
   * Asset Loading Strategy
   */
  assetLoading: {
    priority: {
      critical: [
        'buildings.glb',
        'unit-data.csv',
        'Basic materials',
      ],
      
      deferred: [
        'Environment meshes',
        'HDRI textures',
        'Palm tree models',
      ],
      
      onDemand: [
        'Unit box models',
        'Floorplan images',
        'Path tracer shaders',
      ]
    },
    
    mobile: {
      lazyLoadEnvironment: true,
      deferHDRI: true,
      streamGLBOnDemand: true,
      capTextureDimensions: true,
      useDracoSparingly: true,  // CPU decompression cost
      progressiveLoading: true,
    },
    
    desktop: {
      preloadAssets: true,
      fullResolutionTextures: true,
    }
  },

  /**
   * Shadow Configuration
   */
  shadows: {
    desktop: {
      enabled: true,
      mapSize: 2048,
      type: 'PCFShadowMap',
      autoUpdate: false,
      bias: -0.00015,
      normalBias: 0.6,
    },
    
    mobile: {
      enabled: false,  // Too expensive
      mapSize: 1024,   // If absolutely required
      type: 'BasicShadowMap',
      autoUpdate: false,
    }
  },

  /**
   * Post-Processing Effects
   */
  postProcessing: {
    desktop: {
      ssao: true,
      bloom: true,
      godRays: true,
      pathTracing: 'optional',
    },
    
    mobileLow: {
      ssao: false,
      bloom: false,
      godRays: false,
      pathTracing: false,
    },
    
    mobileBalanced: {
      ssao: false,
      bloom: true,  // Lightweight only
      godRays: false,
      pathTracing: false,
    }
  },

  /**
   * Frame Rate Targets
   */
  fpsTargets: {
    desktop: {
      minimum: 60,
      ideal: 60,
    },
    
    mobile: {
      minimum: 30,
      ideal: 55,
      sustained: true,  // Must maintain for 10+ seconds
    },
    
    frameGovernor: {
      enabled: 'mobile only',
      jankThreshold: 50,  // ms
      jankTolerance: 8,   // frames
      degradationStages: {
        stage1: 'Disable bloom',
        stage2: 'Reduce texture quality',
        stage3: 'Simplify geometry',
      }
    }
  },

  /**
   * CSS Requirements
   */
  cssRequirements: {
    pointerEvents: {
      canvas: 'Can be pointer-events: none if UI overlays',
      fabButtons: 'Must have pointer-events: auto',
      sidebar: 'Must not block touch on canvas',
    },
    
    touchTargets: {
      minimumSize: '44x44px',  // iOS HIG
      touchAction: 'manipulation',
    },
    
    viewport: {
      preferredUnit: 'dvh',  // Dynamic viewport height
      fallback: 'vh',
      safeAreaInset: true,  // Handle notches
    },
    
    responsive: {
      mobileBreakpoint: 768,  // pixels
      sidebarWidth: {
        desktop: '420px',
        mobile: 'clamp(320px, 86vw, 380px)',
      }
    }
  },

  /**
   * Validation Rules
   */
  validationRules: [
    {
      id: 'webgl-antialias-mobile',
      category: 'webgl',
      severity: 'critical',
      check: (code) => {
        const hasMobileCheck = code.includes('isMobile') || code.includes("tier === 'mobile");
        const hasAntialiaseFalse = code.includes('antialias: false');
        return hasMobileCheck && hasAntialiaseFalse;
      },
      message: 'Mobile renderer must have antialias: false',
      file: 'src/graphics/makeRenderer.ts',
    },
    
    {
      id: 'webgl-preserve-drawing-buffer',
      category: 'webgl',
      severity: 'high',
      check: (code) => !code.includes('preserveDrawingBuffer: true'),
      message: 'preserveDrawingBuffer: true causes iOS memory leaks',
      file: 'src/graphics/makeRenderer.ts',
    },
    
    {
      id: 'webgl-stencil-disabled',
      category: 'webgl',
      severity: 'medium',
      check: (code) => code.includes('stencil: false'),
      message: 'Stencil buffer should be disabled on mobile for memory savings',
      file: 'src/graphics/makeRenderer.ts',
    },
    
    {
      id: 'ios-power-preference',
      category: 'webgl',
      severity: 'medium',
      check: (code) => {
        const hasIosCheck = code.includes('isIOS') || code.includes('iOS');
        const hasLowPower = code.includes("powerPreference: 'low-power'");
        return hasIosCheck ? hasLowPower : true;
      },
      message: 'iOS devices should use powerPreference: "low-power"',
      file: 'src/graphics/makeRenderer.ts',
    },
    
    {
      id: 'mobile-pixel-ratio',
      category: 'performance',
      severity: 'high',
      check: (code) => {
        const hasPixelRatioClamp = code.includes('Math.min') && code.includes('devicePixelRatio');
        return hasPixelRatioClamp;
      },
      message: 'Mobile pixel ratio must be clamped (max 1.5 for LOW, 2.0 for HIGH)',
      file: 'src/graphics/makeRenderer.ts',
    },
    
    {
      id: 'context-loss-handler',
      category: 'webgl',
      severity: 'critical',
      check: (code) => {
        return code.includes('webglcontextlost') && code.includes('preventDefault');
      },
      message: 'Must handle WebGL context loss with preventDefault',
      file: 'src/graphics/makeRenderer.ts',
    },
    
    {
      id: 'mobile-shadows-disabled',
      category: 'performance',
      severity: 'high',
      check: (code, perfFlags) => {
        if (perfFlags && perfFlags.includes("tier === 'mobileLow'")) {
          return perfFlags.includes('shadowMap.enabled = false') || 
                 perfFlags.includes('SHADOWS_ENABLED: false');
        }
        return true;
      },
      message: 'Shadows must be disabled on mobile LOW tier',
      file: 'src/perf/PerfFlags.ts',
    },
    
    {
      id: 'mobile-post-processing-disabled',
      category: 'performance',
      severity: 'medium',
      check: (code) => {
        return code.includes('qualityTier === \'LOW\'') && 
               (code.includes('ao: false') || code.includes('bloom: false'));
      },
      message: 'Post-processing must be disabled on mobile LOW tier',
      file: 'src/perf/PerfFlags.ts',
    },
    
    {
      id: 'canvas-pixel-clamp',
      category: 'memory',
      severity: 'high',
      check: (code) => {
        return code.includes('maxCanvasPixels') || code.includes('MAX_CANVAS_PIXELS');
      },
      message: 'Canvas pixels must be clamped based on quality tier',
      file: 'src/perf/MobileGuard.tsx',
    },
    
    {
      id: 'frame-governor-mobile',
      category: 'performance',
      severity: 'medium',
      check: (code) => {
        return code.includes('FrameGovernor') || code.includes('jankFrames');
      },
      message: 'Frame governor should monitor performance on mobile',
      file: 'src/perf/MobileGuard.tsx',
    },
  ],

  /**
   * Get suggested fix for a validation rule failure
   */
  getSuggestedFix(ruleId) {
    const fixes = {
      'webgl-antialias-mobile': {
        type: 'code',
        action: 'Set antialias: false for mobile tier',
        patch: `
// In createWebGLRenderer function:
const config = {
  canvas,
  antialias: false,  // Mobile GPUs struggle with MSAA
  // ... other config
};
        `.trim(),
        risk: 'safe'
      },
      
      'webgl-preserve-drawing-buffer': {
        type: 'code',
        action: 'Set preserveDrawingBuffer: false',
        patch: `
const config = {
  preserveDrawingBuffer: false,  // Prevents iOS memory leaks
  // ... other config
};
        `.trim(),
        risk: 'safe'
      },
      
      'ios-power-preference': {
        type: 'code',
        action: 'Use low-power preference on iOS',
        patch: `
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const config = {
  powerPreference: isIOS ? 'low-power' : 'high-performance',
  // ... other config
};
        `.trim(),
        risk: 'safe'
      },
      
      'mobile-pixel-ratio': {
        type: 'code',
        action: 'Clamp device pixel ratio',
        patch: `
const DPR = tier === 'mobile-low' ? 1.0 : 
           tier === 'mobile-balanced' ? Math.min(1.3, window.devicePixelRatio) :
           Math.min(2.0, window.devicePixelRatio);
renderer.setPixelRatio(DPR);
        `.trim(),
        risk: 'safe'
      },
      
      'context-loss-handler': {
        type: 'code',
        action: 'Add WebGL context loss handlers',
        patch: `
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  console.error('WebGL context lost');
  localStorage.setItem('webglContextLost', 'true');
}, false);

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  localStorage.removeItem('webglContextLost');
  location.reload();
}, false);
        `.trim(),
        risk: 'safe'
      },
      
      'mobile-shadows-disabled': {
        type: 'code',
        action: 'Disable shadows on mobile LOW tier',
        patch: `
SHADOWS_ENABLED: qualityTier !== 'LOW',
        `.trim(),
        risk: 'safe'
      },
      
      'mobile-post-processing-disabled': {
        type: 'code',
        action: 'Disable post-processing on mobile LOW tier',
        patch: `
ao: qualityTier === 'HIGH',
bloom: qualityTier !== 'LOW',
ssgi: false,
ssr: false,
        `.trim(),
        risk: 'safe'
      },
    };
    
    return fixes[ruleId] || null;
  }
};

export default MobileKnowledgeBase;
