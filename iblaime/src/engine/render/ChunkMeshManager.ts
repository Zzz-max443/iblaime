import * as THREE from 'three';
import { World } from '../world/World';
import { Chunk } from '../world/Chunk';
import { meshChunk } from './ChunkMesher';

// Un solo material compartido para todos los chunks opacos (Dimensión 1 — batching:
// todos los chunks comparten la misma referencia de material, no una por chunk).
// side: DoubleSide es temporal — ver DECISIONS.md.
const sharedMaterial = new THREE.MeshLambertMaterial({
  vertexColors: true,
  flatShading: true,
  side: THREE.DoubleSide,
});

export class ChunkMeshManager {
  private meshes = new Map<Chunk, THREE.Mesh>();

  constructor(private world: World, private scene: THREE.Scene) {}

  // Reconstruye todos los chunks marcados como "dirty". Corre en el hilo
  // principal (correctness-first). NOT VERIFIED en Android: hay que medir con
  // el Profiler cuánto tarda esto con un mundo más grande antes de decidir si
  // migramos a un Web Worker (sección 7 del brief).
  update(): number {
    let rebuilt = 0;
    for (const chunk of this.world.allChunks()) {
      if (!chunk.dirty) continue;
      this.rebuildChunk(chunk);
      chunk.dirty = false;
      rebuilt++;
    }
    return rebuilt;
  }

  private rebuildChunk(chunk: Chunk): void {
    const existing = this.meshes.get(chunk);
    if (existing) {
      this.scene.remove(existing);
      existing.geometry.dispose();
      this.meshes.delete(chunk);
    }

    const data = meshChunk(this.world, chunk);
    if (data.indices.length === 0) return; // chunk vacío (todo aire): no hace falta mesh

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, sharedMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.meshes.set(chunk, mesh);
  }

  get meshCount(): number {
    return this.meshes.size;
  }
}
