import { World } from '../../engine/world/World';

// Mundo inicial (sección 12 del brief): torre circular hueca + terreno
// alrededor. Generación directa, no procedural — alcanza para el primer test
// visual y de rendimiento.
export function generateInitialWorld(world: World): void {
  const GROUND_RADIUS = 26;
  const GROUND_Y = 0;

  // Terreno: disco de pasto sobre tierra sobre un par de capas de piedra.
  for (let x = -GROUND_RADIUS; x <= GROUND_RADIUS; x++) {
    for (let z = -GROUND_RADIUS; z <= GROUND_RADIUS; z++) {
      const dist = Math.sqrt(x * x + z * z);
      if (dist > GROUND_RADIUS) continue;
      world.setBlock(x, GROUND_Y, z, 3);     // grass
      world.setBlock(x, GROUND_Y - 1, z, 2); // dirt
      world.setBlock(x, GROUND_Y - 2, z, 1); // stone
      world.setBlock(x, GROUND_Y - 3, z, 1); // stone
    }
  }

  // Torre circular hueca de piedra.
  const TOWER_OUTER = 9;
  const TOWER_INNER = 7;
  const TOWER_HEIGHT = 22;
  for (let y = 1; y <= TOWER_HEIGHT; y++) {
    for (let x = -TOWER_OUTER; x <= TOWER_OUTER; x++) {
      for (let z = -TOWER_OUTER; z <= TOWER_OUTER; z++) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist > TOWER_OUTER || dist < TOWER_INNER) continue;
        world.setBlock(x, GROUND_Y + y, z, 1); // stone
      }
    }
  }

  // Anillo de madera como remate visual en la parte superior.
  const topY = GROUND_Y + TOWER_HEIGHT + 1;
  for (let x = -TOWER_OUTER; x <= TOWER_OUTER; x++) {
    for (let z = -TOWER_OUTER; z <= TOWER_OUTER; z++) {
      const dist = Math.sqrt(x * x + z * z);
      if (dist > TOWER_OUTER || dist < TOWER_INNER) continue;
      world.setBlock(x, topY, z, 4); // wood
    }
  }
}
