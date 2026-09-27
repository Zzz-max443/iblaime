import { Engine } from './engine/core/Engine';
import { Clock } from './engine/core/Clock';
import { RenderSystem } from './engine/render/RenderSystem';
import { World } from './engine/world/World';
import { ChunkMeshManager } from './engine/render/ChunkMeshManager';
import { Profiler } from './engine/profiling/Profiler';
import { createCrosshair } from './engine/ui/Crosshair';
import { generateInitialWorld } from './game/world/generateInitialWorld';
import { Player } from './game/player/Player';
import { PlayerController } from './game/player/PlayerController';
import { InteractionController } from './game/gameplay/InteractionController';

// Nota: DebugCameraController (engine/input/) queda en el árbol pero sin usar
// acá — tal como decía su propio comentario, se "descarta cuando implementemos
// Player + Physics". Se conserva para un futuro modo espectador/debug real
// (ver DECISIONS.md), no para el loop principal.

const canvas = document.getElementById('app') as HTMLCanvasElement;

const render = new RenderSystem(canvas);
const world = new World();
generateInitialWorld(world);

const meshManager = new ChunkMeshManager(world, render.scene);
meshManager.update(); // primer mallado completo antes del primer frame

// Spawn en el centro del hueco de la torre (sección 12: dist < TOWER_INNER es
// aire), parado sobre el pasto (bloque en y=0 ocupa [0,1), así que los pies
// del jugador arrancan en y=1).
const player = new Player(0, 1, 0);
const playerController = new PlayerController(player, canvas);
new InteractionController(world, render.camera, canvas, () => meshManager.update());
createCrosshair();

const profiler = new Profiler(render.renderer, () => ({
  'chunks (mesh)': meshManager.meshCount,
}));

const clock = new Clock();
const engine = new Engine(() => {
  const dt = clock.tick();
  const input = playerController.consumeInput();
  player.update(world, dt, input.moveX, input.moveZ, input.jump);
  player.syncCamera(render.camera);
  meshManager.update(); // no-op salvo que romper/poner haya ensuciado algún chunk
  render.render();
  profiler.tick(dt * 1000, performance.now());
});
engine.resume();
