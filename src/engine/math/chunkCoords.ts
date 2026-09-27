// Utilidades de conversión entre coordenadas de mundo y coordenadas de chunk/local.
// Correctness-first: usamos floor-div genuino para que funcione con negativos.

export function worldToChunk(coord: number, chunkSize: number): number {
  return Math.floor(coord / chunkSize);
}

export function worldToLocal(coord: number, chunkSize: number): number {
  const m = coord % chunkSize;
  return m < 0 ? m + chunkSize : m;
}

export function chunkKey(cx: number, cy: number, cz: number): string {
  // String key por simplicidad y corrección primero.
  // TODO(perf): reemplazar por un empaquetado entero (bit-packing con bias)
  // si el profiler muestra que el hashing de Map<string,...> es un cuello de botella.
  return `${cx}_${cy}_${cz}`;
}
