import { World } from '../world/World';
import { isSolid } from '../world/BlockRegistry';

export interface RaycastHit {
  x: number; y: number; z: number;    // bloque impactado
  px: number; py: number; pz: number; // celda vacía justo antes del impacto (para colocar ahí)
  normal: [number, number, number];
}

// DDA tipo Amanatides & Woo: recorre celdas de vóxel una por una a lo largo
// del rayo sin saltarse ninguna, importante a corta distancia (que es donde
// se usa esto: alcance de romper/poner bloques). NOT VERIFIED con direcciones
// casi perfectamente axiales (dx/dy/dz muy cercanos a 0 pero no exactamente).
export function raycastVoxel(
  world: World,
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  maxDist: number,
): RaycastHit | null {
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const stepX = Math.sign(dx), stepY = Math.sign(dy), stepZ = Math.sign(dz);

  const tDeltaOf = (d: number) => (d === 0 ? Infinity : Math.abs(1 / d));
  const tDeltaX = tDeltaOf(dx), tDeltaY = tDeltaOf(dy), tDeltaZ = tDeltaOf(dz);

  const firstBoundary = (o: number, step: number) => (step > 0 ? Math.floor(o) + 1 - o : o - Math.floor(o));
  let tMaxX = dx === 0 ? Infinity : firstBoundary(ox, stepX) * tDeltaX;
  let tMaxY = dy === 0 ? Infinity : firstBoundary(oy, stepY) * tDeltaY;
  let tMaxZ = dz === 0 ? Infinity : firstBoundary(oz, stepZ) * tDeltaZ;

  let normal: [number, number, number] = [0, 0, 0];
  let t = 0;

  while (t <= maxDist) {
    if (isSolid(world.getBlock(x, y, z))) {
      // La celda de colocación es la celda vacía por la que veníamos antes
      // de cruzar hacia el bloque sólido, es decir la celda actual
      // desplazada en la MISMA dirección que la normal (que apunta hacia
      // el origen del rayo, no hacia adentro del bloque). Iniciar con
      // "x - normal[0]" acá sería un bug real: colocaría el bloque nuevo
      // del otro lado del impactado.
      return { x, y, z, px: x + normal[0], py: y + normal[1], pz: z + normal[2], normal };
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; t = tMaxX; tMaxX += tDeltaX; normal = [-stepX, 0, 0];
    } else if (tMaxY < tMaxZ) {
      y += stepY; t = tMaxY; tMaxY += tDeltaY; normal = [0, -stepY, 0];
    } else {
      z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; normal = [0, 0, -stepZ];
    }
  }
  return null;
}
