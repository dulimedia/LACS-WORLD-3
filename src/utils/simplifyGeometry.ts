import * as THREE from 'three';

export function simplifyGeometryForMobile(geometry: THREE.BufferGeometry, targetRatio = 0.5): THREE.BufferGeometry {
  const vertexCount = geometry.attributes.position.count;
  
  if (vertexCount < 10000) {
    return geometry;
  }
  
  console.log(`🔧 Simplifying geometry: ${vertexCount} vertices → target: ${Math.floor(vertexCount * targetRatio)}`);
  
  const simplified = geometry.clone();
  
  if (simplified.index) {
    const indexCount = simplified.index.count;
    const targetIndexCount = Math.floor(indexCount * targetRatio);
    const step = Math.ceil(indexCount / targetIndexCount);
    
    const newIndices: number[] = [];
    for (let i = 0; i < indexCount; i += step * 3) {
      if (i + 2 < indexCount) {
        newIndices.push(
          simplified.index.array[i],
          simplified.index.array[i + 1],
          simplified.index.array[i + 2]
        );
      }
    }
    
    simplified.setIndex(newIndices);
    console.log(`✅ Simplified to ${newIndices.length / 3} faces (${Math.round(newIndices.length / indexCount * 100)}%)`);
  }
  
  simplified.computeVertexNormals();
  simplified.computeBoundingSphere();
  simplified.computeBoundingBox();
  
  return simplified;
}

export function shouldSimplifyMesh(mesh: THREE.Mesh, isMobile: boolean): boolean {
  if (!isMobile) return false;
  
  const geometry = mesh.geometry;
  if (!geometry || !geometry.attributes.position) return false;
  
  const vertexCount = geometry.attributes.position.count;
  return vertexCount > 50000;
}
