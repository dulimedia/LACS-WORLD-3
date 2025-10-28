import * as THREE from 'three';
import { fixMirrors } from './fixMirrors';
import { sanitizeTransparency } from './sanitizeTransparency';
import { fixBounds } from './fixBounds';
import { validateGeometry } from './validateGeometry';
import { log } from './debugFlags';

export function makeFacesBehave(root: THREE.Object3D, boostOpacity = false) {
  log.verbose('🔧 Running makeFacesBehave diagnostic suite...');
  
  log.verbose('Step 1: Fixing mirrored geometry and normals...');
  fixMirrors(root);
  
  log.verbose('Step 2: Sanitizing transparent materials...');
  sanitizeTransparency(root, boostOpacity);
  
  log.verbose('Step 3: Fixing bounding volumes...');
  fixBounds(root);
  
  log.verbose('Step 4: Validating geometry for NaN/Infinity...');
  validateGeometry(root);
  
  log.verbose('Step 5: Setting safe material defaults...');
  let invisibleFaces = 0;
  let cullingIssues = 0;
  let keptDoubleSide = 0;
  let switchedToFrontSide = 0;
  
  root.traverse((o: any) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m: any) => {
      if (!m) return;
      
      if (m.opacity === 0 || m.visible === false) {
        console.warn(`⚠️ INVISIBLE: ${o.name || 'unnamed'} has opacity=${m.opacity}, visible=${m.visible}`);
        invisibleFaces++;
      }
      
      if (m.side === THREE.DoubleSide) {
        log.verbose(`✅ Keeping DoubleSide culling on: ${o.name || 'unnamed'} (prevents missing faces)`);
        keptDoubleSide++;
      }
      
      if (m.side === THREE.BackSide) {
        console.warn(`⚠️ BACKFACE: ${o.name || 'unnamed'} using BackSide (faces away from camera!)`);
        cullingIssues++;
      }
    });
  });
  
  if (switchedToFrontSide > 0) log.verbose(`🔄 Switched ${switchedToFrontSide} frame materials to FrontSide`);
  log.verbose(`✅ Kept ${keptDoubleSide} DoubleSide materials (safe rendering)`);
  if (invisibleFaces > 0) log.warn(`⚠️ Found ${invisibleFaces} invisible materials`);
  if (cullingIssues > 0) log.warn(`⚠️ Found ${cullingIssues} BackSide materials (may be invisible!)`);
  
  log.verbose('✅ makeFacesBehave complete!');
}
