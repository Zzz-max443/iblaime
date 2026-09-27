import * as THREE from 'three';

export class Profiler {
  private el: HTMLDivElement;
  private frames = 0;
  private accMs = 0;
  private lastUpdate = 0;

  constructor(private renderer: THREE.WebGLRenderer, private extra: () => Record<string, number>) {
    this.el = document.createElement('div');
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '8px',
      left: '8px',
      padding: '6px 8px',
      background: 'rgba(0,0,0,0.55)',
      color: '#9df59d',
      font: '12px monospace',
      whiteSpace: 'pre',
      pointerEvents: 'none',
      zIndex: '1000',
      borderRadius: '4px',
    });
    document.body.appendChild(this.el);
  }

  // Llamar una vez por frame, después de renderer.render(...).
  tick(dtMs: number, nowMs: number): void {
    this.frames++;
    this.accMs += dtMs;
    if (nowMs - this.lastUpdate < 250) return;
    this.lastUpdate = nowMs;

    const fps = this.frames / (this.accMs / 1000);
    const info = this.renderer.info;
    const extra = this.extra();
    const extraLines = Object.entries(extra).map(([k, v]) => `${k}: ${v}`).join('\n');

    this.el.textContent =
      `FPS: ${fps.toFixed(0)}  (${(this.accMs / this.frames).toFixed(1)} ms/frame)\n` +
      `draw calls: ${info.render.calls}\n` +
      `triángulos: ${info.render.triangles}\n` +
      `${extraLines}\n` +
      `[NOT VERIFIED en Android — medir en dispositivo real]`;

    this.frames = 0;
    this.accMs = 0;
  }
}
