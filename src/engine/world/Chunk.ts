export const CHUNK_SIZE = 16;

export class Chunk {
  readonly cx: number;
  readonly cy: number;
  readonly cz: number;
  readonly blocks: Uint16Array;
  dirty = true;

  constructor(cx: number, cy: number, cz: number) {
    this.cx = cx;
    this.cy = cy;
    this.cz = cz;
    this.blocks = new Uint16Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE); // 0 = air
  }

  private index(lx: number, ly: number, lz: number): number {
    return (ly * CHUNK_SIZE + lz) * CHUNK_SIZE + lx;
  }

  getLocal(lx: number, ly: number, lz: number): number {
    if (lx < 0 || ly < 0 || lz < 0 || lx >= CHUNK_SIZE || ly >= CHUNK_SIZE || lz >= CHUNK_SIZE) return 0;
    return this.blocks[this.index(lx, ly, lz)] ?? 0;
  }

  setLocal(lx: number, ly: number, lz: number, id: number): void {
    this.blocks[this.index(lx, ly, lz)] = id;
    this.dirty = true;
  }

  markDirty(): void {
    this.dirty = true;
  }
}
