import type { Team, UnitEntity, UnitVisualKind } from '../data/types';
import { GROUND_Y, UNIT_DEATH_DURATION } from '../game/constants';
import { INK, setInkStyle } from './cartoonPrimitives';
import { drawEarlyCartoonUnit } from './unitsEarly';
import { drawLateCartoonUnit } from './unitsLate';

export const UNIT_VISUAL_SCALE = 1;

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

// ============================================================================
// BOUNDED LRU OFFSCREEN UNIT SPRITE-FRAME CACHE (60fps iPhone WebKit 2x Brawl)
// ============================================================================
interface CachedUnitSprite {
  canvas: HTMLCanvasElement;
  originX: number; // world-unit offset from left of tile to foot origin (0,0)
  originY: number; // world-unit offset from top of tile to foot origin (0,0)
  worldW: number;
  worldH: number;
}

const UNIT_CACHE_MAX_ENTRIES = 240;
const UNIT_CACHE_SCALE = 1.5;
const MAX_BAKES_PER_FRAME = 4;
const unitSpriteCache = new Map<string, CachedUnitSprite>();
let unitCacheBakesThisFrame = 0;

const LARGE_UNITS = new Set<UnitVisualKind>([
  'dino_rider',
  'sphinx_chariot',
  'chariot',
  'hwacha_cart',
  'dragon_general',
  'heavy_cavalry',
  'catapult',
  'field_cannon',
  'steam_walker',
  'mortar_team',
  'early_tank',
  'mbt',
  'colossus_mech',
  'star_archon',
  'omega_titan',
  'aegis_seraph',
  'chrono_sovereign',
]);

export function resetUnitCacheFrameBudget(): void {
  unitCacheBakesThisFrame = 0;
}

export function clearUnitSpriteCache(): void {
  unitSpriteCache.clear();
}

export function getUnitSpriteCacheSize(): number {
  return unitSpriteCache.size;
}

function getSpriteBounds(kind: UnitVisualKind): { left: number; right: number; top: number; bottom: number } {
  if (kind === 'chrono_sovereign' || kind === 'omega_titan') {
    return { left: 96, right: 118, top: 164, bottom: 30 };
  }
  if (kind === 'colossus_mech' || kind === 'star_archon' || kind === 'steam_walker') {
    return { left: 86, right: 108, top: 136, bottom: 28 };
  }
  if (LARGE_UNITS.has(kind)) {
    return { left: 86, right: 108, top: 112, bottom: 28 };
  }
  return { left: 68, right: 92, top: 96, bottom: 24 };
}

function getOrBakeUnitSprite(p: UnitPoseParams): CachedUnitSprite | null {
  if (typeof document === 'undefined') return null;
  // Transient death poses render directly (rare & brief)
  if (p.deathProgress > 0.001) return null;

  let mode: 'w' | 'a' | 'i' | 'h';
  let bucket: number;
  let quantWalkPhase: number;
  let quantAttackAnim = 0;
  let quantHitFlash = 0;
  let quantIsWalking = false;

  if (p.hitFlash > 0.28) {
    mode = 'h';
    bucket = 0;
    quantWalkPhase = 0;
    quantHitFlash = 0.78;
  } else if (p.attackAnim > 0.02) {
    mode = 'a';
    bucket = Math.min(7, Math.floor(p.attackAnim * 8));
    quantAttackAnim = (bucket + 0.5) / 8;
    quantWalkPhase = 0;
  } else if (p.isWalking) {
    mode = 'w';
    const norm = (((p.walkPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
    bucket = Math.floor(norm * 12) % 12;
    quantWalkPhase = ((bucket + 0.5) / 12) * Math.PI * 2;
    quantIsWalking = true;
  } else {
    mode = 'i';
    const norm = (((p.walkPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
    bucket = Math.floor(norm * 4) % 4;
    quantWalkPhase = ((bucket + 0.5) / 4) * Math.PI * 2;
  }

  const key = `${p.kind}:${p.team[0]}:${mode}:${bucket}`;
  const existing = unitSpriteCache.get(key);
  if (existing) {
    // Refresh LRU order cheaply
    unitSpriteCache.delete(key);
    unitSpriteCache.set(key, existing);
    return existing;
  }

  if (unitCacheBakesThisFrame >= MAX_BAKES_PER_FRAME) {
    return null;
  }

  const bounds = getSpriteBounds(p.kind);
  const worldW = bounds.left + bounds.right;
  const worldH = bounds.top + bounds.bottom;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(worldW * UNIT_CACHE_SCALE);
  canvas.height = Math.ceil(worldH * UNIT_CACHE_SCALE);
  const sctx = canvas.getContext('2d');
  if (!sctx) return null;

  unitCacheBakesThisFrame++;
  // Origin X mirrors cleanly when enemy flips horizontally
  const originX = p.team === 'player' ? bounds.left : bounds.right;
  const originY = bounds.top;

  sctx.save();
  sctx.scale(UNIT_CACHE_SCALE, UNIT_CACHE_SCALE);
  sctx.translate(originX, originY);
  renderUnitPose(sctx, {
    kind: p.kind,
    team: p.team,
    walkPhase: quantWalkPhase,
    attackAnim: quantAttackAnim,
    hitFlash: quantHitFlash,
    deathProgress: 0,
    isWalking: quantIsWalking,
    isAttacking: mode === 'a',
  });
  sctx.restore();

  const entry: CachedUnitSprite = { canvas, originX, originY, worldW, worldH };
  if (unitSpriteCache.size >= UNIT_CACHE_MAX_ENTRIES) {
    const oldestKey = unitSpriteCache.keys().next().value;
    if (oldestKey !== undefined) unitSpriteCache.delete(oldestKey);
  }
  unitSpriteCache.set(key, entry);
  return entry;
}

/**
 * Resolve canonical discrete animation phase label (useful for state tests & debug inspection)
 * while the vector renderer interpolates smoothly at 60fps.
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

/**
 * Draw a Flash-cartoon cel-shaded unit pose at canvas origin (0, 0).
 * Flips horizontally automatically for enemy units so all art definitions face RIGHT (+X).
 */
export function renderUnitPose(ctx: CanvasRenderingContext2D, p: UnitPoseParams): void {
  const alpha = p.deathProgress > 0.62 ? Math.max(0, 1 - (p.deathProgress - 0.62) / 0.38) : 1;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (p.team === 'enemy') {
    ctx.scale(-1, 1);
  }
  const params = {
    kind: p.kind,
    team: p.team,
    walkPhase: p.walkPhase,
    isWalking: p.isWalking ?? false,
    attackAnim: p.attackAnim,
    hitFlash: p.hitFlash,
    deathProgress: p.deathProgress,
  };
  if (!drawEarlyCartoonUnit(ctx, params)) {
    drawLateCartoonUnit(ctx, params);
  }
  ctx.restore();
}

/**
 * Render a full in-world unit entity with smooth oval shadow, hover bob,
 * cached 60fps offscreen sprite blit, cartoon squash-and-stretch hit/attack response,
 * Vanguard Shield shimmer, upgrade aura, and fighting-game delayed HP bar.
 */
export function renderUnitEntity(
  ctx: CanvasRenderingContext2D,
  unit: UnitEntity,
  feverActive = false,
  wallTime = 0,
): void {
  const deathProgress = unit.state === 'dead' ? Math.min(1, unit.deathTimer / UNIT_DEATH_DURATION) : 0;
  const pose: UnitPoseParams = {
    kind: unit.def.id,
    team: unit.team,
    walkPhase: unit.walkPhase,
    attackAnim: unit.attackAnim,
    hitFlash: unit.hitFlash,
    deathProgress,
    isWalking: unit.state === 'walk',
    isAttacking: unit.state === 'attack',
    attackCooldown: unit.attackCooldown,
  };

  const drawX = unit.x;
  const groundY = GROUND_Y;
  const hoverBase = unit.def.hoverHeight ?? 0;
  const hoverLift =
    hoverBase > 0 && unit.state !== 'dead'
      ? hoverBase + Math.sin(unit.walkPhase * 1.4 + unit.uid * 1.7) * 3.8
      : 0;
  const spriteY = groundY - hoverLift;
  const dir = unit.team === 'player' ? 1 : -1;

  ctx.save();

  // 1. Soft Cartoon Oval Contact Shadow on Battlefield Road
  const unitScale = unit.scaleMult ?? 1;
  const hoverShrink = hoverLift > 0 ? Math.max(0.62, 1 - hoverLift * 0.015) : 1;
  const shadowRx = Math.max(12, Math.min(58, unit.def.width * 0.62 * unitScale) * hoverShrink);
  const shadowRy = Math.max(3.8, Math.min(9.5, shadowRx * 0.24));
  const shadowAlpha = (1 - deathProgress * 0.85) * (hoverLift > 0 ? 0.28 : 0.38);
  ctx.fillStyle = `rgba(10, 14, 24, ${shadowAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(drawX, groundY + 1, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // 1a. Elite / Boss Menacing Underfoot Command Ring
  if (unit.state !== 'dead' && unit.eliteKind) {
    const ePulse = 0.72 + Math.sin(wallTime * 6.5 + unit.uid) * 0.24;
    const isBoss = unit.eliteKind === 'boss';
    ctx.strokeStyle = isBoss
      ? `rgba(244, 63, 94, ${(0.88 * ePulse).toFixed(2)})`
      : `rgba(192, 132, 252, ${(0.76 * ePulse).toFixed(2)})`;
    ctx.lineWidth = isBoss ? 3.2 : 2.3;
    ctx.beginPath();
    ctx.ellipse(drawX, groundY + 1, shadowRx * (1.32 + ePulse * 0.12), shadowRy * 1.48, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (isBoss) {
      ctx.strokeStyle = `rgba(250, 204, 21, ${(0.72 * ePulse).toFixed(2)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(drawX, groundY + 1, shadowRx * 1.12, shadowRy * 1.18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 1b. Chrono Fever OR Veteran Hero (★★ / ★★★) Pulsing Golden Ground Ring!
  if (unit.state !== 'dead' && (feverActive || unit.vetRank >= 2)) {
    const pulse = 0.65 + Math.sin(wallTime * 8 + unit.uid) * 0.28;
    ctx.strokeStyle =
      feverActive || unit.vetRank === 3
        ? `rgba(250, 204, 21, ${(0.78 * pulse).toFixed(2)})`
        : `rgba(254, 240, 138, ${(0.48 * pulse).toFixed(2)})`;
    ctx.lineWidth = feverActive || unit.vetRank === 3 ? 2.4 : 1.7;
    ctx.beginPath();
    ctx.ellipse(drawX, groundY + 1, shadowRx * (1.22 + pulse * 0.14), shadowRy * 1.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 1c. Cryo Shard Frost Ring on Chilled Units
  if (unit.state !== 'dead' && unit.slowTimer && unit.slowTimer > 0.05) {
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.82)';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.ellipse(drawX, groundY - 2, shadowRx * 1.08, shadowRy * 1.12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 2. Golden Upgrade Power-Up Aura (zero-gradient crisp double-tier column & expanding ring)
  if (unit.state !== 'dead' && unit.upgradeFlash > 0.04) {
    const f = unit.upgradeFlash;
    const auraW = shadowRx * 1.48;
    const auraH = unit.def.height * unitScale * 1.15 + 10;
    ctx.fillStyle = `rgba(250, 204, 21, ${(f * 0.22).toFixed(2)})`;
    ctx.beginPath();
    ctx.roundRect(drawX - auraW / 2, spriteY - auraH, auraW, auraH, 10);
    ctx.fill();
    ctx.fillStyle = `rgba(254, 240, 138, ${(f * 0.28).toFixed(2)})`;
    ctx.beginPath();
    ctx.roundRect(drawX - auraW * 0.32, spriteY - auraH * 0.62, auraW * 0.64, auraH * 0.62, 7);
    ctx.fill();

    ctx.strokeStyle = `rgba(254, 240, 138, ${(f * 0.85).toFixed(2)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(drawX, groundY + 1, shadowRx * (1.1 + (1 - f) * 0.35), shadowRy * 1.25, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Cartoon Squash-and-Stretch Impact Recoil & Dynamic Attack Lunge (zero camera shake!)
  let recoilDx = 0;
  let scaleX = unitScale;
  let scaleY = unitScale;

  if (unit.state !== 'dead' && unit.hitFlash > 0.24) {
    const punch = (unit.hitFlash - 0.24) / 0.76;
    const isBig = unit.lastHitCrit;
    recoilDx = -dir * (isBig ? 9.5 : 5.4) * punch;
    scaleX = unitScale * (1 - (isBig ? 0.17 : 0.10) * punch);
    scaleY = unitScale * (1 + (isBig ? 0.15 : 0.09) * punch);
  } else if (unit.state !== 'dead' && unit.attackAnim > 0.72) {
    // Wind-up compression crouch before explosive lunge
    const coil = (1 - unit.attackAnim) / 0.28;
    recoilDx = -dir * 2.4 * coil;
    scaleX = unitScale * (1 - 0.05 * coil);
    scaleY = unitScale * (1 + 0.05 * coil);
  } else if (unit.state !== 'dead' && unit.attackAnim > 0.26 && unit.attackAnim <= 0.72) {
    const strikePeak = Math.sin(((unit.attackAnim - 0.26) / 0.46) * Math.PI);
    recoilDx = dir * 5.8 * strikePeak;
    scaleX = unitScale * (1 + 0.11 * strikePeak);
    scaleY = unitScale * (1 - 0.08 * strikePeak);
  }

  ctx.save();
  ctx.translate(drawX + recoilDx, spriteY);
  if (scaleX !== 1 || scaleY !== 1) {
    ctx.scale(scaleX, scaleY);
  }
  const cachedSprite = getOrBakeUnitSprite(pose);
  if (cachedSprite) {
    ctx.drawImage(
      cachedSprite.canvas,
      -cachedSprite.originX,
      -cachedSprite.originY,
      cachedSprite.worldW,
      cachedSprite.worldH,
    );
  } else {
    renderUnitPose(ctx, pose);
  }
  ctx.restore();

  // 3b. Subtle Cyan Vanguard Energy Barrier front arc on actively shielded units!
  if (unit.state !== 'dead' && unit.shield > 0.5 && unit.maxShield > 0) {
    const shPulse = 0.42 + Math.sin(wallTime * 6.5 + unit.uid) * 0.16;
    const shRadius = Math.max(20, unit.def.height * unitScale * 0.54);
    const shCenterY = spriteY - unit.def.height * unitScale * 0.56;
    ctx.strokeStyle = `rgba(56, 189, 248, ${shPulse.toFixed(2)})`;
    ctx.lineWidth = unit.hitFlash > 0.35 ? 3.2 : 2.0;
    ctx.beginPath();
    if (dir === 1) {
      ctx.arc(drawX + recoilDx + 4, shCenterY, shRadius, -0.82, 0.82);
    } else {
      ctx.arc(drawX + recoilDx - 4, shCenterY, shRadius, Math.PI - 0.82, Math.PI + 0.82);
    }
    ctx.stroke();
  }

  // 4. Crisp Comic Starburst + Directional Manga Speed-Lines on fresh hit!
  if (unit.state !== 'dead' && unit.hitFlash > 0.54) {
    const f = (unit.hitFlash - 0.54) / 0.46;
    const iy = spriteY - unit.def.height * unitScale * 0.58;
    const ix = drawX + recoilDx;
    const rOuter = (unit.lastHitCrit ? 22 : 13.5) * (0.48 + f * 0.75);
    const rInner = rOuter * 0.34;
    ctx.save();
    ctx.translate(ix, iy);

    // Directional manga impact speed-lines radiating backward away from blow!
    const lineCount = unit.lastHitCrit ? 7 : 4;
    ctx.strokeStyle = unit.lastHitCrit ? 'rgba(254, 240, 138, 0.92)' : 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = unit.lastHitCrit ? 2.4 : 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < lineCount; i++) {
      const spread = (i / Math.max(1, lineCount - 1) - 0.5) * 1.65;
      const baseAngle = dir === 1 ? Math.PI : 0; // kick away from incoming hit
      const a = baseAngle + spread;
      const d1 = rOuter * 0.72;
      const d2 = rOuter * (1.35 + (i % 2) * 0.45) * (0.65 + f * 0.55);
      ctx.moveTo(Math.cos(a) * d1, Math.sin(a) * d1);
      ctx.lineTo(Math.cos(a) * d2, Math.sin(a) * d2);
    }
    ctx.stroke();

    // Crisp multi-spike comic impact starburst
    ctx.beginPath();
    const spikes = unit.lastHitCrit ? 10 : 7;
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 + f * 0.45;
      const r = i % 2 === 0 ? rOuter : rInner;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = unit.lastHitCrit ? 'rgba(253, 224, 71, 0.96)' : 'rgba(255, 255, 255, 0.92)';
    ctx.fill();
    setInkStyle(ctx, 1.5, unit.lastHitCrit ? '#b45309' : '#334155');
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, rInner * 0.88, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const topOffset = getUnitHpBarOffset(unit.def.id, unit.def.height) * unitScale;
  const showHpBar =
    unit.state !== 'dead' &&
    (unit.eliteKind !== undefined ||
      unit.hp < unit.maxHp ||
      unit.displayHp > unit.hp + 0.5 ||
      unit.shield > 0.5);

  // 5. Crisp Cel-Framed Overhead HP Bar with Delayed White/Gold Trail (zero per-unit gradient!)
  if (showHpBar) {
    const isBoss = unit.eliteKind === 'boss';
    const isElite = unit.eliteKind === 'elite';
    const barW = Math.max(
      isBoss ? 68 : isElite ? 48 : 34,
      Math.min(isBoss ? 104 : 82, unit.def.width * 1.18 * unitScale),
    );
    const barH = isBoss ? 8.5 : isElite ? 7.2 : 6.5;
    const barY = spriteY - topOffset - 10;
    const ratio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    const trailRatio = Math.max(ratio, Math.min(1, unit.displayHp / unit.maxHp));
    const fillW = barW * ratio;
    const trailW = Math.max(fillW, barW * trailRatio);
    const barLeft = drawX - barW / 2;

    // Rounded dark-ink pill frame
    ctx.fillStyle = '#141c2c';
    ctx.beginPath();
    ctx.roundRect(barLeft, barY, barW, barH, 3);
    ctx.fill();

    // Delayed white/gold drain chunk
    if (trailW > fillW + 0.5) {
      ctx.fillStyle = unit.lastHitCrit ? '#fde047' : '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(barLeft + fillW, barY, trailW - fillW, barH, 2);
      ctx.fill();
    }

    // Live HP fill with crisp 2-tone cel top sheen (zero createLinearGradient!)
    if (fillW > 0.5) {
      ctx.fillStyle = isBoss
        ? '#e11d48'
        : isElite && unit.team === 'enemy'
          ? '#a855f7'
          : unit.team === 'player'
            ? '#2563eb'
            : '#ef4444';
      ctx.beginPath();
      ctx.roundRect(barLeft, barY, fillW, barH, 2.5);
      ctx.fill();
      if (fillW > 3) {
        ctx.fillStyle = isBoss
          ? '#fda4af'
          : isElite && unit.team === 'enemy'
            ? '#d8b4fe'
            : unit.team === 'player'
              ? '#60a5fa'
              : '#fb7185';
        ctx.fillRect(barLeft + 1.5, barY + 0.8, fillW - 3, 2.0);
      }
    }

    const frameColor =
      unit.hitFlash > 0.55
        ? unit.lastHitCrit
          ? '#fde047'
          : '#ffffff'
        : isBoss
          ? '#facc15'
          : INK;
    setInkStyle(ctx, isBoss ? 2.2 : 1.8, frameColor);
    ctx.beginPath();
    ctx.roundRect(barLeft, barY, barW, barH, 3);
    ctx.stroke();

    // Gleaming Cyan Vanguard Energy Shield strip riding cleanly atop the HP bar!
    if (unit.shield > 0.5 && unit.maxShield > 0) {
      const shFrac = Math.max(0, Math.min(1, unit.shield / unit.maxShield));
      const shY = barY - 4.5;
      const shW = Math.max(3, barW * shFrac);
      ctx.fillStyle = 'rgba(12, 22, 38, 0.78)';
      ctx.beginPath();
      ctx.roundRect(barLeft, shY, barW, 3.6, 1.8);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(barLeft, shY, shW, 3.6, 1.8);
      ctx.fill();
      ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
      ctx.fillRect(barLeft + 1, shY + 0.5, Math.max(0, shW - 2), 1.1);
    }
  }

  // 6. Boss / Elite Crown Emblem OR Veteran Promotion Stars (★ / ★★ / ★★★)
  if (unit.state !== 'dead' && (unit.eliteKind || unit.vetRank > 0)) {
    const hasShieldBar = showHpBar && unit.shield > 0.5 && unit.maxShield > 0;
    const badgeY = spriteY - topOffset - (hasShieldBar ? 24 : showHpBar ? 20 : 9);
    const label =
      unit.eliteKind === 'boss'
        ? '♛ BOSS'
        : unit.eliteKind === 'elite'
          ? '◆ ELITE'
          : unit.vetRank === 3
            ? '★★★'
            : unit.vetRank === 2
              ? '★★'
              : '★';
    ctx.font = unit.eliteKind === 'boss' ? '900 11px system-ui, sans-serif' : '900 10.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = INK;
    ctx.strokeText(label, drawX, badgeY);
    ctx.fillStyle =
      unit.eliteKind === 'boss'
        ? '#fde047'
        : unit.eliteKind === 'elite'
          ? '#e9d5ff'
          : unit.vetRank === 3
            ? '#fef08a'
            : '#facc15';
    ctx.fillText(label, drawX, badgeY);
  }

  ctx.restore();
}

function getUnitHpBarOffset(kind: UnitVisualKind, defHeight: number): number {
  if (kind === 'chrono_sovereign') return 144;
  if (kind === 'omega_titan') return 134;
  if (kind === 'colossus_mech') return 114;
  if (kind === 'star_archon') return 92;
  if (kind === 'steam_walker') return 84;
  if (kind === 'dragon_general') return 82;
  if (kind === 'dino_rider' || kind === 'heavy_cavalry') return 76;
  if (kind === 'sphinx_chariot' || kind === 'chariot' || kind === 'aegis_seraph') return 72;
  if (kind === 'early_tank' || kind === 'mbt') return 70;
  if (kind === 'catapult' || kind === 'field_cannon' || kind === 'hwacha_cart') return 68;
  if (
    kind === 'anubis_warrior' ||
    kind === 'shaman' ||
    kind === 'sun_priest' ||
    kind === 'scorpion_guard' ||
    kind === 'spearman' ||
    kind === 'centurion' ||
    kind === 'dynasty_swordsman' ||
    kind === 'repeating_crossbow' ||
    kind === 'knight' ||
    kind === 'pikeman' ||
    kind === 'grenadier' ||
    kind === 'steam_trooper' ||
    kind === 'tesla_coil_trooper' ||
    kind === 'riot_juggernaut' ||
    kind === 'cyborg' ||
    kind === 'void_templar' ||
    kind === 'gravity_sniper' ||
    kind === 'chrono_blade' ||
    kind === 'quantum_weaver'
  ) {
    return 76;
  }
  return Math.max(66, defHeight * 1.32);
}
