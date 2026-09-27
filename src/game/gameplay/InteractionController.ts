import * as THREE from 'three';
import { World } from '../../engine/world/World';
import { raycastVoxel } from '../../engine/interaction/Raycast';

const REACH = 6;
const PLACE_BLOCK_ID = 1; // stone — TODO(UI): hotbar real con selección de bloque (fase UI del roadmap)

// Vive en Game/Gameplay, no en Engine/Interaction: el raycast es una
// capacidad genérica del motor, pero "romper deja aire" y "poner es stone"
// son reglas de este juego en particular (sección 5 del brief).
export class InteractionController {
  constructor(
    private world: World,
    private camera: THREE.PerspectiveCamera,
    private domElement: HTMLElement,
    private onWorldChanged: () => void,
  ) {
    this.domElement.addEventListener('mousedown', (e: MouseEvent) => {
      // Sin este chequeo, el mismo click que pide pointer lock (ver
      // PlayerController) también rompería el bloque bajo el cursor.
      if (document.pointerLockElement !== this.domElement) return;
      if (e.button === 0) this.breakBlock();
      else if (e.button === 2) this.placeBlock();
    });
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    if ('ontouchstart' in window) this.setupTouchButtons();
  }

  private castFromCamera() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const p = this.camera.position;
    return raycastVoxel(this.world, p.x, p.y, p.z, dir.x, dir.y, dir.z, REACH);
  }

  private breakBlock(): void {
    const hit = this.castFromCamera();
    if (!hit) return;
    this.world.setBlock(hit.x, hit.y, hit.z, 0);
    this.onWorldChanged();
  }

  private placeBlock(): void {
    const hit = this.castFromCamera();
    if (!hit) return;
    this.world.setBlock(hit.px, hit.py, hit.pz, PLACE_BLOCK_ID);
    this.onWorldChanged();
  }

  // TODO(UI): botones placeholder iguales en espíritu a los de
  // PlayerController — se reemplazan juntos cuando exista la UI real.
  private setupTouchButtons(): void {
    const makeBtn = (label: string, right: string, onTap: () => void) => {
      const b = document.createElement('div');
      b.textContent = label;
      Object.assign(b.style, {
        position: 'fixed', bottom: '100px', right,
        width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: '28px',
        font: '20px sans-serif', userSelect: 'none', zIndex: '1000',
      });
      b.addEventListener('touchstart', (e: TouchEvent) => { onTap(); e.preventDefault(); }, { passive: false });
      document.body.appendChild(b);
    };
    makeBtn('⛏', '90px', () => this.breakBlock());
    makeBtn('▦', '24px', () => this.placeBlock());
  }
}
