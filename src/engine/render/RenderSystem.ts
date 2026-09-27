import * as THREE from 'three';
import { createSkydome, FOG_COLOR } from './Skydome';

export interface QualitySettings {
  shadows: boolean;
  shadowMapSize: number;
  pixelRatioCap: number;
}

export const DEFAULT_QUALITY: QualitySettings = {
  shadows: true,
  shadowMapSize: 1024,
  pixelRatioCap: 1.5, // NOT VERIFIED en Android: ajustar según el Profiler
};

export class RenderSystem {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly sun: THREE.DirectionalLight;

  constructor(canvas: HTMLCanvasElement, quality: QualitySettings = DEFAULT_QUALITY) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatioCap));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = quality.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);
    this.camera.position.set(0, 20, 40);

    // Niebla: oculta el borde del mundo cargado y suma profundidad (Dimensión 6).
    this.scene.fog = new THREE.Fog(FOG_COLOR, 60, 260);
    this.scene.add(createSkydome());

    const hemi = new THREE.HemisphereLight(0xbfd9ea, 0x4a3d2c, 0.9); // cielo / rebote del suelo
    this.scene.add(hemi);

    this.sun = new THREE.DirectionalLight(0xfff3d6, 1.6);
    this.sun.position.set(60, 90, 40);
    this.sun.castShadow = quality.shadows;
    if (quality.shadows) {
      this.sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
      const d = 70;
      this.sun.shadow.camera.left = -d;
      this.sun.shadow.camera.right = d;
      this.sun.shadow.camera.top = d;
      this.sun.shadow.camera.bottom = -d;
      this.sun.shadow.camera.near = 1;
      this.sun.shadow.camera.far = 220;
      this.sun.shadow.bias = -0.0015;
    }
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
