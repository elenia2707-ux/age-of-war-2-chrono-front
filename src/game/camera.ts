import { WORLD_HEIGHT, WORLD_WIDTH } from './constants';

export class BattleCamera {
  /** Left edge of the visible world viewport in logical world coordinates */
  public x = 0;
  public velocity = 0;
  public readonly shakeX = 0;
  public readonly shakeY = 0;

  private viewportWorldWidth = 800;
  private isDragging = false;

  public setViewport(canvasCssWidth: number, canvasCssHeight: number): void {
    const safeH = Math.max(1, canvasCssHeight);
    const scale = safeH / WORLD_HEIGHT;
    this.viewportWorldWidth = Math.min(WORLD_WIDTH, canvasCssWidth / Math.max(0.01, scale));
    this.clamp();
  }

  public getViewportWorldWidth(): number {
    return this.viewportWorldWidth;
  }

  public getMaxX(): number {
    return Math.max(0, WORLD_WIDTH - this.viewportWorldWidth);
  }

  public reset(): void {
    this.x = 0;
    this.velocity = 0;
    this.isDragging = false;
  }

  public beginDrag(): void {
    this.isDragging = true;
    this.velocity = 0;
  }

  public dragByScreenDelta(dxScreen: number, canvasCssHeight: number): void {
    const scale = Math.max(0.01, canvasCssHeight / WORLD_HEIGHT);
    const dxWorld = -dxScreen / scale;
    this.x += dxWorld;
    this.velocity = dxWorld * 45;
    this.clamp();
  }

  public endDrag(): void {
    this.isDragging = false;
  }

  public panByWorld(dxWorld: number): void {
    this.x += dxWorld;
    this.clamp();
  }

  public jumpToWorldX(worldX: number): void {
    this.velocity = 0;
    this.x = worldX - this.viewportWorldWidth * 0.5;
    this.clamp();
  }

  /** Screen shake intentionally disabled per user preference */
  public addShake(_amount: number): void {
    // No-op: camera remains steady during all attacks and ultimates
  }

  public update(dt: number): void {
    if (!this.isDragging && Math.abs(this.velocity) > 0.5) {
      this.x += this.velocity * dt;
      const decay = Math.exp(-8 * dt);
      this.velocity *= decay;
      if (Math.abs(this.velocity) < 1) {
        this.velocity = 0;
      }
      this.clamp();
    }
  }

  public clamp(): void {
    const maxX = this.getMaxX();
    if (this.x < 0) {
      this.x = 0;
      if (this.velocity < 0) this.velocity = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
      if (this.velocity > 0) this.velocity = 0;
    }
  }
}
