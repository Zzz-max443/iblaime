import { Player } from './Player';

// Desacopla "cómo se captura el input" de "qué hace el Player con él" — el
// mismo patrón que DebugCameraController pero alimentando Player.update en
// vez de mover la cámara directamente (sección 15: eventualmente esto podría
// convivir con el Script Executor emulando input vía Intent/IntentResolver,
// por eso conviene que quede aislado en un solo lugar).
export class PlayerController {
  private moveState = { forward: false, back: false, left: false, right: false };
  private jumpQueued = false;

  constructor(private player: Player, private domElement: HTMLElement) {
    this.setupDesktop();
    if ('ontouchstart' in window) this.setupTouch();
  }

  private setupDesktop(): void {
    this.domElement.addEventListener('click', () => this.domElement.requestPointerLock());
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (document.pointerLockElement !== this.domElement) return;
      this.player.yaw -= e.movementX * 0.0025;
      this.player.pitch -= e.movementY * 0.0025;
      this.clampPitch();
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
      case 'Space': if (down) this.jumpQueued = true; break;
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
      this.player.yaw -= (t.clientX - lastX) * 0.004;
      this.player.pitch -= (t.clientY - lastY) * 0.004;
      this.clampPitch();
      lastX = t.clientX; lastY = t.clientY;
      e.preventDefault();
    }, { passive: false });
    this.domElement.addEventListener('touchend', () => { dragging = false; }, { passive: true });

    // TODO(UI): esto es un placeholder de UI (fase UI del roadmap, sección 14
    // Android). El joystick/hotbar reales van a reemplazar estos 4 divs.
    const pad = document.createElement('div');
    Object.assign(pad.style, {
      position: 'fixed', bottom: '24px', left: '24px',
      display: 'grid', gridTemplateColumns: 'repeat(3, 48px)', gridTemplateRows: 'repeat(2, 48px)',
      gap: '6px', zIndex: '1000',
    });
    document.body.appendChild(pad);

    const makeBtn = (label: string, onDown: () => void, onUp: () => void, col: number, row: number) => {
      const b = document.createElement('div');
      b.textContent = label;
      Object.assign(b.style, {
        gridColumn: String(col), gridRow: String(row), display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: '#fff',
        borderRadius: '8px', font: '18px sans-serif', userSelect: 'none',
      });
      b.addEventListener('touchstart', (e: TouchEvent) => { onDown(); e.preventDefault(); }, { passive: false });
      b.addEventListener('touchend', (e: TouchEvent) => { onUp(); e.preventDefault(); }, { passive: false });
      pad.appendChild(b);
    };
    makeBtn('↑', () => { this.moveState.forward = true; }, () => { this.moveState.forward = false; }, 2, 1);
    makeBtn('←', () => { this.moveState.left = true; }, () => { this.moveState.left = false; }, 1, 2);
    makeBtn('↓', () => { this.moveState.back = true; }, () => { this.moveState.back = false; }, 2, 2);
    makeBtn('→', () => { this.moveState.right = true; }, () => { this.moveState.right = false; }, 3, 2);

    const jumpBtn = document.createElement('div');
    jumpBtn.textContent = '⤒';
    Object.assign(jumpBtn.style, {
      position: 'fixed', bottom: '24px', right: '24px', width: '64px', height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: '32px',
      font: '22px sans-serif', userSelect: 'none', zIndex: '1000',
    });
    jumpBtn.addEventListener('touchstart', (e: TouchEvent) => { this.jumpQueued = true; e.preventDefault(); }, { passive: false });
    document.body.appendChild(jumpBtn);
  }

  private clampPitch(): void {
    const limit = Math.PI / 2 - 0.05;
    this.player.pitch = Math.max(-limit, Math.min(limit, this.player.pitch));
  }

  // Llamar una vez por frame, antes de Player.update(). El salto es
  // edge-triggered: se consume acá y no vuelve a dispararse hasta la próxima
  // pulsación, aunque la tecla siga apretada.
  consumeInput(): { moveX: number; moveZ: number; jump: boolean } {
    let moveX = 0, moveZ = 0;
    if (this.moveState.forward) moveZ += 1;
    if (this.moveState.back) moveZ -= 1;
    if (this.moveState.right) moveX += 1;
    if (this.moveState.left) moveX -= 1;
    const jump = this.jumpQueued;
    this.jumpQueued = false;
    return { moveX, moveZ, jump };
  }
}
