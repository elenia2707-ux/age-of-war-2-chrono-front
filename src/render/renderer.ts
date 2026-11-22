import { getEra } from '../data/eras';
import type { GameSnapshot, UnitEntity } from '../data/types';
import type { BattleCamera } from '../game/camera';
import {
  ENEMY_BASE_X,
  GROUND_Y,
  PLAYER_BASE_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../game/constants';
import {
  getBackgroundCacheSize,
  renderBackground,
  renderForegroundParallax,
} from './backgroundRenderer';
import { renderBase } from './baseRenderer';
import {
  getUnitSpriteCacheSize,
  renderUnitEntity,
  resetUnitCacheFrameBudget,
} from './unitRenderer';
import {
  renderActiveUltimates,
  renderBeams,
  renderParticles,
  renderPopups,
  renderProjectiles,
  renderScorchMarks,
  renderSlashes,
  renderSupplyCrates,
  renderUltimateAtmosphere,
} from './vfxRenderer';

const MAX_DPR = 2;

export interface RendererPerfStats {
  dpr: number;
  canvasWidth: number;
  canvasHeight: number;
  cssWidth: number;
  cssHeight: number;
  drawTimeEmaMs: number;
  lowDetail: boolean;
  unitCacheSize: number;
  bgCacheSize: number;
}

function compareUnitsForDraw(a: UnitEntity, b: UnitEntity): number {
  if (a.state === 'dead' && b.state !== 'dead') return -1;
  if (a.state !== 'dead' && b.state === 'dead') return 1;
  return a.uid - b.uid;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cssWidth = 852;
  private cssHeight = 393;
  private currentDpr = 1;
  private frameCounter = 0;
  private drawTimeEmaMs = 6;
  private lowDetail = false;
  private sortedUnits: UnitEntity[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('2D Canvas context unavailable');
    }
    this.ctx = context;
  }

  public resize(width: number, height: number, camera: BattleCamera): void {
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    this.currentDpr = dpr;
    this.cssWidth = Math.max(1, Math.round(width));
    this.cssHeight = Math.max(1, Math.round(height));
    const targetW = Math.max(1, Math.round(this.cssWidth * dpr));
    const targetH = Math.max(1, Math.round(this.cssHeight * dpr));
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    camera.setViewport(this.cssWidth, this.cssHeight);
  }

  /**
   * Self-healing iOS Safari / Home-Screen PWA viewport guard:
   * verifies the canvas backing store matches its actual rendered CSS rect 1:1
   * (called on resize/orientation events and periodically so we avoid 60Hz layout reads!).
   */
  public syncCanvasSize(camera: BattleCamera): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w < 10 || h < 10) return;
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const expectedW = Math.round(w * dpr);
    const expectedH = Math.round(h * dpr);
    if (
      w !== this.cssWidth ||
      h !== this.cssHeight ||
      this.canvas.width !== expectedW ||
      this.canvas.height !== expectedH
    ) {
      this.resize(w, h, camera);
    }
  }

  public getCssSize(): { width: number; height: number } {
    return { width: this.cssWidth, height: this.cssHeight };
  }

  public getPerfStats(): RendererPerfStats {
    return {
      dpr: this.currentDpr,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      cssWidth: this.cssWidth,
      cssHeight: this.cssHeight,
      drawTimeEmaMs: Number(this.drawTimeEmaMs.toFixed(2)),
      lowDetail: this.lowDetail,
      unitCacheSize: getUnitSpriteCacheSize(),
      bgCacheSize: getBackgroundCacheSize(),
    };
  }

  public render(
    snapshot: GameSnapshot,
    camera: BattleCamera,
    wallTime: number,
    highlightSellMode: boolean,
  ): void {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    this.frameCounter++;

    // Sync canvas backing size on startup & every 30 frames (avoids per-frame layout thrash on iOS!)
    if (this.frameCounter <= 2 || this.frameCounter % 30 === 0) {
      this.syncCanvasSize(camera);
    }

    resetUnitCacheFrameBudget();

    const dpr = this.currentDpr || Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = this.cssHeight / WORLD_HEIGHT;
    const viewportW = this.cssWidth / Math.max(0.01, scale);
    const viewMinX = camera.x - 140;
    const viewMaxX = camera.x + viewportW + 140;

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.scale(scale, scale);

    // 1. Multi-layer Painterly Cartoon Parallax Background, Era Weather & Road
    renderBackground(
      ctx,
      snapshot.player.eraIndex,
      camera.x,
      viewportW,
      wallTime,
      snapshot.eraTransition,
      this.lowDetail,
    );

    // 2. Ultimate Sky Atmosphere & Chrono Fever Golden Edge Glint (zero gradient alloc!)
    renderUltimateAtmosphere(ctx, snapshot.ultimates, viewportW);
    if (snapshot.player.feverTimer > 0) {
      const fPulse = 0.72 + Math.sin(wallTime * 9) * 0.28;
      const fAlpha = Math.min(1, snapshot.player.feverTimer * 0.85) * fPulse;
      // Warm golden upper & lower atmospheric fever rim bands
      ctx.fillStyle = `rgba(250, 204, 21, ${(fAlpha * 0.14).toFixed(3)})`;
      ctx.fillRect(0, 0, viewportW, 64);
      ctx.fillStyle = `rgba(245, 158, 11, ${(fAlpha * 0.16).toFixed(3)})`;
      ctx.fillRect(0, WORLD_HEIGHT - 68, viewportW, 68);
      // Crisp horizontal golden chrono speed-streaks along top sky rim
      ctx.strokeStyle = `rgba(254, 240, 138, ${(fAlpha * 0.42).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const sx = ((wallTime * 540 + i * 260) % (viewportW + 180)) - 90;
        const sy = 14 + (i % 2) * 14;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 66, sy);
      }
      ctx.stroke();
    }

    // 3. World Space Entities (smooth steady camera — zero screen shake)
    ctx.save();
    ctx.translate(-camera.x, 0);

    // Persistent crater scorch marks on the road
    renderScorchMarks(ctx, snapshot.scorchMarks, viewMinX, viewMaxX);

    // Monumental Cartoon Fortresses & Rotating Turrets (culled when off-screen!)
    if (PLAYER_BASE_X + 240 >= camera.x && PLAYER_BASE_X - 240 <= camera.x + viewportW) {
      renderBase(ctx, snapshot.player, wallTime, highlightSellMode);
    }
    if (ENEMY_BASE_X + 240 >= camera.x && ENEMY_BASE_X - 240 <= camera.x + viewportW) {
      renderBase(ctx, snapshot.enemy, wallTime, false);
    }

    // Midfield Parachuting Chrono Supply Crates!
    renderSupplyCrates(ctx, snapshot.supplyCrates, wallTime);

    // Units (reusable sort buffer — zero array allocation per frame!)
    const sorted = this.sortedUnits;
    sorted.length = snapshot.units.length;
    for (let i = 0; i < snapshot.units.length; i++) {
      sorted[i] = snapshot.units[i];
    }
    sorted.sort(compareUnitsForDraw);

    const playerFever = snapshot.player.feverTimer > 0;
    const enemyFever = snapshot.enemy.feverTimer > 0;
    for (let i = 0; i < sorted.length; i++) {
      const unit = sorted[i];
      if (unit.x + 160 < camera.x || unit.x - 160 > camera.x + viewportW) continue;
      renderUnitEntity(ctx, unit, unit.team === 'player' ? playerFever : enemyFever, wallTime);
    }

    // Combat VFX: Slashes, Active Ultimates, Projectiles, Beams, Particles, Popups
    renderSlashes(ctx, snapshot.slashes, viewMinX, viewMaxX);
    renderActiveUltimates(ctx, snapshot.ultimates);
    renderProjectiles(ctx, snapshot.projectiles, viewMinX, viewMaxX);
    renderBeams(ctx, snapshot.beams, viewMinX, viewMaxX);
    renderParticles(ctx, snapshot.particles, viewMinX, viewMaxX);
    renderPopups(ctx, snapshot.popups, viewMinX, viewMaxX);

    ctx.restore();

    // 4. Foreground Cartoon Props along bottom ground lip
    renderForegroundParallax(ctx, snapshot.player.eraIndex, camera.x, viewportW, wallTime, this.lowDetail);

    // 5. Victory / Defeat Atmospheric Canvas Celebration Overlay (behind modal)
    if (snapshot.status === 'victory') {
      renderVictoryAtmosphere(ctx, viewportW, wallTime);
    } else if (snapshot.status === 'defeat') {
      renderDefeatAtmosphere(ctx, viewportW, wallTime);
    }

    ctx.restore();

    // Adaptive thermal/FPS governor: softly trims non-essential weather/stars during extreme 2x spikes
    if (t0 > 0) {
      const drawMs = performance.now() - t0;
      this.drawTimeEmaMs = this.drawTimeEmaMs * 0.9 + drawMs * 0.1;
      if (!this.lowDetail && this.frameCounter > 20 && this.drawTimeEmaMs > 18) {
        this.lowDetail = true;
      } else if (this.lowDetail && this.drawTimeEmaMs < 11) {
        this.lowDetail = false;
      }
    }
  }
}

function renderVictoryAtmosphere(ctx: CanvasRenderingContext2D, viewportW: number, wallTime: number): void {
  ctx.save();
  // Soft warm golden radiance across upper sky
  ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
  ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT * 0.55);

  // Celebratory rising golden sparkles & drifting festive ribbons
  const count = 22;
  for (let i = 0; i < count; i++) {
    const x = ((i * 113 + Math.sin(wallTime * 1.4 + i) * 28) % viewportW + viewportW) % viewportW;
    const progress = (wallTime * (0.14 + (i % 4) * 0.035) + i * 0.17) % 1;
    const y = WORLD_HEIGHT - progress * (WORLD_HEIGHT + 30);
    const alpha = Math.sin(progress * Math.PI) * 0.82;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 3 === 0 ? '#fef08a' : i % 3 === 1 ? '#38bdf8' : '#f59e0b';
    const r = 2.4 + (i % 3) * 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.5);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r * 1.5);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function renderDefeatAtmosphere(ctx: CanvasRenderingContext2D, viewportW: number, wallTime: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(127, 29, 29, 0.14)';
  ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);

  // Slowly rising warm embers drifting across the darkened battlefield
  for (let i = 0; i < 16; i++) {
    const x = ((i * 139 + wallTime * 18 + Math.sin(wallTime * 1.8 + i) * 18) % viewportW + viewportW) % viewportW;
    const progress = (wallTime * (0.12 + (i % 3) * 0.03) + i * 0.19) % 1;
    const y = WORLD_HEIGHT - progress * WORLD_HEIGHT;
    ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.65;
    ctx.fillStyle = i % 2 === 0 ? '#fb923c' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, 1.8 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================================
// MINIMAP RENDERER WITH CACHED CONTEXT & PER-ERA STATIC BACKDROP
// ============================================================================
const minimapCtxCache = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
const minimapBackdropCache = new Map<string, HTMLCanvasElement>();

function getMinimapBackdrop(eraIndex: number, w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const key = `${eraIndex}:${w}x${h}`;
  const existing = minimapBackdropCache.get(key);
  if (existing) return existing;
  if (minimapBackdropCache.size >= 16) {
    const firstKey = minimapBackdropCache.keys().next().value;
    if (firstKey !== undefined) minimapBackdropCache.delete(firstKey);
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const bctx = c.getContext('2d');
  if (!bctx) return null;
  const era = getEra(eraIndex);
  const groundLine = h * 0.72;
  const skyGrad = bctx.createLinearGradient(0, 0, 0, groundLine);
  skyGrad.addColorStop(0, era.palette.skyTop);
  skyGrad.addColorStop(1, era.palette.skyBottom);
  bctx.fillStyle = skyGrad;
  bctx.fillRect(0, 0, w, groundLine);
  bctx.fillStyle = era.palette.groundMid;
  bctx.fillRect(0, groundLine, w, h - groundLine);
  minimapBackdropCache.set(key, c);
  return c;
}

export function renderMinimap(
  canvas: HTMLCanvasElement,
  snapshot: GameSnapshot,
  camera: BattleCamera,
): void {
  let ctx = minimapCtxCache.get(canvas);
  if (!ctx) {
    const nextCtx = canvas.getContext('2d');
    if (!nextCtx) return;
    minimapCtxCache.set(canvas, nextCtx);
    ctx = nextCtx;
  }

  const w = canvas.width;
  const h = canvas.height;
  const groundLine = h * 0.72;

  const backdrop = getMinimapBackdrop(snapshot.player.eraIndex, w, h);
  if (backdrop) {
    ctx.drawImage(backdrop, 0, 0);
  } else {
    const era = getEra(snapshot.player.eraIndex);
    ctx.fillStyle = era.palette.skyBottom;
    ctx.fillRect(0, 0, w, groundLine);
    ctx.fillStyle = era.palette.groundMid;
    ctx.fillRect(0, groundLine, w, h - groundLine);
  }

  const invWorldW = w / WORLD_WIDTH;
  const pX = PLAYER_BASE_X * invWorldW;
  const eX = ENEMY_BASE_X * invWorldW;

  // Player & Enemy Fortress blocks
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(Math.max(2, pX - 5), groundLine - 11, 10, 11);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(Math.min(w - 12, eX - 5), groundLine - 11, 10, 11);

  // Live Units as clean team dots
  for (let i = 0; i < snapshot.units.length; i++) {
    const u = snapshot.units[i];
    if (u.state === 'dead') continue;
    const ux = u.x * invWorldW;
    ctx.fillStyle = u.team === 'player' ? '#60a5fa' : '#f87171';
    const r = u.def.role === 'heavy' || u.def.role === 'siege' ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.arc(ux, groundLine - r - 1, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Active Chrono Supply Crate golden diamond markers
  for (let i = 0; i < snapshot.supplyCrates.length; i++) {
    const crate = snapshot.supplyCrates[i];
    const cx = crate.x * invWorldW;
    const cy = Math.min(groundLine - 3, (crate.y / GROUND_Y) * groundLine);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx + 3.5, cy);
    ctx.lineTo(cx, cy + 4);
    ctx.lineTo(cx - 3.5, cy);
    ctx.closePath();
    ctx.fill();
  }

  // Active Ultimate markers
  for (let i = 0; i < snapshot.ultimates.length; i++) {
    const ult = snapshot.ultimates[i];
    ctx.fillStyle = ult.def.accentColor;
    for (let j = 0; j < ult.fallingOrdinance.length; j++) {
      const ord = ult.fallingOrdinance[j];
      if (ord.impacted) continue;
      ctx.beginPath();
      ctx.arc(ord.x * invWorldW, (ord.y / GROUND_Y) * groundLine, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Camera Viewport Frame
  const viewX = camera.x * invWorldW;
  const viewW = Math.max(16, camera.getViewportWorldWidth() * invWorldW);
  ctx.strokeStyle = snapshot.player.feverTimer > 0 ? '#fef08a' : '#facc15';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(viewX + 1, 1, Math.min(w - viewX - 2, viewW - 2), h - 2, 3);
  ctx.stroke();
}
