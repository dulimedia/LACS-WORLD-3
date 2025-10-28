import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';
import { makeFacesBehave } from '../utils/makeFacesBehave';
import { fixInvertedFacesSelective } from '../utils/fixInvertedFacesSelective';
import { generateSceneReport, printReport } from '../debug/MeshInspector';
import { useThree } from '@react-three/fiber';
import { simplifyGeometryForMobile, shouldSimplifyMesh } from '../utils/simplifyGeometry';
import { PerfFlags } from '../perf/PerfFlags';
import { log } from '../utils/debugFlags';

interface SingleEnvironmentMeshProps {
  tier: string;
}

export function SingleEnvironmentMesh({ tier }: SingleEnvironmentMeshProps) {
  const { gl } = useThree();
  
  const isSmallViewport = window.innerWidth < 600 || window.innerHeight < 600;
  const isMobile = tier.startsWith('mobile') || PerfFlags.isMobile || isSmallViewport;
  
  console.log(`🎮 SingleEnvironmentMesh: tier=${tier}, isMobile=${isMobile}, viewport=${window.innerWidth}x${window.innerHeight}, PerfFlags.isMobile=${PerfFlags.isMobile}`);
  
  const others = useGLTF('/models/environment/others2.glb');
  const frame = useGLTF('/models/environment/frame-raw-14.glb');
  const roof = useGLTF('/models/environment/roof and walls.glb');
  const stages = useGLTF('/models/environment/stages.glb');
  
  const shadowsEnabled = gl && (gl as any).shadowMap?.enabled !== false && !isMobile;

  useEffect(() => {
    if (others.scene) {
      log.info('🔵 Processing Others2 model...');
      makeFacesBehave(others.scene, true);
      
      let meshCount = 0;
      let shadowCount = 0;
      
      others.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          meshCount++;
          
          if (mesh.geometry && mesh.geometry.attributes.position) {
            const vertCount = mesh.geometry.attributes.position.count;
            log.verbose(`  Mesh: ${mesh.name || 'unnamed'} (${vertCount} vertices)`);
            
            if (shouldSimplifyMesh(mesh, isMobile)) {
              const originalVerts = mesh.geometry.attributes.position.count;
              mesh.geometry = simplifyGeometryForMobile(mesh.geometry, 0.3);
              const newVerts = mesh.geometry.attributes.position.count;
              console.log(`📉 Simplified ${mesh.name}: ${originalVerts} → ${newVerts} vertices`);
            }
          }
          
          if (shadowsEnabled) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            shadowCount++;
          }
          
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat: any) => {
              if (shadowsEnabled) {
                mat.shadowSide = THREE.FrontSide;
              }
              
              if (mat.normalMap) {
                log.verbose(`  📄 Removed normalMap from ${mesh.name || 'unnamed'}`);
                delete mat.normalMap;
              }
              if (mat.roughnessMap) delete mat.roughnessMap;
              if (mat.metalnessMap) delete mat.metalnessMap;
              if (mat.map) mat.map.needsUpdate = true;
              mat.needsUpdate = true;
            });
          }
        }
      });
      log.info(`✅ Others2 configured: ${meshCount} meshes, ${shadowCount} shadow-enabled`);
    }
  }, [others.scene, isMobile]);

  useEffect(() => {
    if (frame.scene) {
      log.info('🔵 Processing Frame model...');
      makeFacesBehave(frame.scene);
      log.verbose('🔧 Running selective face fixer on Frame...');
      fixInvertedFacesSelective(frame.scene);
      log.info('✅ Frame configured with safe selective face fixing');
    }
  }, [frame.scene, isMobile]);

  useEffect(() => {
    if (roof.scene) {
      log.info('🔵 Processing Roof model...');
      makeFacesBehave(roof.scene);
      
      let meshCount = 0;
      roof.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          meshCount++;
          
          if (shadowsEnabled) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  mat.shadowSide = THREE.FrontSide;
                });
              } else {
                mesh.material.shadowSide = THREE.FrontSide;
              }
            }
          }
        }
      });
      log.info(`✅ Roof configured: ${meshCount} meshes`);
    }
  }, [roof.scene, isMobile]);

  useEffect(() => {
    if (stages.scene) {
      log.info('🔵 Processing Stages model...');
      makeFacesBehave(stages.scene);
      
      let meshCount = 0;
      stages.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          meshCount++;
          
          if (shadowsEnabled) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  mat.shadowSide = THREE.FrontSide;
                });
              } else {
                mesh.material.shadowSide = THREE.FrontSide;
              }
            }
          }
        }
      });
      log.info(`✅ Stages configured: ${meshCount} meshes`);
    }
  }, [stages.scene, isMobile]);

  return (
    <>
      <primitive object={others.scene} />
      <primitive object={frame.scene} />
      <primitive object={roof.scene} />
      <primitive object={stages.scene} />
    </>
  );
}
