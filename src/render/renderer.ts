import { getEra } from '../data/eras';
import type { GameSnapshot } from '../data/types';
import type { BattleCamera } from '../game/camera';
import {
  ENEMY_BASE_X,
  GROUND_Y,
  PLAYER_BASE_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../game/constants';
import { renderBackground, renderForegroundParallax } from './backgroundRenderer';
import { renderBase } from './baseRenderer';
import { renderUnitEntity } from './unitRenderer';
import {
  renderActiveUltimates,
  renderBeams,
  renderParticles,
  renderPopups,
  renderProjectiles,
  renderScorchMarks,
  renderSlashes,
  renderUltimateAtmosphere,
} from './vfxRenderer';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cssWidth = 852;
  private cssHeight = 393;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('2D Canvas context unavailable');
    }
    this.ctx = context;
  }

  public resize(width: number, height: number, camera: BattleCamera): void {
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.cssWidth = Math.max(1, Math.floor(width));
    this.cssHeight = Math.max(1, Math.floor(height));
    this.canvas.width = Math.floor(this.cssWidth * dpr);
    this.canvas.height = Math.floor(this.cssHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    camera.setViewport(this.cssWidth, this.cssHeight);
  }

  public getCssSize(): { width: number; height: number } {
    return { width: this.cssWidth, height: this.cssHeight };
  }

  public render(
    snapshot: GameSnapshot,
    camera: BattleCamera,
    wallTime: number,
    highlightSellMode: boolean,
  ): void {
    const ctx = this.ctx;
    const scale = this.cssHeight / WORLD_HEIGHT;
    const viewportW = this.cssWidth / Math.max(0.01, scale);

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(camera.shakeX, camera.shakeY);

    // 1. Parallax Background & Textured Battlefield Floor
    renderBackground(
      ctx,
      snapshot.player.eraIndex,
      camera.x,
      viewportW,
      wallTime,
      snapshot.eraTransition,
    );

    // 2. Ultimate Sky Atmosphere
    renderUltimateAtmosphere(ctx, snapshot.ultimates, viewportW);

    // 3. World Space Entities
    ctx.save();
    ctx.translate(-camera.x, 0);

    // Persistent ground blast craters / scorch marks on the road
    renderScorchMarks(ctx, snapshot.scorchMarks);

    // Monumental Fortresses & Turrets (each displays its own era independently)
    renderBase(ctx, snapshot.player, wallTime, highlightSellMode);
    renderBase(ctx, snapshot.enemy, wallTime, false);

    // Units (sort so dead corpses draw slightly behind living units)
    const sortedUnits = [...snapshot.units].sort((a, b) => {
      if (a.state === 'dead' && b.state !== 'dead') return -1;
      if (a.state !== 'dead' && b.state === 'dead') return 1;
      return a.uid - b.uid;
    });
    for (const unit of sortedUnits) {
      if (unit.x + 150 < camera.x || unit.x - 150 > camera.x + viewportW) continue;
      renderUnitEntity(ctx, unit);
    }

    // Combat VFX: Slashes, Active Ultimates, Projectiles, Beams, Particles, Popups
    renderSlashes(ctx, snapshot.slashes);
    renderActiveUltimates(ctx, snapshot.ultimates);
    renderProjectiles(ctx, snapshot.projectiles);
    renderBeams(ctx, snapshot.beams);
    renderParticles(ctx, snapshot.particles);
    renderPopups(ctx, snapshot.popups);

    ctx.restore();

    // 4. Foreground Parallax Grass / Rocks / Barbed Wire / Pylons along bottom ground lip
    renderForegroundParallax(ctx, snapshot.player.eraIndex, camera.x, viewportW, wallTime);

    ctx.restore();
  }
}

export function renderMinimap(
  canvas: HTMLCanvasElement,
  snapshot: GameSnapshot,
  camera: BattleCamera,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const era = getEra(snapshot.player.eraIndex);

  ctx.clearRect(0, 0, w, h);

  // Sky + Ground backdrop
  ctx.fillStyle = era.palette.skyTop;
  ctx.fillRect(0, 0, w, h * 0.72);
  ctx.fillStyle = era.palette.groundMid;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  const toX = (worldX: number) => (worldX / WORLD_WIDTH) * w;
  const groundLine = h * 0.72;

  // Player & Enemy Bases
  const pX = toX(PLAYER_BASE_X);
  const eX = toX(ENEMY_BASE_X);
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(Math.max(2, pX - 5), groundLine - 11, 10, 11);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(Math.min(w - 12, eX - 5), groundLine - 11, 10, 11);

  // Live Units as crisp team blips
  for (const u of snapshot.units) {
    if (u.state === 'dead') continue;
    const ux = toX(u.x);
    ctx.fillStyle = u.team === 'player' ? '#60a5fa' : '#f87171';
    const size = u.def.role === 'heavy' || u.def.role === 'siege' ? 4.5 : 3;
    ctx.fillRect(ux - size / 2, groundLine - size - 1, size, size);
  }

  // Active Ultimate markers
  for (const ult of snapshot.ultimates) {
    ctx.fillStyle = ult.def.accentColor;
    for (const ord of ult.fallingOrdinance) {
      if (ord.impacted) continue;
      ctx.fillRect(toX(ord.x) - 1.5, (ord.y / GROUND_Y) * groundLine, 3, 3);
    }
  }

  // Camera Viewport Frame
  const viewX = toX(camera.x);
  const viewW = Math.max(16, (camera.getViewportWorldWidth() / WORLD_WIDTH) * w);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.strokeRect(viewX + 1, 1, Math.min(w - viewX - 2, viewW - 2), h - 2);
}
