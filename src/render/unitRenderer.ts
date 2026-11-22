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
  const hoverShrink = hoverLift > 0 ? Math.max(0.62, 1 - hoverLift * 0.015) : 1;
  const shadowRx = Math.max(12, Math.min(46, unit.def.width * 0.62) * hoverShrink);
  const shadowRy = Math.max(3.8, Math.min(8, shadowRx * 0.24));
  const shadowAlpha = (1 - deathProgress * 0.85) * (hoverLift > 0 ? 0.28 : 0.38);
  ctx.fillStyle = `rgba(10, 14, 24, ${shadowAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(drawX, groundY + 1, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  ctx.fill();

  // 1b. Chrono Fever OR Veteran Hero (★★★) Pulsing Golden Ground Ring!
  if (unit.state !== 'dead' && (feverActive || unit.vetRank >= 2)) {
    const pulse = 0.65 + Math.sin(wallTime * 8 + unit.uid) * 0.28;
    ctx.save();
    ctx.strokeStyle =
      feverActive || unit.vetRank === 3
        ? `rgba(250, 204, 21, ${(0.75 * pulse).toFixed(2)})`
        : `rgba(254, 240, 138, ${(0.45 * pulse).toFixed(2)})`;
    ctx.lineWidth = feverActive || unit.vetRank === 3 ? 2.4 : 1.7;
    ctx.beginPath();
    ctx.ellipse(drawX, groundY + 1, shadowRx * (1.22 + pulse * 0.14), shadowRy * 1.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

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

  // 3. Cartoon Squash-and-Stretch Impact Recoil & Dynamic Attack Lunge (zero camera shake!)
  let recoilDx = 0;
  let scaleX = 1;
  let scaleY = 1;

  if (unit.state !== 'dead' && unit.hitFlash > 0.24) {
    const punch = (unit.hitFlash - 0.24) / 0.76;
    const isBig = unit.lastHitCrit;
    recoilDx = -dir * (isBig ? 9.5 : 5.4) * punch;
    scaleX = 1 - (isBig ? 0.17 : 0.10) * punch;
    scaleY = 1 + (isBig ? 0.15 : 0.09) * punch;
  } else if (unit.state !== 'dead' && unit.attackAnim > 0.72) {
    // Wind-up compression crouch before explosive lunge
    const coil = (1 - unit.attackAnim) / 0.28;
    recoilDx = -dir * 2.4 * coil;
    scaleX = 1 - 0.05 * coil;
    scaleY = 1 + 0.05 * coil;
  } else if (unit.state !== 'dead' && unit.attackAnim > 0.26 && unit.attackAnim <= 0.72) {
    const strikePeak = Math.sin(((unit.attackAnim - 0.26) / 0.46) * Math.PI);
    recoilDx = dir * 5.8 * strikePeak;
    scaleX = 1 + 0.11 * strikePeak;
    scaleY = 1 - 0.08 * strikePeak;
  }

  ctx.save();
  ctx.translate(drawX + recoilDx, spriteY);
  ctx.scale(scaleX, scaleY);
  renderUnitPose(ctx, pose);
  ctx.restore();

  // 4. Crisp Comic Starburst + Directional Manga Speed-Lines on fresh hit!
  if (unit.state !== 'dead' && unit.hitFlash > 0.54) {
    const f = (unit.hitFlash - 0.54) / 0.46;
    const iy = spriteY - unit.def.height * 0.58;
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
    for (let i = 0; i < lineCount; i++) {
      const spread = ((i / Math.max(1, lineCount - 1)) - 0.5) * 1.65;
      const baseAngle = dir === 1 ? Math.PI : 0; // kick away from incoming hit
      const a = baseAngle + spread;
      const d1 = rOuter * 0.72;
      const d2 = rOuter * (1.35 + (i % 2) * 0.45) * (0.65 + f * 0.55);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * d1, Math.sin(a) * d1);
      ctx.lineTo(Math.cos(a) * d2, Math.sin(a) * d2);
      ctx.stroke();
    }

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

  const topOffset = getUnitHpBarOffset(unit.def.id, unit.def.height);
  const showHpBar =
    unit.state !== 'dead' && (unit.hp < unit.maxHp || unit.displayHp > unit.hp + 0.5 || unit.shield > 0.5);

  // 5. Crisp Cel-Framed Overhead HP Bar with Delayed White/Gold Fighting-Game Trail!
  if (showHpBar) {
    const barW = Math.max(34, Math.min(78, unit.def.width * 1.18));
    const barH = 6.5;
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

  // 6. Gleaming Golden Veteran Promotion Stars (★ / ★★ / ★★★) above promoted fighters!
  if (unit.state !== 'dead' && unit.vetRank > 0) {
    const hasShieldBar = showHpBar && unit.shield > 0.5 && unit.maxShield > 0;
    const starY = spriteY - topOffset - (hasShieldBar ? 23 : showHpBar ? 19 : 9);
    const stars = '★'.repeat(unit.vetRank);
    ctx.save();
    ctx.font = '900 10.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.0;
    ctx.strokeStyle = INK;
    ctx.strokeText(stars, drawX, starY);
    ctx.fillStyle = unit.vetRank === 3 ? '#fef08a' : '#facc15';
    ctx.fillText(stars, drawX, starY);
    ctx.restore();
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
