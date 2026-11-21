import type { Team, UnitEntity, UnitVisualKind } from '../data/types';
import { GROUND_Y, UNIT_DEATH_DURATION } from '../game/constants';
import { PIXEL_WORLD_SCALE, drawSprite, getSpriteFrame } from './spriteAtlas';

export const UNIT_VISUAL_SCALE = PIXEL_WORLD_SCALE;

export interface UnitPoseParams {
  kind: UnitVisualKind;
  team: Team;
  walkPhase: number;
  attackAnim: number; // 0..1 (1 at attack start, decays to 0)
  hitFlash: number;
  deathProgress: number; // 0 alive -> 1 faded
  isWalking?: boolean;
  isAttacking?: boolean;
  attackCooldown?: number;
}

export type UnitAnimFrame =
  | 'walk_0'
  | 'walk_1'
  | 'walk_2'
  | 'walk_3'
  | 'attack_0'
  | 'attack_1'
  | 'attack_2'
  | 'hurt_0'
  | 'death_0';

/**
 * Resolve the exact pixel-art animation frame for a unit's current combat & movement state:
 * - Walk: 4 frames (walk_0..3)
 * - Attack: 3 frames (attack_0 windup -> attack_1 peak strike/muzzle flash -> attack_2 follow-through)
 * - Hurt / Death: 2 frames (hurt_0 knockback stagger / hit sparks -> death_0 fallen/wrecked)
 */
export function selectUnitAnimFrame(p: UnitPoseParams): UnitAnimFrame {
  if (p.deathProgress > 0) {
    return p.deathProgress < 0.25 ? 'hurt_0' : 'death_0';
  }
  if (p.hitFlash > 0.28) {
    return 'hurt_0';
  }
  if (p.attackAnim > 0.01) {
    if (p.attackAnim > 0.78) return 'attack_0';
    if (p.attackAnim > 0.32) return 'attack_1';
    return 'attack_2';
  }
  if (p.isAttacking && p.attackCooldown !== undefined && p.attackCooldown < 0.18) {
    return 'attack_0';
  }
  if (p.isWalking) {
    const idx = Math.floor((((p.walkPhase % (Math.PI * 2)) + Math.PI * 2) / (Math.PI * 2)) * 4) & 3;
    return `walk_${idx}` as UnitAnimFrame;
  }
  return 'walk_0';
}

export function renderUnitEntity(ctx: CanvasRenderingContext2D, unit: UnitEntity): void {
  const deathProgress = unit.state === 'dead' ? Math.min(1, unit.deathTimer / UNIT_DEATH_DURATION) : 0;
  const pose: UnitPoseParams = {
    kind: unit.def.id,
    team: unit.team,
    walkPhase: unit.state === 'walk' ? unit.walkPhase : 0,
    attackAnim: unit.attackAnim,
    hitFlash: unit.hitFlash,
    deathProgress,
    isWalking: unit.state === 'walk',
    isAttacking: unit.state === 'attack',
    attackCooldown: unit.attackCooldown,
  };

  const anim = selectUnitAnimFrame(pose);
  const spriteKey = `unit/${unit.def.id}/${unit.team}/${anim}`;
  const frame = getSpriteFrame(spriteKey);

  const visualW = frame ? frame.w * PIXEL_WORLD_SCALE : unit.def.width * 1.5;
  const visualH = frame ? frame.h * PIXEL_WORLD_SCALE : unit.def.height * 1.5;

  const alpha = deathProgress > 0.62 ? Math.max(0, 1 - (deathProgress - 0.62) / 0.38) : 1;
  const drawX = Math.round(unit.x);
  const drawY = GROUND_Y;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Crisp stepped pixel-art contact shadow on the road
  const shadowW = Math.max(24, Math.round(Math.min(visualW * 0.64, unit.def.width * 1.38) / 2) * 2);
  const shadowAlpha = (1 - deathProgress * 0.8) * 0.42;
  ctx.fillStyle = `rgba(8, 12, 20, ${shadowAlpha.toFixed(2)})`;
  ctx.fillRect(drawX - Math.round(shadowW / 2), drawY - 1, shadowW, 4);
  ctx.fillRect(drawX - Math.round(shadowW / 2) + 4, drawY - 3, Math.max(8, shadowW - 8), 8);

  // Subtle pixel knockback jolt on fresh hit
  const recoilDx =
    unit.state !== 'dead' && unit.hitFlash > 0.35
      ? (unit.team === 'player' ? -3 : 3)
      : 0;

  const drawn = drawSprite(ctx, spriteKey, drawX + recoilDx, drawY, {
    scale: PIXEL_WORLD_SCALE,
    flipX: unit.team === 'enemy',
    alpha,
  });

  // Fallback silhouette only for the tiny moment before PNG finishes decoding
  if (!drawn) {
    ctx.fillStyle = unit.team === 'player' ? '#2563eb' : '#dc2626';
    ctx.fillRect(drawX - 10, drawY - 34, 20, 34);
  }

  // Crisp pixel-framed overhead HP bar when damaged
  if (unit.state !== 'dead' && unit.hp < unit.maxHp) {
    const barW = Math.max(30, Math.min(72, Math.round((unit.def.width * 1.2) / 2) * 2));
    const barH = 6;
    const barY = drawY - Math.min(visualH, unit.def.height * 1.5 + 14) - 8;
    const ratio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    const fillW = Math.max(2, Math.round(barW * ratio));

    ctx.fillStyle = '#0c101a';
    ctx.fillRect(drawX - Math.round(barW / 2) - 2, barY - 2, barW + 4, barH + 4);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(drawX - Math.round(barW / 2), barY, barW, barH);
    ctx.fillStyle = unit.team === 'player' ? '#1d4ed8' : '#991b1b';
    ctx.fillRect(drawX - Math.round(barW / 2), barY, fillW, barH);
    ctx.fillStyle = unit.team === 'player' ? '#60a5fa' : '#f87171';
    ctx.fillRect(drawX - Math.round(barW / 2), barY, fillW, 3);
  }

  ctx.restore();
}

/**
 * Draw a unit pose at the current canvas origin (0, 0) using its pixel-art sprite.
 */
export function renderUnitPose(ctx: CanvasRenderingContext2D, p: UnitPoseParams): void {
  const anim = selectUnitAnimFrame(p);
  const key = `unit/${p.kind}/${p.team}/${anim}`;
  const alpha = p.deathProgress > 0.62 ? Math.max(0, 1 - (p.deathProgress - 0.62) / 0.38) : 1;
  drawSprite(ctx, key, 0, 0, {
    scale: 1,
    flipX: p.team === 'enemy',
    alpha,
  });
}
