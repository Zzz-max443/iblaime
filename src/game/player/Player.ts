import * as THREE from 'three';
import { World } from '../../engine/world/World';
import { makeBox, moveAndCollide, Box } from '../../engine/physics/VoxelPhysics';

const HALF_WIDTH = 0.3;
const HEIGHT = 1.8;
const EYE_HEIGHT = 1.62;
const GRAVITY = -28; // unidades/s^2 — no es 9.8 real, elegido para que el salto "se sienta bien" (sección 13)
const JUMP_SPEED = 9;
const WALK_SPEED = 5.2;
const AIR_ACCEL = 4; // qué tan rápido el control aéreo cambia la velocidad horizontal
const MAX_AIR_SPEED = WALK_SPEED * 1.1;

// Player NO conoce el renderer más que para escribir en una cámara al final
// (syncCamera). La física y el estado viven acá, no en el input ni en THREE.
export class Player {
  x: number;
  y: number; // pies, no ojos
  z: number;
  velX = 0;
  velY = 0;
  velZ = 0;
  yaw = -Math.PI / 4;
  pitch = -0.15;
  grounded = false;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  private box(): Box {
    return makeBox(this.x, this.y, this.z, HALF_WIDTH, HEIGHT);
  }

  // moveX/moveZ: input normalizado en espacio local del jugador (strafe,
  // adelante/atrás), típicamente -1..1. jumpPressed: edge-triggered (una vez
  // por pulsación, no hold-to-repeat) — ver PlayerController.consumeInput.
  update(world: World, dt: number, moveX: number, moveZ: number, jumpPressed: boolean): void {
    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
    // Misma convención que el DebugCameraController: forward = -Z rotado por yaw.
    const forward = { x: -sinY, z: -cosY };
    const right = { x: cosY, z: -sinY };

    let wishX = forward.x * moveZ + right.x * moveX;
    let wishZ = forward.z * moveZ + right.z * moveX;
    const wishLen = Math.hypot(wishX, wishZ);
    if (wishLen > 0) {
      wishX /= wishLen;
      wishZ /= wishLen;
    }

    if (this.grounded) {
      this.velX = wishX * WALK_SPEED;
      this.velZ = wishZ * WALK_SPEED;
      if (jumpPressed) this.velY = JUMP_SPEED;
    } else {
      // Control aéreo reducido: empuja la velocidad en vez de fijarla
      // (sección 13: "no necesita ser realista, necesita sentirse correcta").
      this.velX += wishX * WALK_SPEED * AIR_ACCEL * dt;
      this.velZ += wishZ * WALK_SPEED * AIR_ACCEL * dt;
      const horiz = Math.hypot(this.velX, this.velZ);
      if (horiz > MAX_AIR_SPEED) {
        this.velX = (this.velX / horiz) * MAX_AIR_SPEED;
        this.velZ = (this.velZ / horiz) * MAX_AIR_SPEED;
      }
    }

    this.velY += GRAVITY * dt;

    const result = moveAndCollide(world, this.box(), this.velX, this.velY, this.velZ, dt);
    this.x = (result.box.minX + result.box.maxX) / 2;
    this.z = (result.box.minZ + result.box.maxZ) / 2;
    this.y = result.box.minY;
    this.velX = result.velX;
    this.velY = result.velY;
    this.velZ = result.velZ;
    this.grounded = result.grounded;
  }

  syncCamera(camera: THREE.PerspectiveCamera): void {
    camera.position.set(this.x, this.y + EYE_HEIGHT, this.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = this.yaw;
    camera.rotation.x = this.pitch;
  }
}
