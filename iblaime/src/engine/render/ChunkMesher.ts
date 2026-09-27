import { Chunk, CHUNK_SIZE } from '../world/Chunk';
import { World } from '../world/World';
import { getBlockDef, isSolid } from '../world/BlockRegistry';

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

interface FaceDef {
  normal: [number, number, number];
  corners: [number, number, number][]; // 4 esquinas del quad, en orden cíclico (no cruzado)
}

// Winding verificado con producto cruz para las 6 caras (VERIFIED — ver
// .ai/sessions): cross(v1-v0, v2-v0) coincide con la normal declarada en
// cada una. Antes había un bug real en +X/-X con el winding invertido,
// enmascarado porque el material usa THREE.DoubleSide. Con esto corregido
// ya se puede evaluar pasar a FrontSide (mitad de fragmentos por cara
// opaca) — ver DECISIONS.md.
const FACES: FaceDef[] = [
  { normal: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },   // +X
  { normal: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },  // -X
  { normal: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },   // +Y
  { normal: [0, -1, 0], corners: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]] },  // -Y
  { normal: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },   // +Z
  { normal: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },  // -Z
];

// Jitter procedural barato: variación de color por bloque a partir de un hash
// entero de sus coordenadas de mundo (Dimensión 2 — evita el "cubo gris plano").
function hashJitter(x: number, y: number, z: number): number {
  let h = x * 374761393 + y * 668265263 + z * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h & 0xff) / 255 - 0.5) * 0.08; // +-4% de variación
}

// --- Ambient occlusion por vértice (Dimensión 3 — Iluminación / Dimensión 4 —
// Percepción). Técnica estándar de vóxeles: para cada esquina del quad se
// miran los dos bloques "de borde" y el bloque "de esquina" en la capa vacía
// justo delante de la cara, y se oscurece el vértice según cuántos de esos
// tres están ocupados. Es barato, no depende de shaders, y funciona con
// flatShading (cada vértice lleva su propio color, ver DECISIONS.md).
function tangentAxes(normal: [number, number, number]): [number, number] {
  const axes: number[] = [];
  for (let i = 0; i < 3; i++) if (normal[i] === 0) axes.push(i);
  return [axes[0]!, axes[1]!];
}

function withAxisOffset(base: [number, number, number], axis: number, delta: number): [number, number, number] {
  // number[] (no tupla) a propósito: con noUncheckedIndexedAccess, indexar una
  // tupla con una variable (no un literal) hace que TS trate el resultado
  // como possibly-undefined incluso al escribir; un array común evita eso.
  const r: number[] = [base[0], base[1], base[2]];
  r[axis] = (r[axis] ?? 0) + delta;
  return r as [number, number, number];
}

function vertexAO(side1: boolean, side2: boolean, corner: boolean): number {
  if (side1 && side2) return 0; // esquina interior totalmente encerrada: máxima oclusión
  return 3 - (Number(side1) + Number(side2) + Number(corner));
}

const AO_LUT = [0.45, 0.65, 0.85, 1.0]; // NOT VERIFIED: ajustar a ojo una vez que haya texturas reales

export function meshChunk(world: World, chunk: Chunk): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const baseX = chunk.cx * CHUNK_SIZE;
  const baseY = chunk.cy * CHUNK_SIZE;
  const baseZ = chunk.cz * CHUNK_SIZE;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const id = chunk.getLocal(lx, ly, lz);
        if (!isSolid(id)) continue;

        const wx = baseX + lx, wy = baseY + ly, wz = baseZ + lz;
        const def = getBlockDef(id);
        const jitter = hashJitter(wx, wy, wz);

        for (const face of FACES) {
          const [dx, dy, dz] = face.normal;
          const neighborId = world.getBlock(wx + dx, wy + dy, wz + dz);
          if (isSolid(neighborId)) continue; // cara oculta: no emitir geometría

          const baseColor = dy === 1 ? def.colorTop : dy === -1 ? def.colorBottom : def.colorSide;
          const r = Math.min(1, Math.max(0, baseColor[0] + jitter));
          const g = Math.min(1, Math.max(0, baseColor[1] + jitter));
          const b = Math.min(1, Math.max(0, baseColor[2] + jitter));

          // TODO(perf): esto suma hasta 12 lookups de World.getBlock por cara
          // (3 por esquina) además del chequeo de vecino de arriba. Si el
          // Profiler muestra que el remallado es un cuello de botella con
          // chunks más grandes, cachear un buffer local con 1 bloque de
          // padding por chunk (incluyendo vecinos) en vez de golpear el Map
          // de chunks del World en cada lookup.
          const [ta, tb] = tangentAxes(face.normal);
          const base: [number, number, number] = [wx + dx, wy + dy, wz + dz];
          const aoValues: number[] = [];
          for (const corner of face.corners) {
            const oa = corner[ta] === 1 ? 1 : -1;
            const ob = corner[tb] === 1 ? 1 : -1;
            const side1Pos = withAxisOffset(base, ta, oa);
            const side2Pos = withAxisOffset(base, tb, ob);
            const cornerPos = withAxisOffset(side1Pos, tb, ob);
            const side1 = isSolid(world.getBlock(side1Pos[0], side1Pos[1], side1Pos[2]));
            const side2 = isSolid(world.getBlock(side2Pos[0], side2Pos[1], side2Pos[2]));
            const cornerSolid = isSolid(world.getBlock(cornerPos[0], cornerPos[1], cornerPos[2]));
            aoValues.push(vertexAO(side1, side2, cornerSolid));
          }

          const startIndex = positions.length / 3;
          for (let i = 0; i < 4; i++) {
            const [cx, cy, cz] = face.corners[i]!;
            const ao = AO_LUT[aoValues[i]!]!;
            positions.push(wx + cx, wy + cy, wz + cz);
            normals.push(dx, dy, dz);
            colors.push(r * ao, g * ao, b * ao);
          }

          // Elegir la diagonal del quad que une las esquinas con oclusión más
          // parecida evita el artefacto clásico de "diagonal falsa" (esquinas
          // interpoladas incorrectamente cuando el quad se parte en el lado
          // equivocado). Técnica estándar de AO en vóxeles.
          const flip = aoValues[0]! + aoValues[2]! < aoValues[1]! + aoValues[3]!;
          if (flip) {
            indices.push(startIndex, startIndex + 1, startIndex + 3, startIndex + 1, startIndex + 2, startIndex + 3);
          } else {
            indices.push(startIndex, startIndex + 1, startIndex + 2, startIndex, startIndex + 2, startIndex + 3);
          }
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    colors: new Float32Array(colors),
    indices: new Uint32Array(indices),
  };
}
