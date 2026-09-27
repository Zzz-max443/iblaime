import * as THREE from 'three';

// Skydome barato: una esfera grande, cara interior, con gradiente horneado en
// los vértices. Rota junto con la cámara (más correcto que un fondo 2D fijo)
// y es casi gratis en GPU: nada de shader por pixel de pantalla completa.
export function createSkydome(): THREE.Mesh {
  const radius = 800;
  const geometry = new THREE.SphereGeometry(radius, 24, 16);
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const zenith = new THREE.Color('#3f7fc9');
  const horizon = new THREE.Color('#cfe6f5');

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / radius; // -1 (abajo) .. 1 (arriba)
    const t = Math.pow(Math.max(0, y), 0.55); // curva: horizonte más ancho que el cenit
    const c = horizon.clone().lerp(zenith, t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1000;
  return mesh;
}

export const FOG_COLOR = 0xcfe6f5; // coincide con el horizonte del skydome
