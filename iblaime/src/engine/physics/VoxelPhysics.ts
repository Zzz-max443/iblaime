import { World } from '../world/World';
import { isSolid } from '../world/BlockRegistry';

// Caja de colisión axis-aligned en espacio de mundo. Deliberadamente sin
// dependencia de THREE (sección 5: el Engine/Physics no debe acoplarse al
// renderer, igual que el World).
export interface Box {
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
}

export function makeBox(centerX: number, feetY: number, centerZ: number, halfWidth: number, height: number): Box {
  return {
    minX: centerX - halfWidth, maxX: centerX + halfWidth,
    minY: feetY, maxY: feetY + height,
    minZ: centerZ - halfWidth, maxZ: centerZ + halfWidth,
  };
}

// Pequeño epsilon para no incluir el bloque exactamente en el borde superior
// de la caja (evita "atascarse" contra el bloque de encima por errores de
// redondeo de punto flotante).
const EPS = 1e-6;

function collides(world: World, box: Box): boolean {
  const x0 = Math.floor(box.minX), x1 = Math.floor(box.maxX - EPS);
  const y0 = Math.floor(box.minY), y1 = Math.floor(box.maxY - EPS);
  const z0 = Math.floor(box.minZ), z1 = Math.floor(box.maxZ - EPS);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        if (isSolid(world.getBlock(x, y, z))) return true;
      }
    }
  }
  return false;
}

// Encuentra la superficie sólida más alta (tope de bloque) debajo de la
// huella X/Z de la caja, dentro del rango que se acaba de barrer al caer.
// `fromY` es una altura donde YA sabemos que no había colisión (así que
// ningún bloque de esta franja tiene su tope por encima), así que alcanza
// con escanear desde ahí hacia abajo hasta `attemptedY`.
function highestSurfaceBelow(world: World, minX: number, maxX: number, minZ: number, maxZ: number, fromY: number, attemptedY: number): number | null {
  const x0 = Math.floor(minX), x1 = Math.floor(maxX - EPS);
  const z0 = Math.floor(minZ), z1 = Math.floor(maxZ - EPS);
  const yStart = Math.floor(fromY - EPS);
  const yEnd = Math.floor(attemptedY);
  let surface: number | null = null;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      for (let y = yStart; y >= yEnd; y--) {
        if (isSolid(world.getBlock(x, y, z))) {
          const top = y + 1;
          if (surface === null || top > surface) surface = top;
          break; // primer sólido bajando en esta columna ya es su tope
        }
      }
    }
  }
  return surface;
}

export interface MoveResult {
  box: Box;
  grounded: boolean;
  velX: number;
  velY: number;
  velZ: number;
}

// Mueve la caja eje por eje (X, luego Z, luego Y) resolviendo colisión y
// anulando la velocidad del eje que chocó. NOT VERIFIED con velocidades
// altas: esto no es swept-AABB continuo, así que a velocidades mucho mayores
// que las del jugador a pie podría atravesar paredes finas en un solo frame
// (tunneling). Con el dt clampeado del Clock y las velocidades de sección 13
// alcanza; revisar si más adelante hay proyectiles o mobs rápidos.
export function moveAndCollide(world: World, box: Box, velX: number, velY: number, velZ: number, dt: number): MoveResult {
  let { minX, minY, minZ, maxX, maxY, maxZ } = box;
  const height = maxY - minY;
  let grounded = false;

  let dx = velX * dt;
  if (dx !== 0) {
    const test: Box = { minX: minX + dx, maxX: maxX + dx, minY, maxY, minZ, maxZ };
    if (collides(world, test)) { velX = 0; dx = 0; }
  }
  minX += dx; maxX += dx;

  let dz = velZ * dt;
  if (dz !== 0) {
    const test: Box = { minX, maxX, minY, maxY, minZ: minZ + dz, maxZ: maxZ + dz };
    if (collides(world, test)) { velZ = 0; dz = 0; }
  }
  minZ += dz; maxZ += dz;

  let dy = velY * dt;
  if (dy !== 0) {
    const test: Box = { minX, maxX, minY: minY + dy, maxY: maxY + dy, minZ, maxZ };
    if (collides(world, test)) {
      if (velY < 0) {
        // Apoyar exactamente en la superficie en vez de cancelar todo el
        // paso: cancelar dejaba al jugador flotando una fracción de bloque
        // arriba del piso tras una caída larga (la torre mide 22 bloques,
        // así que a esa altura el hueco era de más de medio bloque y bien
        // visible). VERIFIED con test de caída libre — ver .ai/sessions.
        const surface = highestSurfaceBelow(world, minX, maxX, minZ, maxZ, minY, minY + dy);
        minY = surface ?? minY + dy;
        maxY = minY + height;
        grounded = true;
      }
      // Golpe de cabeza contra el techo (velY > 0): acá sí alcanza con
      // cancelar el movimiento — la velocidad de subida es mucho menor que
      // la de una caída larga, el hueco resultante no llega a notarse.
      velY = 0;
      dy = 0;
    }
  }
  if (dy !== 0) { minY += dy; maxY += dy; }

  // Chequeo de piso también cuando no hay movimiento vertical (parado quieto):
  // sin esto, grounded quedaría en false apenas la velocidad Y llega a 0.
  if (!grounded && dy === 0 && velY <= 0) {
    const groundCheck: Box = { minX, maxX, minY: minY - EPS, maxY: minY, minZ, maxZ };
    grounded = collides(world, groundCheck);
  }

  return { box: { minX, minY, minZ, maxX, maxY, maxZ }, grounded, velX, velY, velZ };
}
