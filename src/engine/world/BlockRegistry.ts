// Definición de bloques. Los colores son un placeholder hasta que tengamos
// un atlas de texturas real (Dimensión 2 — Materiales, fase ASSETS del roadmap).
export interface BlockDef {
  id: number;
  name: string;
  solid: boolean;
  colorTop: [number, number, number];
  colorSide: [number, number, number];
  colorBottom: [number, number, number];
}

export const AIR_ID = 0;

const defs = new Map<number, BlockDef>();

function register(def: BlockDef): void {
  defs.set(def.id, def);
}

register({ id: AIR_ID, name: 'air', solid: false, colorTop: [0, 0, 0], colorSide: [0, 0, 0], colorBottom: [0, 0, 0] });
register({
  id: 1, name: 'stone', solid: true,
  colorTop: [0.53, 0.53, 0.55], colorSide: [0.50, 0.50, 0.52], colorBottom: [0.46, 0.46, 0.48],
});
register({
  id: 2, name: 'dirt', solid: true,
  colorTop: [0.40, 0.28, 0.18], colorSide: [0.38, 0.27, 0.17], colorBottom: [0.34, 0.24, 0.15],
});
register({
  id: 3, name: 'grass', solid: true,
  colorTop: [0.36, 0.56, 0.24], colorSide: [0.38, 0.27, 0.17], colorBottom: [0.34, 0.24, 0.15],
});
register({
  id: 4, name: 'wood', solid: true,
  colorTop: [0.42, 0.30, 0.18], colorSide: [0.36, 0.25, 0.15], colorBottom: [0.42, 0.30, 0.18],
});
register({
  id: 5, name: 'leaves', solid: true,
  colorTop: [0.24, 0.42, 0.20], colorSide: [0.22, 0.40, 0.19], colorBottom: [0.20, 0.36, 0.17],
});

export function getBlockDef(id: number): BlockDef {
  const def = defs.get(id);
  if (!def) throw new Error(`Bloque no registrado: ${id}`);
  return def;
}

export function isSolid(id: number): boolean {
  return id !== AIR_ID && (defs.get(id)?.solid ?? false);
}
