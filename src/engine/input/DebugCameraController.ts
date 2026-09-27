import * as THREE from 'three';

// PLACEHOLDER: reemplaza temporalmente al sistema de Player real (sección 13
// del brief: posición, gravedad, salto, colisiones). Es solo una cámara libre
// para poder evaluar visualmente el mundo inicial mientras se construye el
// resto. Se descarta cuando implementemos Player + Physics.
export class DebugCameraController {
  private yaw = -Math.PI / 4;
  private pitch = -0.25;
  private moveState = { forward: false, back: false, left: false, right: false, up: false, down: false };
  private speed = 12; // unidades/segundo

  constructor(private camera: THREE.PerspectiveCamera, private domElement: HTMLElement) {
    this.setupDesktop();
    if ('ontouchstart' in window) this.setupTouch();
    this.updateCameraRotation();
  }

  private setupDesktop(): void {
    this.domElement.addEventListener('click', () => this.domElement.requestPointerLock());
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (document.pointerLockElement !== this.domElement) return;
      this.yaw -= e.movementX * 0.0025;
      this.pitch -= e.movementY * 0.0025;
      this.clampPitch();
      this.updateCameraRotation();
    });
    window.addEventListener('keydown', (e: KeyboardEvent) => this.setKey(e.code, true));
    window.addEventListener('keyup', (e: KeyboardEvent) => this.setKey(e.code, false));
  }

  private setKey(code: string, down: boolean): void {
    switch (code) {
      case 'KeyW': this.moveState.forward = down; break;
      case 'KeyS': this.moveState.back = down; break;
      case 'KeyA': this.moveState.left = down; break;
      case 'KeyD': this.moveState.right = down; break;
      case 'Space': this.moveState.up = down; break;
      case 'ShiftLeft': this.moveState.down = down; break;
    }
  }

  private setupTouch(): void {
    // Look: arrastrar con un dedo en cualquier parte del canvas.
    let lastX = 0, lastY = 0, dragging = false;
    this.domElement.addEventListener('touchstart', (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      lastX = t.clientX; lastY = t.clientY; dragging = true;
    }, { passive: true });
    this.domElement.addEventListener('touchmove', (e: TouchEvent) => {
      if (!dragging) return;
      const t = e.changedTouches[0];
      if (!t) return;
      this.yaw -= (t.clientX - lastX) * 0.004;
      this.pitch -= (t.clientY - lastY) * 0.004;
      this.clampPitch();
      this.updateCameraRotation();
      lastX = t.clientX; lastY = t.clientY;
      e.preventDefault();
    }, { passive: false });
    this.domElement.addEventListener('touchend', () => { dragging = false; }, { passive: true });

    // Movimiento: 4 botones simples superpuestos (placeholder de UI).
    const pad = document.createElement('div');
    Object.assign(pad.style, {
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 48px)',
      gridTemplateRows: 'repeat(2, 48px)',
      gap: '6px',
      zIndex: '1000',
    });
    document.body.appendChild(pad);

    const makeBtn = (label: string, onDown: () => void, onUp: () => void, col: number, row: number) => {
      const b = document.createElement('div');
      b.textContent = label;
      Object.assign(b.style, {
        gridColumn: String(col),
        gridRow: String(row),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.15)',
        color: '#fff',
        borderRadius: '8px',
        font: '18px sans-serif',
        userSelect: 'none',
      });
      b.addEventListener('touchstart', (e: TouchEvent) => { onDown(); e.preventDefault(); }, { passive: false });
      b.addEventListener('touchend', (e: TouchEvent) => { onUp(); e.preventDefault(); }, { passive: false });
      pad.appendChild(b);
    };
    makeBtn('↑', () => { this.moveState.forward = true; }, () => { this.moveState.forward = false; }, 2, 1);
    makeBtn('←', () => { this.moveState.left = true; }, () => { this.moveState.left = false; }, 1, 2);
    makeBtn('↓', () => { this.moveState.back = true; }, () => { this.moveState.back = false; }, 2, 2);
    makeBtn('→', () => { this.moveState.right = true; }, () => { this.moveState.right = false; }, 3, 2);
  }

  private clampPitch(): void {
    const limit = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
  }

  private updateCameraRotation(): void {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  update(dt: number): void {
    const up = new THREE.Vector3(0, 1, 0);
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const move = new THREE.Vector3();
    if (this.moveState.forward) move.add(forward);
    if (this.moveState.back) move.sub(forward);
    if (this.moveState.right) move.add(right);
    if (this.moveState.left) move.sub(right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(this.speed * dt);
    if (this.moveState.up) move.y += this.speed * dt;
    if (this.moveState.down) move.y -= this.speed * dt;
    this.camera.position.add(move);
  }
}
