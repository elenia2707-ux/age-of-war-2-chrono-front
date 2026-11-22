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
 * cartoon squash-and-stretch hit/attack response, upgrade aura, and fighting-game delayed HP bar.
 */
export function renderUnitEntity(ctx: CanvasRenderingContext2D, unit: UnitEntity): void {
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
  const hoverShrink = hoverLift > 0 ? Math.max(0.62, 1 - hoverLift * 0.015) : 1;
  const shadowRx = Math.max(12, Math.min(46, unit.def.width * 0.62) * hoverShrink);
  const shadowRy = Math.max(3.8, Math.min(8, shadowRx * 0.24));
  const shadowAlpha = (1 - deathProgress * 0.85) * (hoverLift > 0 ? 0.28 : 0.38);
  ctx.fillStyle = `rgba(10, 14, 24, ${shadowAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(drawX, groundY + 1, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Golden Upgrade Power-Up Aura (smooth glowing column & floor ring)
  if (unit.state !== 'dead' && unit.upgradeFlash > 0.04) {
    const f = unit.upgradeFlash;
    const auraW = shadowRx * 1.5;
    const auraH = unit.def.height * 1.18 + 10;
    const grad = ctx.createLinearGradient(drawX, spriteY, drawX, spriteY - auraH);
    grad.addColorStop(0, `rgba(250, 204, 21, ${(f * 0.5).toFixed(2)})`);
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(drawX - auraW / 2, spriteY - auraH, auraW, auraH, 10);
    ctx.fill();

    ctx.strokeStyle = `rgba(254, 240, 138, ${(f * 0.85).toFixed(2)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(drawX, groundY + 1, shadowRx * (1.1 + (1 - f) * 0.35), shadowRy * 1.25, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Cartoon Squash-and-Stretch Impact Recoil & Forward Attack Lunge (zero camera shake!)
  let recoilDx = 0;
  let scaleX = 1;
  let scaleY = 1;

  if (unit.state !== 'dead' && unit.hitFlash > 0.28) {
    const punch = (unit.hitFlash - 0.28) / 0.72;
    const isBig = unit.lastHitCrit;
    recoilDx = -dir * (isBig ? 7.5 : 4.5) * punch;
    scaleX = 1 - (isBig ? 0.14 : 0.08) * punch;
    scaleY = 1 + (isBig ? 0.13 : 0.08) * punch;
  } else if (unit.state !== 'dead' && unit.attackAnim > 0.32 && unit.attackAnim <= 0.78) {
    const strikePeak = Math.sin(((unit.attackAnim - 0.32) / 0.46) * Math.PI);
    recoilDx = dir * 3.2 * strikePeak;
    scaleX = 1 + 0.06 * strikePeak;
    scaleY = 1 - 0.04 * strikePeak;
  }

  ctx.save();
  ctx.translate(drawX + recoilDx, spriteY);
  ctx.scale(scaleX, scaleY);
  renderUnitPose(ctx, pose);
  ctx.restore();

  // 4. Crisp Comic Starburst Impact Flash directly over torso on fresh hit!
  if (unit.state !== 'dead' && unit.hitFlash > 0.62) {
    const f = (unit.hitFlash - 0.62) / 0.38;
    const iy = spriteY - unit.def.height * 0.56;
    const ix = drawX + recoilDx;
    const rOuter = (unit.lastHitCrit ? 19 : 12) * (0.45 + f * 0.75);
    const rInner = rOuter * 0.36;
    ctx.save();
    ctx.translate(ix, iy);
    ctx.beginPath();
    const spikes = unit.lastHitCrit ? 8 : 6;
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 + f * 0.4;
      const r = i % 2 === 0 ? rOuter : rInner;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = unit.lastHitCrit ? 'rgba(253, 224, 71, 0.94)' : 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    setInkStyle(ctx, 1.5, unit.lastHitCrit ? '#b45309' : '#334155');
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, rInner * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Crisp Cel-Framed Overhead HP Bar with Delayed White/Gold Fighting-Game Trail!
  if (unit.state !== 'dead' && (unit.hp < unit.maxHp || unit.displayHp > unit.hp + 0.5)) {
    const barW = Math.max(34, Math.min(78, unit.def.width * 1.18));
    const barH = 6.5;
    const topOffset = getUnitHpBarOffset(unit.def.id, unit.def.height);
    const barY = spriteY - topOffset - 10;
    const ratio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    const trailRatio = Math.max(ratio, Math.min(1, unit.displayHp / unit.maxHp));
    const fillW = barW * ratio;
    const trailW = Math.max(fillW, barW * trailRatio);
    const barLeft = drawX - barW / 2;

    // Rounded dark-ink pill frame (flashes bright gold/white on hit)
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

    // Live HP fill with smooth glossy top highlight
    if (fillW > 0.5) {
      const hpGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
      if (unit.team === 'player') {
        hpGrad.addColorStop(0, '#60a5fa');
        hpGrad.addColorStop(0.55, '#2563eb');
        hpGrad.addColorStop(1, '#1d4ed8');
      } else {
        hpGrad.addColorStop(0, '#fb7185');
        hpGrad.addColorStop(0.55, '#ef4444');
        hpGrad.addColorStop(1, '#b91c1c');
      }
      ctx.fillStyle = hpGrad;
      ctx.beginPath();
      ctx.roundRect(barLeft, barY, fillW, barH, 2.5);
      ctx.fill();
    }

    setInkStyle(ctx, 1.8, unit.hitFlash > 0.55 ? (unit.lastHitCrit ? '#fde047' : '#ffffff') : INK);
    ctx.beginPath();
    ctx.roundRect(barLeft, barY, barW, barH, 3);
    ctx.stroke();
  }

  ctx.restore();
}

function getUnitHpBarOffset(kind: UnitVisualKind, defHeight: number): number {
  if (kind === 'omega_titan') return 128;
  if (kind === 'colossus_mech') return 112;
  if (kind === 'star_archon') return 88;
  if (kind === 'steam_walker') return 82;
  if (kind === 'dino_rider' || kind === 'heavy_cavalry') return 74;
  if (kind === 'sphinx_chariot' || kind === 'chariot') return 70;
  if (kind === 'early_tank' || kind === 'mbt') return 68;
  if (kind === 'catapult' || kind === 'field_cannon') return 64;
  if (
    kind === 'anubis_warrior' ||
    kind === 'shaman' ||
    kind === 'scorpion_guard' ||
    kind === 'centurion' ||
    kind === 'knight' ||
    kind === 'grenadier' ||
    kind === 'tesla_coil_trooper' ||
    kind === 'riot_juggernaut' ||
    kind === 'void_templar'
  ) {
    return 70;
  }
  return Math.max(62, defHeight * 1.28);
}
