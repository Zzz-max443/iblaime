// Tests de humo sin framework (sección 17 del brief: "todo sistema
// importante debe probarse"; sin dependencias nuevas porque esto no necesita
// jest/vitest todavía). Correr con: npm run verify
//
// Cada función devuelve void y usa assert() — si algo falla, tira y el
// proceso sale con código != 0. Esto NO reemplaza probar en el navegador o en
// Android; cubre la lógica pura de World/Physics/Raycast/Mesher que sí se
// puede correr en Node sin WebGL.

import { World } from '../src/engine/world/World';
import { meshChunk } from '../src/engine/render/ChunkMesher';
import { makeBox, moveAndCollide } from '../src/engine/physics/VoxelPhysics';
import { raycastVoxel } from '../src/engine/interaction/Raycast';
import { generateInitialWorld } from '../src/game/world/generateInitialWorld';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error('FALLÓ: ' + msg);
}

// --- World: invalidación de vecinos (cara + arista/esquina) ---------------
// Bug real corregido esta sesión: la invalidación original solo cubría los 6
// vecinos de cara. El AO por vértice del mesher lee bloques en diagonal, así
// que un chunk nuevo en una esquina también puede ensuciar el mesh de un
// chunk diagonal.
function testNeighborInvalidation(): void {
  const w = new World();
  w.setBlock(5, 5, 5, 1);
  const chunkA = w.getChunk(0, 0, 0)!;
  chunkA.dirty = false;

  w.setBlock(16, 5, 5, 1); // crea el chunk vecino de CARA (1,0,0) por primera vez
  assert(chunkA.dirty, 'vecino de cara existente debería quedar dirty cuando aparece un chunk nuevo al lado');

  chunkA.dirty = false;
  w.setBlock(-1, -1, 0, 1); // crea el chunk vecino DIAGONAL (-1,-1,0) por primera vez
  assert(chunkA.dirty, 'vecino diagonal existente debería quedar dirty (lo necesita el AO)');
}

// --- ChunkMesher: winding de las 6 caras ------------------------------------
// Bug real corregido esta sesión: +X y -X tenían el orden de vértices
// invertido respecto a su normal declarada (enmascarado por DoubleSide).
function testFaceWinding(): void {
  type V3 = [number, number, number];
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a: V3, b: V3): V3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];

  const w = new World();
  // Un solo bloque rodeado de aire: emite las 6 caras, cada una con su propio quad.
  w.setBlock(0, 0, 0, 1);
  const data = meshChunk(w, w.getChunk(0, 0, 0)!);
  const faceCount = data.indices.length / 6; // 2 triángulos por cara
  assert(faceCount === 6, `se esperaban 6 caras para un bloque aislado, hubo ${faceCount}`);

  for (let f = 0; f < faceCount; f++) {
    const i0 = data.indices[f * 6]!;
    const i1 = data.indices[f * 6 + 1]!;
    const i2 = data.indices[f * 6 + 2]!;
    const v = (i: number): V3 => [data.positions[i * 3]!, data.positions[i * 3 + 1]!, data.positions[i * 3 + 2]!];
    const n = cross(sub(v(i1), v(i0)), sub(v(i2), v(i0)));
    // El normal attribute (el que realmente usa la GPU para iluminar) tiene
    // que apuntar en la misma dirección que el normal geométrico del
    // triángulo (lo que importa para el futuro FrontSide/backface culling).
    const nx = data.normals[i0 * 3]!, ny = data.normals[i0 * 3 + 1]!, nz = data.normals[i0 * 3 + 2]!;
    const dot = n[0] * nx + n[1] * ny + n[2] * nz;
    assert(dot > 0, `cara con winding invertido respecto a su normal declarada (normal=${[nx, ny, nz]})`);
  }
}

// --- Physics: caída, salto, pared, caída desde la torre completa ----------
function testPhysics(): void {
  const GRAVITY = -28;
  const w = new World();
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) w.setBlock(x, 0, z, 1);
  for (let y = 1; y <= 3; y++) for (let z = -2; z <= 2; z++) w.setBlock(3, y, z, 1);

  // Caída libre: debe apoyarse exactamente en y=1, sin gap ni tunneling.
  let box = makeBox(0, 10, 0, 0.3, 1.8);
  let vy = 0;
  let landed = false;
  for (let i = 0; i < 300 && !landed; i++) {
    vy += GRAVITY * (1 / 60);
    const r = moveAndCollide(w, box, 0, vy, 0, 1 / 60);
    box = r.box; vy = r.velY;
    landed = r.grounded;
  }
  assert(landed, 'nunca aterrizó en caída libre');
  assert(box.minY === 1, `debería apoyarse exacto en y=1, quedó en ${box.minY}`);

  // Salto: sube y vuelve a aterrizar sin gap.
  vy = 9;
  landed = false;
  for (let i = 0; i < 300 && !landed; i++) {
    if (i > 0) vy += GRAVITY * (1 / 60);
    const r = moveAndCollide(w, box, 0, vy, 0, 1 / 60);
    box = r.box; vy = r.velY;
    if (i > 3) landed = r.grounded;
  }
  assert(landed, 'el salto nunca volvió a aterrizar');
  assert(box.minY === 1, `debería volver a apoyarse exacto en y=1, quedó en ${box.minY}`);

  // Pared: no debe atravesarla incluso con velocidad alta.
  box = makeBox(0, 1, 0, 0.3, 1.8);
  let vx = 20;
  for (let i = 0; i < 60; i++) {
    const r = moveAndCollide(w, box, vx, 0, 0, 1 / 60);
    box = r.box; vx = r.velX;
  }
  assert(box.maxX <= 3 + 1e-6, `atravesó la pared en x=3, maxX quedó en ${box.maxX}`);

  // Caída desde arriba de la torre completa (~24 unidades): sin tunneling.
  const world2 = new World();
  generateInitialWorld(world2);
  let towerBox = makeBox(0, 24, 0, 0.3, 1.8);
  let towerVy = 0;
  let towerLanded = false;
  for (let i = 0; i < 600 && !towerLanded; i++) {
    towerVy += GRAVITY * (1 / 60);
    const r = moveAndCollide(world2, towerBox, 0, towerVy, 0, 1 / 60);
    towerBox = r.box; towerVy = r.velY;
    towerLanded = r.grounded;
  }
  assert(towerLanded, 'nunca aterrizó cayendo desde la torre completa');
  assert(towerBox.minY === 1, `caída desde la torre debería apoyarse en y=1, quedó en ${towerBox.minY}`);
}

// --- Raycast: impacto, alcance, celda de colocación -------------------------
function testRaycast(): void {
  const w = new World();
  w.setBlock(5, 5, 5, 1);

  const hit = raycastVoxel(w, 0, 5.5, 5.5, 1, 0, 0, 20);
  assert(hit !== null, 'debería impactar el bloque');
  assert(hit!.x === 5 && hit!.y === 5 && hit!.z === 5, 'coordenadas de impacto incorrectas');
  // Bug real corregido esta sesión: la celda de colocación tenía el signo
  // invertido (quedaba del lado opuesto de por dónde vino el rayo).
  assert(hit!.px === 4 && hit!.py === 5 && hit!.pz === 5, `celda de colocación incorrecta: ${[hit!.px, hit!.py, hit!.pz]}`);
  assert(w.getBlock(hit!.px, hit!.py, hit!.pz) === 0, 'la celda de colocación debe estar vacía');

  const outOfRange = raycastVoxel(w, 0, 5.5, 5.5, 1, 0, 0, 3);
  assert(outOfRange === null, 'no debería impactar nada fuera de alcance');

  const diagonal = raycastVoxel(w, 0, 0, 0, 1, 1, 1, 20);
  assert(diagonal !== null && diagonal.x === 5 && diagonal.y === 5 && diagonal.z === 5, 'rayo diagonal debería impactar el mismo bloque');
}

const tests: [string, () => void][] = [
  ['World: invalidación de vecinos (cara + diagonal)', testNeighborInvalidation],
  ['ChunkMesher: winding de las 6 caras', testFaceWinding],
  ['VoxelPhysics: caída/salto/pared/torre', testPhysics],
  ['Raycast: impacto y colocación', testRaycast],
];

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✘ ${name}`);
    console.error('  ' + (e instanceof Error ? e.message : String(e)));
  }
}

if (failed > 0) {
  console.error(`\n${failed}/${tests.length} tests fallaron.`);
  process.exit(1);
} else {
  console.log(`\n${tests.length}/${tests.length} tests OK. (Esto NO reemplaza probar en navegador/Android — ver .ai/HANDOFF.md.)`);
}
