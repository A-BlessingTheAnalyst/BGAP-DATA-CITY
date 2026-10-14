export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private currentFps = 60;

  tick(): number {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }
    return this.currentFps;
  }

  getFps(): number {
    return this.currentFps;
  }
}
