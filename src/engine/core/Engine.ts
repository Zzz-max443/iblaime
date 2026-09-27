export type FrameCallback = () => void;

export class Engine {
  private running = false;
  private rafId = 0;

  constructor(private onFrame: FrameCallback) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
      else this.resume();
    });
  }

  private loop = (): void => {
    if (!this.running) return;
    this.onFrame();
    this.rafId = requestAnimationFrame(this.loop);
  };

  resume(): void {
    if (this.running) return;
    this.running = true;
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}
