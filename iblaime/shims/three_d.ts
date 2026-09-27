// Shim SOLO para chequear localmente mi propio código sin acceso a red.
// Al instalar el paquete real ("three"), sus tipos reales reemplazan esto.
declare namespace THREE {
  class Anything {
    [key: string]: any;
    constructor(...args: any[]);
  }
  export class WebGLRenderer extends Anything {}
  export class PerspectiveCamera extends Anything {}
  export class Scene extends Anything {}
  export class DirectionalLight extends Anything {}
  export class HemisphereLight extends Anything {}
  export class Fog extends Anything {}
  export class Mesh extends Anything {}
  export class BufferGeometry extends Anything {}
  export class BufferAttribute extends Anything {}
  export class MeshLambertMaterial extends Anything {}
  export class MeshBasicMaterial extends Anything {}
  export class SphereGeometry extends Anything {}
  export class Color extends Anything {}
  export class Vector3 extends Anything {}
  export const SRGBColorSpace: any;
  export const ACESFilmicToneMapping: any;
  export const PCFSoftShadowMap: any;
  export const BackSide: any;
  export const DoubleSide: any;
}
declare module 'three' {
  export = THREE;
}
