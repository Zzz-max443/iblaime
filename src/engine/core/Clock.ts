export class Clock {
  private last = performance.now();

  // Delta en segundos, clampeado para evitar saltos gigantes al volver de
  // background (importante en Android: la app se pausa y el próximo frame
  // trae un dt enorme si no lo limitamos).
  tick(): number {
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    return dt;
  }
}
