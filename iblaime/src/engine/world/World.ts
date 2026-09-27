import { Chunk, CHUNK_SIZE } from './Chunk';
import { chunkKey, worldToChunk, worldToLocal } from '../math/chunkCoords';
import { AIR_ID } from './BlockRegistry';

// El World es la fuente de verdad de los datos (sección 5 del brief).
// No conoce Three.js ni nada de rendering — eso vive en engine/render/.
export class World {
  private chunks = new Map<string, Chunk>();

  private getOrCreateChunk(cx: number, cy: number, cz: number): Chunk {
    const key = chunkKey(cx, cy, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cy, cz);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  getChunk(cx: number, cy: number, cz: number): Chunk | undefined {
    return this.chunks.get(chunkKey(cx, cy, cz));
  }

  allChunks(): IterableIterator<Chunk> {
    return this.chunks.values();
  }

  getBlock(x: number, y: number, z: number): number {
    const cx = worldToChunk(x, CHUNK_SIZE);
    const cy = worldToChunk(y, CHUNK_SIZE);
    const cz = worldToChunk(z, CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy, cz);
    if (!chunk) return AIR_ID;
    return chunk.getLocal(worldToLocal(x, CHUNK_SIZE), worldToLocal(y, CHUNK_SIZE), worldToLocal(z, CHUNK_SIZE));
  }

  setBlock(x: number, y: number, z: number, id: number): void {
    const cx = worldToChunk(x, CHUNK_SIZE);
    const cy = worldToChunk(y, CHUNK_SIZE);
    const cz = worldToChunk(z, CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(cx, cy, cz);
    const lx = worldToLocal(x, CHUNK_SIZE);
    const ly = worldToLocal(y, CHUNK_SIZE);
    const lz = worldToLocal(z, CHUNK_SIZE);
    chunk.setLocal(lx, ly, lz, id);

    // Invalidación de vecinos: cualquier bloque en el borde del chunk puede
    // afectar el mallado de quien comparte esa cara, arista o esquina. Las
    // aristas/esquinas importan desde que el mesher usa AO por vértice (mira
    // bloques en diagonal a un paso de distancia, no solo los 6 vecinos de
    // cara) — un bloque en la esquina de un chunk puede cambiar el AO de un
    // chunk diagonal. Iteramos las hasta 26 combinaciones posibles y
    // marcamos solo las que realmente comparten ese borde (dirty es un
    // no-op barato si el chunk no existe todavía: nada que actualizar).
    const dxRange = lx === 0 ? [-1, 0] : lx === CHUNK_SIZE - 1 ? [0, 1] : [0];
    const dyRange = ly === 0 ? [-1, 0] : ly === CHUNK_SIZE - 1 ? [0, 1] : [0];
    const dzRange = lz === 0 ? [-1, 0] : lz === CHUNK_SIZE - 1 ? [0, 1] : [0];
    for (const ddx of dxRange) {
      for (const ddy of dyRange) {
        for (const ddz of dzRange) {
          if (ddx === 0 && ddy === 0 && ddz === 0) continue; // el propio chunk ya quedó dirty en setLocal
          this.getChunk(cx + ddx, cy + ddy, cz + ddz)?.markDirty();
        }
      }
    }
  }
}
