import type { Team, UnitEntity, UnitVisualKind } from '../data/types';
import { GROUND_Y, UNIT_DEATH_DURATION } from '../game/constants';

export const UNIT_VISUAL_SCALE = 1.48;
const INK = '#121622';

export interface UnitPoseParams {
  kind: UnitVisualKind;
  team: Team;
  walkPhase: number;
  attackAnim: number; // 0..1 (1 at attack start, decays to 0)
  hitFlash: number;
  deathProgress: number; // 0 alive -> 1 faded
  isWalking?: boolean;
}

interface TeamPalette {
  primary: string;
  shade: string;
  highlight: string;
  glow: string;
  trim: string;
}

function teamColors(team: Team): TeamPalette {
  return team === 'player'
    ? {
        primary: '#2563eb',
        shade: '#1e3a8a',
        highlight: '#60a5fa',
        glow: '#38bdf8',
        trim: '#dbeafe',
      }
    : {
        primary: '#dc2626',
        shade: '#7f1d1d',
        highlight: '#f87171',
        glow: '#fb7185',
        trim: '#fee2e2',
      };
}

let hitFlashCanvas: HTMLCanvasElement | null = null;
let hitFlashCtx: CanvasRenderingContext2D | null = null;

function getHitFlashScratch(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  if (!hitFlashCanvas) {
    hitFlashCanvas = document.createElement('canvas');
    hitFlashCanvas.width = 280;
    hitFlashCanvas.height = 240;
    hitFlashCtx = hitFlashCanvas.getContext('2d');
  }
  if (!hitFlashCtx) return null;
  return { canvas: hitFlashCanvas, ctx: hitFlashCtx };
}

export function renderUnitEntity(ctx: CanvasRenderingContext2D, unit: UnitEntity): void {
  const deathProgress = unit.state === 'dead' ? Math.min(1, unit.deathTimer / UNIT_DEATH_DURATION) : 0;
  const scaledW = unit.def.width * UNIT_VISUAL_SCALE;
  const scaledH = unit.def.height * UNIT_VISUAL_SCALE;

  ctx.save();
  ctx.translate(unit.x, GROUND_Y);

  // Layered soft + core elliptical ground shadow (scales slightly with movement bob)
  const bobLift = unit.state === 'walk' ? Math.abs(Math.cos(unit.walkPhase)) * 0.06 : 0;
  const shadowRx = Math.max(15, scaledW * 0.52 * (1 - bobLift));
  const shadowAlpha = 1 - deathProgress;
  ctx.fillStyle = `rgba(8, 12, 20, ${(0.26 * shadowAlpha).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(0, 2, shadowRx * 1.15, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(6, 9, 16, ${(0.42 * shadowAlpha).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(0, 1.5, shadowRx * 0.8, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();

  const pose: UnitPoseParams = {
    kind: unit.def.id,
    team: unit.team,
    walkPhase: unit.state === 'walk' ? unit.walkPhase : 0,
    attackAnim: unit.attackAnim,
    hitFlash: unit.hitFlash,
    deathProgress,
    isWalking: unit.state === 'walk',
  };

  if (unit.hitFlash > 0.05) {
    const scratch = getHitFlashScratch();
    if (scratch) {
      const { canvas: sc, ctx: sctx } = scratch;
      sctx.clearRect(0, 0, sc.width, sc.height);
      sctx.save();
      sctx.translate(140, 198);
      sctx.scale(UNIT_VISUAL_SCALE, UNIT_VISUAL_SCALE);
      renderUnitPose(sctx, { ...pose, hitFlash: unit.hitFlash });
      sctx.globalCompositeOperation = 'source-atop';
      sctx.fillStyle = `rgba(255, 255, 255, ${(unit.hitFlash * 0.72).toFixed(2)})`;
      sctx.fillRect(-140, -198, sc.width, sc.height);
      sctx.restore();
      ctx.drawImage(sc, -140, -198);
    } else {
      ctx.save();
      ctx.scale(UNIT_VISUAL_SCALE, UNIT_VISUAL_SCALE);
      renderUnitPose(ctx, pose);
      ctx.restore();
    }
  } else {
    ctx.save();
    ctx.scale(UNIT_VISUAL_SCALE, UNIT_VISUAL_SCALE);
    renderUnitPose(ctx, pose);
    ctx.restore();
  }

  // Crisp cel-framed overhead HP bar when damaged
  if (unit.state !== 'dead' && unit.hp < unit.maxHp) {
    const barW = Math.max(30, Math.min(68, scaledW * 0.82));
    const barH = 5.5;
    const barY = -scaledH - 12;
    const ratio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));

    ctx.fillStyle = 'rgba(10, 14, 22, 0.88)';
    ctx.beginPath();
    ctx.roundRect(-barW / 2 - 1.5, barY - 1.5, barW + 3, barH + 3, 3);
    ctx.fill();

    ctx.fillStyle = unit.team === 'player' ? '#1d4ed8' : '#991b1b';
    ctx.fillRect(-barW / 2, barY, barW * ratio, barH);
    ctx.fillStyle = unit.team === 'player' ? '#60a5fa' : '#f87171';
    ctx.fillRect(-barW / 2, barY, barW * ratio, barH * 0.55);
  }

  ctx.restore();
}

/**
 * Draws a unit in logical unscaled pose units (scaled by UNIT_VISUAL_SCALE in-world,
 * or fitted dynamically in iconRenderer).
 */
export function renderUnitPose(ctx: CanvasRenderingContext2D, p: UnitPoseParams): void {
  const dir = p.team === 'player' ? 1 : -1;
  const tc = teamColors(p.team);

  ctx.save();
  ctx.scale(dir, 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (p.deathProgress > 0) {
    ctx.globalAlpha = Math.max(0, 1 - Math.pow(p.deathProgress, 1.35));
    const fallAngle = -Math.min(1, p.deathProgress * 1.45) * (Math.PI * 0.48);
    ctx.translate(-p.deathProgress * 14, p.deathProgress * 5);
    ctx.rotate(fallAngle);
  } else if (p.hitFlash > 0.05) {
    // Punchy knockback tilt on hit
    ctx.rotate(-p.hitFlash * 0.14);
    ctx.translate(-p.hitFlash * 2.2, 0);
  }

  const stride = Math.sin(p.walkPhase);
  const bob = p.isWalking ? Math.abs(Math.cos(p.walkPhase)) * 2.5 : 0;
  // Attack wave: quick pull-back windup then snappy strike follow-through
  const swing = p.attackAnim > 0 ? Math.sin(p.attackAnim * Math.PI) : 0;
  const lunge = p.attackAnim > 0 ? Math.sin(p.attackAnim * Math.PI) : 0;
  const walkLean = p.isWalking ? 0.08 : 0.02;

  switch (p.kind) {
    // =========================================================================
    // ERA 1: STONE AGE
    // =========================================================================
    case 'clubman':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean + lunge * 0.18, {
        skin: '#df9d6c',
        skinShade: '#b87242',
        torso: '#a6652e',
        torsoShade: '#6e3d16',
        torsoStyle: 'fur_pelt',
        legs: '#7c481f',
        boot: '#4b2a12',
        helm: 'caveman',
        backArmAngle: -0.2 + stride * 0.45,
        frontArmAngle: -0.55 - swing * 1.55,
        weapon: (c) => {
          // Knotted heavy prehistoric bone-studded war club
          c.fillStyle = '#7c461c';
          c.strokeStyle = INK;
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(-2, -2);
          c.lineTo(14, -5.5);
          c.quadraticCurveTo(23, -6.5, 24, 0);
          c.quadraticCurveTo(23, 6.5, 14, 5);
          c.lineTo(-2, 2);
          c.closePath();
          c.fill();
          // Cel shadow on underside
          c.fillStyle = '#4e290d';
          c.beginPath();
          c.moveTo(-1, 0);
          c.lineTo(23, 0);
          c.quadraticCurveTo(22, 6, 14, 4.8);
          c.lineTo(-1, 2);
          c.closePath();
          c.fill();
          c.stroke();
          // Bone spikes embedded in club head
          c.fillStyle = '#f8f5ec';
          c.beginPath();
          c.moveTo(15, -5);
          c.lineTo(17.5, -9.5);
          c.lineTo(20, -4.5);
          c.closePath();
          c.fill();
          c.stroke();
          // Specular highlight
          c.fillStyle = 'rgba(255,235,200,0.35)';
          c.fillRect(6, -3.5, 11, 1.6);
        },
      });
      break;

    case 'slinger':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean + lunge * 0.12, {
        skin: '#d99564',
        skinShade: '#ad6b3c',
        torso: '#b37a43',
        torsoShade: '#784c22',
        torsoStyle: 'fur_pelt',
        legs: '#80532a',
        boot: '#4a2e16',
        helm: 'headband',
        backArmAngle: 0.35 - stride * 0.3,
        frontArmAngle: -0.9 - swing * 1.35,
        weapon: (c) => {
          // Braided leather sling + spinning pouch & river stone
          c.strokeStyle = INK;
          c.lineWidth = 3.2;
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(9, -9, 17, 1);
          c.stroke();
          c.strokeStyle = '#a1622f';
          c.lineWidth = 1.6;
          c.stroke();
          // River stone
          celCircle(c, 17, 1, 3.8, '#9ca3af', '#4b5563', '#e5e7eb');
        },
      });
      break;

    case 'dino_rider':
      drawCelDinoRider(ctx, tc, stride, bob, swing);
      break;

    // =========================================================================
    // ERA 2: ANCIENT ERA
    // =========================================================================
    case 'spearman':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean + lunge * 0.16, {
        skin: '#e0a575',
        skinShade: '#b87a4b',
        torso: '#d49e42',
        torsoShade: '#8c601c',
        torsoStyle: 'cuirass',
        legs: '#966328',
        boot: '#8c5d20',
        cape: tc.primary,
        capeShade: tc.shade,
        helm: 'hoplite',
        shield: 'round_bronze',
        backArmAngle: -0.1,
        frontArmAngle: -0.12,
        weapon: (c) => {
          const thrust = swing * 13;
          // Long oak spear shaft
          celRect(c, -12 + thrust, -1.7, 40, 3.4, '#8b572a', '#593416', 1.4);
          // Bronze ferrule + leaf spearhead
          c.fillStyle = '#e2e8f0';
          c.strokeStyle = INK;
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(27 + thrust, -4.5);
          c.lineTo(41 + thrust, 0);
          c.lineTo(27 + thrust, 4.5);
          c.lineTo(30 + thrust, 0);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = '#ffffff';
          c.fillRect(29 + thrust, -1.6, 8, 1.2);
        },
      });
      break;

    case 'archer':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean - lunge * 0.08, {
        skin: '#e0a575',
        skinShade: '#b87a4b',
        torso: tc.primary,
        torsoShade: tc.shade,
        torsoStyle: 'tunic',
        legs: '#785738',
        boot: '#4a321d',
        backpack: 'quiver',
        helm: 'ancient_cap',
        backArmAngle: -0.25,
        frontArmAngle: -0.22 - swing * 0.15,
        weapon: (c) => {
          // Sculpted recurve wooden bow with bronze tips
          c.strokeStyle = INK;
          c.lineWidth = 4.6;
          c.beginPath();
          c.arc(6, 0, 13, -1.18, 1.18);
          c.stroke();
          c.strokeStyle = '#b47634';
          c.lineWidth = 2.4;
          c.stroke();
          // Drawn bowstring
          c.strokeStyle = '#f8fafc';
          c.lineWidth = 1.1;
          c.beginPath();
          c.moveTo(11, -12);
          c.lineTo(4 - swing * 6, 0);
          c.lineTo(11, 12);
          c.stroke();
          // Feathered arrow
          c.fillStyle = '#d97706';
          c.fillRect(4 - swing * 5, -1, 18, 2);
          c.fillStyle = '#e2e8f0';
          c.beginPath();
          c.moveTo(21 - swing * 5, -2.5);
          c.lineTo(26 - swing * 5, 0);
          c.lineTo(21 - swing * 5, 2.5);
          c.closePath();
          c.fill();
        },
      });
      break;

    case 'chariot':
      drawCelChariot(ctx, tc, p.walkPhase, stride, swing);
      break;

    // =========================================================================
    // ERA 3: MEDIEVAL ERA (4 units)
    // =========================================================================
    case 'knight':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean + lunge * 0.2, {
        skin: '#cbd5e1',
        skinShade: '#64748b',
        torso: '#b8c4d4',
        torsoShade: '#64748b',
        torsoStyle: 'plate',
        legs: '#7c8ca1',
        boot: '#475569',
        cape: tc.primary,
        capeShade: tc.shade,
        helm: 'knight',
        shield: 'kite',
        backArmAngle: -0.1,
        frontArmAngle: -0.6 - swing * 1.55,
        weapon: (c) => {
          // Knight's steel broadsword with gilded crossguard & fuller
          celRect(c, -2, -5.2, 3.6, 10.4, '#f59e0b', '#92400e', 1.4);
          c.fillStyle = '#f1f5f9';
          c.strokeStyle = INK;
          c.lineWidth = 1.7;
          c.beginPath();
          c.moveTo(1.5, -3);
          c.lineTo(25, -2);
          c.lineTo(31, 0);
          c.lineTo(25, 2);
          c.lineTo(1.5, 3);
          c.closePath();
          c.fill();
          // Blade lower bevel shade
          c.fillStyle = '#94a3b8';
          c.beginPath();
          c.moveTo(1.5, 0);
          c.lineTo(30, 0);
          c.lineTo(25, 2);
          c.lineTo(1.5, 3);
          c.closePath();
          c.fill();
          c.stroke();
        },
      });
      break;

    case 'crossbowman':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean - lunge * 0.06, {
        skin: '#e2b48d',
        skinShade: '#b8855c',
        torso: '#6c5643',
        torsoShade: '#423326',
        torsoStyle: 'brigandine',
        legs: '#4d4136',
        boot: '#2b231d',
        helm: 'kettle',
        backArmAngle: 0.15,
        frontArmAngle: -0.14 - swing * 0.2,
        weapon: (c) => {
          const recoil = -swing * 2.5;
          celRect(c, -4 + recoil, -2.4, 20, 4.8, '#8b572a', '#593416', 1.5);
          // Steel bow prod
          c.strokeStyle = INK;
          c.lineWidth = 4.4;
          c.beginPath();
          c.moveTo(13 + recoil, -8.5);
          c.quadraticCurveTo(18 + recoil, 0, 13 + recoil, 8.5);
          c.stroke();
          c.strokeStyle = '#cbd5e1';
          c.lineWidth = 2.1;
          c.stroke();
          // Steel bolt
          c.fillStyle = '#f8fafc';
          c.fillRect(10 + recoil, -1, 14, 2);
        },
      });
      break;

    case 'heavy_cavalry':
      drawCelHeavyCavalry(ctx, tc, stride, bob, swing);
      break;

    case 'catapult':
      drawCelCatapult(ctx, tc, p.walkPhase, swing);
      break;

    // =========================================================================
    // ERA 4: GUNPOWDER / EARLY MODERN
    // =========================================================================
    case 'pikeman':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean + lunge * 0.16, {
        skin: '#e2b58e',
        skinShade: '#b9865c',
        torso: '#94a3b8',
        torsoShade: '#475569',
        torsoStyle: 'plate',
        legs: tc.primary,
        boot: '#292524',
        helm: 'morion',
        backArmAngle: 0.12,
        frontArmAngle: -0.08,
        weapon: (c) => {
          const thrust = swing * 13;
          celRect(c, -16 + thrust, -1.6, 52, 3.2, '#784824', '#4a2b12', 1.3);
          // Red/blue pike tassel
          c.fillStyle = tc.primary;
          c.fillRect(32 + thrust, 1.5, 4, 5);
          // Steel halberd/pike head
          c.fillStyle = '#f8fafc';
          c.strokeStyle = INK;
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(36 + thrust, -4);
          c.lineTo(48 + thrust, 0);
          c.lineTo(36 + thrust, 4);
          c.closePath();
          c.fill();
          c.stroke();
        },
      });
      break;

    case 'musketeer':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean - lunge * 0.12, {
        skin: '#e2b58e',
        skinShade: '#b9865c',
        torso: tc.primary,
        torsoShade: tc.shade,
        torsoStyle: 'regiment',
        legs: '#e2e8f0',
        boot: '#1e293b',
        helm: 'tricorn',
        backArmAngle: 0.2,
        frontArmAngle: -0.1 - swing * 0.22,
        weapon: (c) => {
          const recoil = -swing * 4.5;
          celRect(c, -5 + recoil, -1.8, 19, 4.2, '#8b572a', '#593416', 1.4);
          celRect(c, 7 + recoil, -2.7, 23, 2.8, '#cbd5e1', '#64748b', 1.3);
          // Steel bayonet
          c.fillStyle = '#f8fafc';
          c.strokeStyle = INK;
          c.lineWidth = 1.1;
          c.beginPath();
          c.moveTo(27 + recoil, 0.2);
          c.lineTo(37 + recoil, 0.8);
          c.lineTo(27 + recoil, 2.2);
          c.closePath();
          c.fill();
          c.stroke();
          if (swing > 0.58) drawMuzzleStar(c, 33, -1.3, 8, '#fde047');
        },
      });
      break;

    case 'field_cannon':
      drawCelFieldCannon(ctx, tc, p.walkPhase, swing);
      break;

    // =========================================================================
    // ERA 5: WORLD WAR
    // =========================================================================
    case 'rifleman':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean - lunge * 0.1, {
        skin: '#e2b48b',
        skinShade: '#b68358',
        torso: '#62704a',
        torsoShade: '#3e472e',
        torsoStyle: 'trench',
        legs: '#4b543a',
        boot: '#26231d',
        helm: 'ww_helmet',
        backArmAngle: 0.15,
        frontArmAngle: -0.12 - swing * 0.18,
        weapon: (c) => {
          const recoil = -swing * 4;
          celRect(c, -5 + recoil, -1.8, 19, 4, '#7c4d25', '#4c2c12', 1.4);
          celRect(c, 8 + recoil, -2.5, 20, 2.6, '#475569', '#1e293b', 1.3);
          if (swing > 0.6) drawMuzzleStar(c, 30, -1.2, 7.5, '#fef08a');
        },
      });
      break;

    case 'flamethrower':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean + lunge * 0.08, {
        skin: '#94a3b8',
        skinShade: '#475569',
        torso: '#546141',
        torsoShade: '#343d27',
        torsoStyle: 'trench',
        legs: '#3f4732',
        boot: '#1e1b18',
        backpack: 'flame_tanks',
        helm: 'gasmask',
        backArmAngle: 0.2,
        frontArmAngle: -0.06,
        weapon: (c) => {
          celRect(c, -3, -2.6, 23, 5.2, '#475569', '#1e293b', 1.5);
          celRect(c, 19, -3.2, 6, 6.4, '#f59e0b', '#b45309', 1.4);
          // Igniter flame glow
          c.fillStyle = '#fde047';
          c.beginPath();
          c.arc(28, 0, 3.5 + swing * 5, 0, Math.PI * 2);
          c.fill();
        },
      });
      break;

    case 'early_tank':
      drawCelEarlyTank(ctx, tc, p.walkPhase, swing);
      break;

    // =========================================================================
    // ERA 6: MODERN ERA
    // =========================================================================
    case 'spec_ops':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean + 0.04 - lunge * 0.08, {
        skin: '#dba980',
        skinShade: '#ae7c54',
        torso: '#334155',
        torsoShade: '#1e293b',
        torsoStyle: 'tactical',
        legs: '#243040',
        boot: '#0f172a',
        helm: 'tactical',
        backArmAngle: 0.18,
        frontArmAngle: -0.1 - swing * 0.14,
        weapon: (c) => {
          const recoil = -swing * 3.2;
          celRect(c, -5 + recoil, -2.8, 25, 5, '#1f2937', '#0b0f17', 1.5);
          // Curved magazine & suppressor
          celRect(c, 7 + recoil, 2, 3.8, 6.5, '#475569', '#1e293b', 1.2);
          celRect(c, 20 + recoil, -2.2, 8, 3.4, '#334155', '#111827', 1.2);
          // Red-dot / holographic sight
          c.fillStyle = tc.glow;
          c.fillRect(6 + recoil, -4.8, 4.5, 2);
          if (swing > 0.5) drawMuzzleStar(c, 30, -0.5, 7, '#fde047');
        },
      });
      break;

    case 'at_rocket':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean - lunge * 0.16, {
        skin: '#dba980',
        skinShade: '#ae7c54',
        torso: '#475946',
        torsoShade: '#2c382c',
        torsoStyle: 'tactical',
        legs: '#313d31',
        boot: '#141914',
        helm: 'tactical',
        backArmAngle: -0.1,
        frontArmAngle: -0.35 - swing * 0.18,
        weapon: (c) => {
          const recoil = -swing * 5;
          // Heavy shoulder RPG / AT4 launcher tube
          celRect(c, -16 + recoil, -6.2, 36, 6.8, '#4d6440', '#2d3d25', 1.7);
          celRect(c, -19 + recoil, -7.4, 5, 9.2, '#1f2937', '#0f172a', 1.5);
          // Exposed conical warhead
          c.fillStyle = '#d97706';
          c.strokeStyle = INK;
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(20 + recoil, -6);
          c.lineTo(29 + recoil, -2.8);
          c.lineTo(20 + recoil, 0.5);
          c.closePath();
          c.fill();
          c.stroke();
          if (swing > 0.55) drawMuzzleStar(c, -21, -2.8, 8.5, '#fb923c');
        },
      });
      break;

    case 'mbt':
      drawCelMainBattleTank(ctx, tc, p.walkPhase, swing);
      break;

    // =========================================================================
    // ERA 7: FUTURE ERA
    // =========================================================================
    case 'cyborg':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean + 0.06 + lunge * 0.22, {
        skin: '#334155',
        skinShade: '#0f172a',
        torso: '#334155',
        torsoShade: '#0f172a',
        torsoStyle: 'exosuit',
        legs: '#1e293b',
        boot: '#090d16',
        helm: 'cyborg',
        shield: 'energy',
        backArmAngle: -0.2,
        frontArmAngle: -0.55 - swing * 1.55,
        weapon: (c) => {
          // Cybernetic hilt + blazing dual-tone plasma katana
          celRect(c, -3, -2.4, 8, 4.8, '#64748b', '#1e293b', 1.4);
          c.save();
          c.shadowColor = tc.glow;
          c.shadowBlur = 11;
          c.fillStyle = tc.glow;
          c.beginPath();
          c.moveTo(5, -3.2);
          c.lineTo(29, -1.4);
          c.lineTo(35, 0);
          c.lineTo(29, 1.4);
          c.lineTo(5, 3.2);
          c.closePath();
          c.fill();
          c.fillStyle = '#ffffff';
          c.fillRect(6, -1, 25, 2);
          c.restore();
        },
      });
      break;

    case 'railgun_sniper':
      drawCelHumanoid(ctx, tc, stride, bob, walkLean - lunge * 0.14, {
        skin: '#475569',
        skinShade: '#1e293b',
        torso: '#334155',
        torsoShade: '#0f172a',
        torsoStyle: 'exosuit',
        legs: '#1e293b',
        boot: '#090d16',
        cape: tc.shade,
        capeShade: '#090d16',
        helm: 'cyborg',
        backArmAngle: 0.12,
        frontArmAngle: -0.08 - swing * 0.16,
        weapon: (c) => {
          const recoil = -swing * 5.5;
          // Massive twin-rail electromagnetic rifle
          celRect(c, -8 + recoil, -4.2, 22, 7.6, '#334155', '#0f172a', 1.6);
          celRect(c, 12 + recoil, -4.8, 25, 2.5, '#cbd5e1', '#64748b', 1.3);
          celRect(c, 12 + recoil, 1.8, 25, 2.5, '#cbd5e1', '#64748b', 1.3);
          // Glowing plasma capacitor rail core
          c.save();
          c.shadowColor = tc.glow;
          c.shadowBlur = 9;
          c.fillStyle = tc.glow;
          c.fillRect(11 + recoil, -1.8, 25, 3.2);
          c.fillStyle = '#ffffff';
          c.fillRect(13 + recoil, -0.7, 22, 1.2);
          c.restore();
        },
      });
      break;

    case 'colossus_mech':
      drawCelColossusMech(ctx, tc, stride, bob, swing);
      break;
  }

  ctx.restore();
}

// =============================================================================
// CEL-SHADED DRAWING PRIMITIVES
// =============================================================================

function celRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  base: string,
  shade: string,
  outlineW = 1.8,
  radius = 1.5,
): void {
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();

  // Lower cel shadow band
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.roundRect(x, y + h * 0.56, w, h * 0.44, [0, 0, radius, radius]);
  ctx.fill();

  // Subtle upper rim highlight
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + 1.2, y + 1, Math.max(0, w - 2.4), Math.max(1, h * 0.18));

  ctx.strokeStyle = INK;
  ctx.lineWidth = outlineW;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();
}

function celCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  base: string,
  shade: string,
  highlight?: string,
  outlineW = 1.8,
): void {
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Crescent cel shadow on bottom-back
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy + r * 0.35, r * 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(cx + r * 0.22, cy - r * 0.24, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
  if (highlight) {
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(cx + r * 0.3, cy - r * 0.34, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = INK;
  ctx.lineWidth = outlineW;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawMuzzleStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : r * 0.38;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// =============================================================================
// CEL-SHADED HUMANOID RIG
// =============================================================================

interface HumanoidSpec {
  skin: string;
  skinShade: string;
  torso: string;
  torsoShade: string;
  torsoStyle: 'fur_pelt' | 'cuirass' | 'tunic' | 'plate' | 'brigandine' | 'regiment' | 'trench' | 'tactical' | 'exosuit';
  legs: string;
  boot: string;
  cape?: string;
  capeShade?: string;
  helm:
    | 'caveman'
    | 'headband'
    | 'hoplite'
    | 'ancient_cap'
    | 'knight'
    | 'kettle'
    | 'morion'
    | 'tricorn'
    | 'ww_helmet'
    | 'gasmask'
    | 'tactical'
    | 'cyborg';
  shield?: 'round_bronze' | 'kite' | 'energy';
  backpack?: 'flame_tanks' | 'quiver';
  backArmAngle: number;
  frontArmAngle: number;
  weapon: (ctx: CanvasRenderingContext2D) => void;
}

function drawCelHumanoid(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  stride: number,
  bob: number,
  torsoLean: number,
  spec: HumanoidSpec,
): void {
  const hipY = -16.5 - bob;

  // Back leg with boot
  ctx.save();
  ctx.translate(-2.4, hipY);
  ctx.rotate(-stride * 0.48);
  celRect(ctx, -3, 0, 5.8, 13, spec.legs, INK + '44', 1.7, 2);
  celRect(ctx, -3.2, 11.5, 7.6, 5, spec.boot, '#090d14', 1.6, 1.5);
  ctx.restore();

  // Front leg with knee plate & boot
  ctx.save();
  ctx.translate(2.4, hipY);
  ctx.rotate(stride * 0.48);
  celRect(ctx, -3, 0, 6.2, 13, spec.legs, INK + '44', 1.7, 2);
  celRect(ctx, -3.2, 11.5, 8.2, 5, spec.boot, '#090d14', 1.6, 1.5);
  ctx.restore();

  // Upper body pivots dynamically from hip!
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(torsoLean);
  const shoulderY = -16.5;

  // Fluttering multi-segment cape behind torso
  if (spec.cape) {
    const billow = stride * 2.5 + torsoLean * 14;
    ctx.fillStyle = spec.cape;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-4, shoulderY + 1);
    ctx.quadraticCurveTo(-15 - billow * 0.5, shoulderY + 12, -16 - billow, 10);
    ctx.lineTo(-5, 7);
    ctx.closePath();
    ctx.fill();
    // Cape fold shadow
    ctx.fillStyle = spec.capeShade ?? tc.shade;
    ctx.beginPath();
    ctx.moveTo(-5, shoulderY + 3);
    ctx.lineTo(-13 - billow * 0.7, 9);
    ctx.lineTo(-5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Backpacks (quiver or pressurized flame tanks)
  if (spec.backpack === 'flame_tanks') {
    celRect(ctx, -13.5, shoulderY + 0.5, 8.5, 16, '#d97706', '#92400e', 1.7, 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-12, shoulderY + 3, 5.5, 3);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, shoulderY + 16);
    ctx.quadraticCurveTo(-4, shoulderY + 20, 4, shoulderY + 10);
    ctx.stroke();
  } else if (spec.backpack === 'quiver') {
    ctx.save();
    ctx.translate(-8, shoulderY + 4);
    ctx.rotate(-0.35);
    celRect(ctx, -3, -5, 5.5, 14, '#784824', '#4a2b12', 1.5, 2);
    // Arrow fletchings sticking out
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-2.5, -8, 1.8, 3.5);
    ctx.fillRect(0.2, -8.5, 1.8, 4);
    ctx.restore();
  }

  // Sculpted Torso with era detail
  celRect(ctx, -7.2, shoulderY, 14.4, 17.5, spec.torso, spec.torsoShade, 1.9, 3.5);

  if (spec.torsoStyle === 'fur_pelt') {
    // Diagonal cave strap + leopard spots
    ctx.fillStyle = tc.primary;
    ctx.beginPath();
    ctx.moveTo(-6, shoulderY + 1);
    ctx.lineTo(-1, shoulderY + 1);
    ctx.lineTo(6, shoulderY + 14);
    ctx.lineTo(1, shoulderY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4a250d';
    ctx.fillRect(-4, shoulderY + 9, 2.5, 2.5);
    ctx.fillRect(2, shoulderY + 4, 2.2, 2.2);
  } else if (spec.torsoStyle === 'plate' || spec.torsoStyle === 'cuirass') {
    // Team tabard strip + metallic shoulder pauldron + waist belt
    ctx.fillStyle = tc.primary;
    ctx.fillRect(-3, shoulderY + 3, 6.5, 13);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-6.5, shoulderY + 12.5, 13, 2.4);
  } else if (spec.torsoStyle === 'regiment') {
    // Crisp white X-crossbelts & gold buttons
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5.5, shoulderY + 2);
    ctx.lineTo(5.5, shoulderY + 14);
    ctx.moveTo(5.5, shoulderY + 2);
    ctx.lineTo(-5.5, shoulderY + 14);
    ctx.stroke();
  } else if (spec.torsoStyle === 'trench' || spec.torsoStyle === 'tactical') {
    // Tactical plate carrier / webbing + team armband
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-5.5, shoulderY + 3, 11, 9);
    ctx.fillStyle = tc.primary;
    ctx.fillRect(-5.5, shoulderY + 5, 11, 2.8);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-5, shoulderY + 12.5, 4, 3);
    ctx.fillRect(1, shoulderY + 12.5, 4, 3);
  } else if (spec.torsoStyle === 'exosuit') {
    // Glowing chest energy core + segmented armor ribs
    ctx.fillStyle = tc.glow;
    ctx.beginPath();
    ctx.arc(2.2, shoulderY + 6.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2.5, shoulderY + 6.2, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Classic sash & belt
    ctx.fillStyle = tc.primary;
    ctx.fillRect(-6, shoulderY + 4.5, 12, 3.6);
    ctx.fillStyle = '#5c3415';
    ctx.fillRect(-6.5, shoulderY + 12.5, 13, 2.5);
  }

  // Head with cel shading & expressive eye/brow
  const headY = shoulderY - 6.8;
  celCircle(ctx, 0.8, headY, 6.2, spec.skin, spec.skinShade, 'rgba(255,255,255,0.2)', 1.8);
  if (spec.helm !== 'knight' && spec.helm !== 'gasmask' && spec.helm !== 'cyborg') {
    // Crisp determined eye dot
    ctx.fillStyle = INK;
    ctx.fillRect(3.4, headY - 1.2, 2, 2.2);
  }

  // Detailed Era Headgear
  drawCelHeadgear(ctx, 0.8, headY, spec.helm, tc);

  // Front Shoulder Pauldron + Arm + Weapon
  ctx.save();
  ctx.translate(2.2, shoulderY + 4.2);
  ctx.rotate(spec.frontArmAngle);
  celRect(ctx, -3, -3, 12, 5.4, spec.torso, spec.torsoShade, 1.6, 2.4);
  if (spec.torsoStyle === 'plate' || spec.torsoStyle === 'exosuit') {
    celCircle(ctx, -0.5, -1, 4.2, '#cbd5e1', '#64748b', '#ffffff', 1.6);
  }
  ctx.translate(9.5, 0);
  spec.weapon(ctx);
  ctx.restore();

  // Ornate Shield layered in front
  if (spec.shield === 'round_bronze') {
    ctx.save();
    ctx.fillStyle = '#d9a441';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(8.8, shoulderY + 9.5, 6.5, 11.2, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Team ring & central bronze boss
    ctx.strokeStyle = tc.primary;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(8.8, shoulderY + 9.5, 4.2, 7.6, 0.08, 0, Math.PI * 2);
    ctx.stroke();
    celCircle(ctx, 9.6, shoulderY + 9.5, 2.4, '#fef08a', '#b45309', undefined, 1.2);
    ctx.restore();
  } else if (spec.shield === 'kite') {
    ctx.save();
    ctx.fillStyle = tc.primary;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, shoulderY + 1);
    ctx.lineTo(14.5, shoulderY + 1);
    ctx.lineTo(13.5, shoulderY + 14.5);
    ctx.lineTo(9.2, shoulderY + 22);
    ctx.lineTo(4.8, shoulderY + 14.5);
    ctx.closePath();
    ctx.fill();
    // Heraldic metallic border & chevron
    ctx.fillStyle = tc.shade;
    ctx.beginPath();
    ctx.moveTo(9.2, shoulderY + 1);
    ctx.lineTo(14.5, shoulderY + 1);
    ctx.lineTo(13.5, shoulderY + 14.5);
    ctx.lineTo(9.2, shoulderY + 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(8.4, shoulderY + 3.5, 1.8, 14);
    ctx.fillRect(5.8, shoulderY + 7.5, 7, 1.8);
    ctx.restore();
  } else if (spec.shield === 'energy') {
    ctx.save();
    ctx.shadowColor = tc.glow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = tc.glow + '44';
    ctx.strokeStyle = tc.glow;
    ctx.lineWidth = 2.2;
    // Hexagonal hard-light energy buckler
    ctx.beginPath();
    ctx.moveTo(11, shoulderY - 3);
    ctx.lineTo(16, shoulderY + 3);
    ctx.lineTo(16, shoulderY + 16);
    ctx.lineTo(10, shoulderY + 22);
    ctx.lineTo(5.5, shoulderY + 16);
    ctx.lineTo(6, shoulderY + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawCelHeadgear(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  helm: HumanoidSpec['helm'],
  tc: TeamPalette,
): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;

  switch (helm) {
    case 'caveman':
      ctx.fillStyle = '#3d2211';
      ctx.beginPath();
      ctx.moveTo(hx - 6.5, hy);
      ctx.lineTo(hx - 8, hy - 5.5);
      ctx.lineTo(hx - 3, hy - 8.5);
      ctx.lineTo(hx + 2, hy - 9);
      ctx.lineTo(hx + 6.5, hy - 4);
      ctx.lineTo(hx + 4, hy - 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      celRect(ctx, hx - 6, hy - 4.5, 12, 2.8, tc.primary, tc.shade, 1.3);
      break;

    case 'headband':
      ctx.fillStyle = '#4a2914';
      ctx.beginPath();
      ctx.arc(hx - 1, hy - 2, 6.4, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.stroke();
      celRect(ctx, hx - 6.4, hy - 4, 12.8, 2.8, tc.highlight, tc.primary, 1.3);
      // Fluttering headband tails
      ctx.fillStyle = tc.primary;
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy - 3);
      ctx.lineTo(hx - 13, hy - 1);
      ctx.lineTo(hx - 11, hy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'hoplite':
      // Sweeping horsehair crest plume
      ctx.fillStyle = tc.primary;
      ctx.beginPath();
      ctx.moveTo(hx - 11, hy - 4);
      ctx.quadraticCurveTo(hx - 7, hy - 15.5, hx + 6, hy - 12);
      ctx.lineTo(hx + 4, hy - 7);
      ctx.quadraticCurveTo(hx - 4, hy - 9, hx - 8, hy - 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Bronze Corinthian helmet bowl + cheek guard
      ctx.fillStyle = '#e0ab43';
      ctx.beginPath();
      ctx.arc(hx, hy - 1, 6.8, Math.PI * 0.9, Math.PI * 2.15);
      ctx.lineTo(hx + 6, hy + 4);
      ctx.lineTo(hx + 2, hy + 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'ancient_cap':
      ctx.fillStyle = tc.primary;
      ctx.beginPath();
      ctx.moveTo(hx - 7, hy - 2);
      ctx.lineTo(hx + 1, hy - 10);
      ctx.lineTo(hx + 7.5, hy - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'knight':
      // Flowing heraldic plume
      ctx.fillStyle = tc.primary;
      ctx.beginPath();
      ctx.moveTo(hx - 2, hy - 7);
      ctx.quadraticCurveTo(hx - 12, hy - 15, hx - 13, hy - 4);
      ctx.lineTo(hx - 5, hy - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Visored steel great-helm
      celRect(ctx, hx - 6.6, hy - 7.5, 13.6, 13.6, '#d1dce8', '#64748b', 1.8, 3.5);
      ctx.fillStyle = INK;
      ctx.fillRect(hx + 0.5, hy - 2.4, 6.4, 2.4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(hx + 2.5, hy + 1.5, 3.5, 1.3);
      break;

    case 'kettle':
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 6.6, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      celRect(ctx, hx - 9.5, hy - 3.6, 19, 3.2, '#cbd5e1', '#64748b', 1.6, 1.4);
      break;

    case 'morion':
      // Sweeping Spanish morion comb + curved brim
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(hx, hy - 2.5, 7, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(hx - 10.5, hy - 1.5);
      ctx.quadraticCurveTo(hx, hy - 6, hx + 10.5, hy - 1.5);
      ctx.lineTo(hx + 8, hy + 1);
      ctx.lineTo(hx - 8, hy + 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'tricorn':
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(hx - 10.5, hy - 2.5);
      ctx.lineTo(hx - 1, hy - 11);
      ctx.lineTo(hx + 10.5, hy - 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(hx - 8, hy - 4.4, 16, 1.8);
      break;

    case 'ww_helmet':
      ctx.fillStyle = '#5c6b47';
      ctx.beginPath();
      ctx.arc(hx, hy - 1.5, 7.2, Math.PI * 0.88, Math.PI * 2.12);
      ctx.fill();
      ctx.stroke();
      celRect(ctx, hx - 8.4, hy - 2.8, 16.8, 2.6, '#4d593b', '#2e3623', 1.4, 1);
      break;

    case 'gasmask':
      celCircle(ctx, hx, hy - 1, 7, '#4c573c', '#2c3323', undefined, 1.8);
      // Glowing circular gas-mask lens + snout canister
      celCircle(ctx, hx + 3.2, hy - 1.8, 2.4, '#7dd3fc', '#0284c7', '#ffffff', 1.2);
      celRect(ctx, hx + 3, hy + 1, 5.8, 4.4, '#334155', '#0f172a', 1.4, 1.4);
      break;

    case 'tactical':
      ctx.fillStyle = '#273240';
      ctx.beginPath();
      ctx.arc(hx, hy - 1.8, 7, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      ctx.stroke();
      // Quad-lens NVG glowing optics
      celRect(ctx, hx + 2, hy - 4.2, 6, 3.6, '#0f172a', '#090d16', 1.3, 1);
      ctx.fillStyle = tc.glow;
      ctx.fillRect(hx + 4.4, hy - 3.4, 3.2, 2);
      break;

    case 'cyborg':
      celCircle(ctx, hx, hy - 0.5, 6.8, '#334155', '#0f172a', '#64748b', 1.8);
      ctx.save();
      ctx.shadowColor = tc.glow;
      ctx.shadowBlur = 7;
      ctx.fillStyle = tc.glow;
      ctx.beginPath();
      ctx.moveTo(hx + 0.5, hy - 3);
      ctx.lineTo(hx + 7.5, hy - 2);
      ctx.lineTo(hx + 6.5, hy + 1.2);
      ctx.lineTo(hx + 0.5, hy + 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
  }
}

// =============================================================================
// MOUNTED, SIEGE, ARMORED & TITAN CEL-SHADED RIGS
// =============================================================================

function drawCelDinoRider(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  stride: number,
  bob: number,
  swing: number,
): void {
  const y = -bob * 1.4;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;

  // Swaying striped dino tail
  ctx.fillStyle = '#4f853e';
  ctx.beginPath();
  ctx.moveTo(-10, -26 + y);
  ctx.quadraticCurveTo(-29, -30 + y, -37, -18 + y + stride * 3.5);
  ctx.quadraticCurveTo(-24, -15 + y, -10, -17 + y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Back muscular leg
  ctx.save();
  ctx.translate(-6, -19 + y);
  ctx.rotate(-stride * 0.52);
  celRect(ctx, -4, 0, 8, 17, '#3d6930', '#27451e', 1.8, 3);
  celRect(ctx, -3, 14.5, 10, 4.5, '#2d4e23', '#1a2e14', 1.6, 1.5);
  ctx.restore();

  // Sculpted raptor torso + tan underbelly + dark dorsal stripes
  ctx.fillStyle = '#5fa14a';
  ctx.beginPath();
  ctx.ellipse(2, -24 + y, 17.5, 10.5, -0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b4c97e';
  ctx.beginPath();
  ctx.ellipse(3, -18.5 + y, 13, 4.8, -0.14, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

  // Dorsal spine stripes
  ctx.fillStyle = '#2e5423';
  for (let s = -10; s <= 6; s += 6) {
    ctx.fillRect(s, -33 + y, 3.2, 5.5);
  }

  // Fierce snapping dinosaur head (lunges on attack!)
  const lunge = swing * 8;
  ctx.fillStyle = '#5fa14a';
  ctx.beginPath();
  ctx.moveTo(11, -29 + y);
  ctx.lineTo(26 + lunge, -40 + y);
  ctx.lineTo(33 + lunge, -33 + y);
  ctx.lineTo(24 + lunge, -29 + y);
  ctx.lineTo(31 + lunge, -26 + y + swing * 2.5);
  ctx.lineTo(15, -20 + y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fierce amber eye & jagged teeth
  ctx.fillStyle = '#facc15';
  ctx.fillRect(21 + lunge, -36 + y, 3, 2.8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(24 + lunge, -31.5 + y, 2, 2.4);
  ctx.fillRect(27.5 + lunge, -31 + y, 2, 2.2);

  // Front muscular leg with curved claw
  ctx.save();
  ctx.translate(4.5, -19 + y);
  ctx.rotate(stride * 0.52);
  celRect(ctx, -4, 0, 8.2, 17, '#5fa14a', '#3d6930', 1.8, 3);
  celRect(ctx, -3, 14.5, 10.5, 4.5, '#3d6930', '#1f3818', 1.6, 1.5);
  ctx.restore();

  // Leather saddle & Caveman Rider
  ctx.save();
  ctx.translate(-1, -29 + y);
  celRect(ctx, -8, -4, 15, 7, '#784824', '#4a2b12', 1.6, 2);
  celRect(ctx, -5.5, -17, 11, 14, tc.primary, tc.shade, 1.8, 3);
  celCircle(ctx, 0.5, -22, 5.2, '#df9d6c', '#b87242', undefined, 1.7);
  drawCelHeadgear(ctx, 0.5, -22, 'caveman', tc);
  // Bone-tipped thrusting spear
  const thrust = swing * 12;
  celRect(ctx, -8 + thrust, -13, 32, 3, '#784824', '#4a2b12', 1.4);
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(24 + thrust, -16);
  ctx.lineTo(34 + thrust, -11.5);
  ctx.lineTo(24 + thrust, -7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCelHorse(
  ctx: CanvasRenderingContext2D,
  coat: string,
  coatShade: string,
  saddle: string,
  stride: number,
  armored = false,
): void {
  const legs = [
    { x: -13, a: stride * 0.55, back: true },
    { x: -7, a: -stride * 0.45, back: false },
    { x: 8, a: -stride * 0.55, back: true },
    { x: 13.5, a: stride * 0.45, back: false },
  ];

  // Flowing horse tail
  ctx.fillStyle = '#1f2937';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-16, -26);
  ctx.quadraticCurveTo(-26, -23, -25 - stride * 2, -13);
  ctx.lineTo(-19, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Legs with hooves
  for (const leg of legs) {
    ctx.save();
    ctx.translate(leg.x, -18);
    ctx.rotate(leg.a);
    celRect(ctx, -2.6, 0, 5.2, 15.5, leg.back ? coatShade : coat, coatShade, 1.6, 2);
    ctx.fillStyle = '#111827';
    ctx.fillRect(-2.6, 14.5, 5.6, 3.4);
    ctx.restore();
  }

  // Sculpted horse barrel
  ctx.fillStyle = coat;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.ellipse(0, -24, 18.5, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = coatShade;
  ctx.beginPath();
  ctx.ellipse(0, -20.5, 16, 4.8, 0, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

  // Neck, mane & sculpted head
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(10, -29);
  ctx.lineTo(18, -43);
  ctx.lineTo(27.5, -36);
  ctx.lineTo(24.5, -31);
  ctx.lineTo(15, -21);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Armor chamfron & caparison drape
  if (armored) {
    celRect(ctx, -16, -29, 28, 12.5, saddle, INK + '66', 1.7, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-15, -19, 26, 2);
    celRect(ctx, 16, -42, 10, 6.5, '#cbd5e1', '#64748b', 1.5, 2);
  } else {
    celRect(ctx, -8, -32, 14, 9, saddle, INK + '55', 1.6, 2);
  }
}

function drawCelChariot(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  walkPhase: number,
  stride: number,
  swing: number,
): void {
  ctx.save();
  ctx.translate(18, 0);
  drawCelHorse(ctx, '#9c6633', '#6b421c', tc.primary, stride, false);
  ctx.restore();

  // Harness yoke beam
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.4;
  ctx.beginPath();
  ctx.moveTo(-7, -14);
  ctx.lineTo(15, -22);
  ctx.stroke();
  ctx.strokeStyle = '#925d2c';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Charioteer standing inside cab
  ctx.save();
  ctx.translate(-14, -26);
  celRect(ctx, -5, -13, 10, 12, '#d49e42', '#8c601c', 1.7, 2.5);
  celCircle(ctx, 0, -17.5, 5, '#e0a575', '#b87a4b', undefined, 1.6);
  drawCelHeadgear(ctx, 0, -17.5, 'hoplite', tc);
  // Long thrusting war-spear
  const thrust = swing * 13;
  celRect(ctx, -14 + thrust, -9, 38, 2.8, '#8b572a', '#4e2c12', 1.3);
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(24 + thrust, -11.5);
  ctx.lineTo(34 + thrust, -7.6);
  ctx.lineTo(24 + thrust, -3.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Ornate curved bronze chariot body
  ctx.fillStyle = '#d49e42';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-26, -12);
  ctx.lineTo(-3, -12);
  ctx.lineTo(1, -31);
  ctx.lineTo(-19, -29);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-21, -24, 18, 6);
  ctx.stroke();

  drawCelSpokedWheel(ctx, -14, -12, 12, walkPhase * 1.4, '#e0ab43');
}

function drawCelHeavyCavalry(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  stride: number,
  bob: number,
  swing: number,
): void {
  drawCelHorse(ctx, '#64748b', '#334155', tc.primary, stride, true);

  // Armored Knight lancer in saddle
  ctx.save();
  ctx.translate(-2, -32 - bob);
  celRect(ctx, -6.5, -16, 13, 16, '#b8c4d4', '#64748b', 1.8, 3);
  drawCelHeadgear(ctx, 0.5, -20, 'knight', tc);

  // Couched jousting lance with spiral banding & fluttering pennant
  const thrust = swing * 14;
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(-10 + thrust, -9.5);
  ctx.lineTo(42 + thrust, -11.5);
  ctx.lineTo(42 + thrust, -9.5);
  ctx.lineTo(-10 + thrust, -5.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Battle pennant near lance tip
  ctx.fillStyle = tc.primary;
  ctx.beginPath();
  ctx.moveTo(27 + thrust, -10.5);
  ctx.lineTo(14 + thrust, -5.5);
  ctx.lineTo(17 + thrust, -10.5);
  ctx.lineTo(14 + thrust, -15.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCelCatapult(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  walkPhase: number,
  swing: number,
): void {
  // Counterweight throwing arm pivoting dramatically
  ctx.save();
  ctx.translate(-4, -20);
  const armAngle = -2.2 + swing * 1.75;
  ctx.rotate(armAngle);
  celRect(ctx, -6, -3, 42, 6, '#925d2c', '#5c3818', 1.8, 2);
  // Iron-banded sling cup
  celCircle(ctx, 36, 0, 7.2, '#6b4226', '#3d2211', undefined, 1.8);
  if (swing < 0.45) {
    celCircle(ctx, 36, -2, 5.5, '#9ca3af', '#57534e', '#e7e5e4', 1.6);
  }
  ctx.restore();

  // Heavy bolted oak A-frame chassis
  celRect(ctx, -28, -17, 56, 8.5, '#7c4c24', '#4d2c12', 2, 2);
  ctx.fillStyle = '#8b572a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-17, -17);
  ctx.lineTo(3, -41);
  ctx.lineTo(11, -41);
  ctx.lineTo(20, -17);
  ctx.lineTo(12, -17);
  ctx.lineTo(6.5, -32);
  ctx.lineTo(-9, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Team heraldic crest & iron rivets
  celRect(ctx, -11, -17, 22, 7, tc.primary, tc.shade, 1.6, 1.5);
  drawCelSpokedWheel(ctx, -18, -10, 10, walkPhase, '#6b4226');
  drawCelSpokedWheel(ctx, 18, -10, 10, walkPhase, '#6b4226');
}

function drawCelFieldCannon(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  walkPhase: number,
  swing: number,
): void {
  const recoil = -swing * 6.5;

  // Artillery gunner crewman standing behind carriage
  ctx.save();
  ctx.translate(-22, 0);
  celRect(ctx, -4.5, -29, 9, 15, tc.primary, tc.shade, 1.6, 2.5);
  celRect(ctx, -4, -14, 3.6, 14, '#e2e8f0', '#94a3b8', 1.4, 1);
  celRect(ctx, 0.5, -14, 3.6, 14, '#e2e8f0', '#94a3b8', 1.4, 1);
  celCircle(ctx, 0.5, -34, 4.8, '#e2b58e', '#b9865c', undefined, 1.5);
  drawCelHeadgear(ctx, 0.5, -34, 'tricorn', tc);
  ctx.restore();

  // Oak trail carriage
  ctx.fillStyle = '#7c4c24';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-25, -4);
  ctx.lineTo(9, -22);
  ctx.lineTo(13, -15);
  ctx.lineTo(-17, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gleaming cel-shaded brass artillery barrel
  ctx.save();
  ctx.translate(recoil, 0);
  ctx.fillStyle = '#d4a037';
  ctx.beginPath();
  ctx.moveTo(-12, -26);
  ctx.lineTo(27, -30);
  ctx.lineTo(27, -19.5);
  ctx.lineTo(-12, -16);
  ctx.closePath();
  ctx.fill();
  // Barrel lower shadow + top specular shine
  ctx.fillStyle = '#8f6519';
  ctx.beginPath();
  ctx.moveTo(-12, -20.5);
  ctx.lineTo(27, -24);
  ctx.lineTo(27, -19.5);
  ctx.lineTo(-12, -16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,248,210,0.45)';
  ctx.fillRect(-6, -25.5, 28, 2.2);
  ctx.stroke();
  // Reinforced iron barrel rings & cascabel knob
  celCircle(ctx, -14, -21, 3.5, '#b48a3e', '#785116', undefined, 1.6);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-3, -26.5, 3.5, 10.5);
  ctx.fillRect(11, -28.5, 3.5, 10);
  if (swing > 0.55) drawMuzzleStar(ctx, 32, -25, 11, '#fde047');
  ctx.restore();

  drawCelSpokedWheel(ctx, 3, -14, 14, walkPhase, '#8b572a');
}

function drawCelEarlyTank(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  walkPhase: number,
  swing: number,
): void {
  const recoil = -swing * 5.5;

  // Heavy wraparound caterpillar tracks with animated tread cleats
  celRect(ctx, -36, -18, 72, 18, '#27303d', '#111827', 2.2, 8.5);
  // Animated track tread lugs
  const cleatShift = ((walkPhase * 4.5) % 8 + 8) % 8;
  ctx.fillStyle = '#475569';
  for (let cx = -30 + cleatShift; cx < 30; cx += 8) {
    ctx.fillRect(cx, -19.5, 4.2, 2.4);
    ctx.fillRect(cx, -1.2, 4.2, 2.4);
  }
  // Bogie roadwheels
  for (let i = -24; i <= 24; i += 12) {
    celCircle(ctx, i, -9, 5, '#64748b', '#334155', '#94a3b8', 1.6);
  }

  // Riveted sloped armored steel hull
  ctx.fillStyle = '#5a6b4b';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-32, -17);
  ctx.lineTo(-24, -33);
  ctx.lineTo(26, -33);
  ctx.lineTo(35, -17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3e4a33';
  ctx.beginPath();
  ctx.moveTo(-32, -17);
  ctx.lineTo(-28, -24);
  ctx.lineTo(31, -24);
  ctx.lineTo(35, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Team insignia panel & steel rivets
  celRect(ctx, -16, -29, 17, 7, tc.primary, tc.shade, 1.5, 1.5);
  ctx.fillStyle = '#94a3b8';
  for (let rx = -20; rx <= 22; rx += 10) {
    ctx.fillRect(rx, -31.5, 2, 2);
  }

  // Armored rotating cupola turret & recoiling cannon
  celRect(ctx, -15, -47, 30, 16, '#4c5b3f', '#313b29', 2, 4.5);
  celRect(ctx, -7, -51, 12, 4.5, '#3e4a33', '#252d1f', 1.5, 2);
  celRect(ctx, 13 + recoil, -41.5, 29, 5.4, '#334155', '#0f172a', 1.8, 1.5);
  if (swing > 0.6) drawMuzzleStar(ctx, 45, -39, 11, '#fb923c');
}

function drawCelMainBattleTank(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  walkPhase: number,
  swing: number,
): void {
  const recoil = -swing * 6.5;

  // High-speed caterpillar tracks + cleats
  celRect(ctx, -40, -17, 80, 17, '#18202c', '#090d14', 2.2, 7.5);
  const cleatShift = ((walkPhase * 5.5) % 9 + 9) % 9;
  ctx.fillStyle = '#475569';
  for (let cx = -34 + cleatShift; cx < 34; cx += 9) {
    ctx.fillRect(cx, -1.2, 4.8, 2.4);
  }
  for (let i = -29; i <= 29; i += 11.6) {
    celCircle(ctx, i, -8.5, 4.6, '#64748b', '#334155', undefined, 1.5);
  }

  // Explosive Reactive Armor (ERA) side skirt blocks
  celRect(ctx, -38, -23, 76, 10, '#475569', '#293548', 1.9, 2);
  ctx.fillStyle = '#334155';
  for (let i = -34; i < 32; i += 11) {
    ctx.fillRect(i, -21.5, 8.5, 7);
  }

  // Low-profile sloped composite glacis hull
  ctx.fillStyle = '#748499';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-38, -22);
  ctx.lineTo(-27, -33);
  ctx.lineTo(27, -33);
  ctx.lineTo(41, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Angular composite MBT turret
  ctx.fillStyle = '#5b6b80';
  ctx.beginPath();
  ctx.moveTo(-24, -33);
  ctx.lineTo(-17, -48);
  ctx.lineTo(15, -48);
  ctx.lineTo(27, -38);
  ctx.lineTo(20, -33);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3d4a5c';
  ctx.beginPath();
  ctx.moveTo(-24, -33);
  ctx.lineTo(-20, -39);
  ctx.lineTo(23, -39);
  ctx.lineTo(20, -33);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Team IFF panel, commander thermal optic & whip antenna
  celRect(ctx, -16, -44, 15, 6, tc.primary, tc.shade, 1.5, 1.5);
  celRect(ctx, 4, -52, 7, 4.5, '#1e293b', '#0f172a', 1.4, 1);
  ctx.fillStyle = tc.glow;
  ctx.fillRect(7.5, -51, 3, 2.4);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-18, -48);
  ctx.lineTo(-22, -65);
  ctx.stroke();

  // Smoothbore 120mm cannon with bore evacuator
  celRect(ctx, 19 + recoil, -42.5, 36, 5, '#334155', '#0f172a', 1.8, 1.5);
  celRect(ctx, 31 + recoil, -44.2, 10, 8.4, '#475569', '#1e293b', 1.6, 2);
  if (swing > 0.6) drawMuzzleStar(ctx, 58, -40, 12, '#fde047');
}

function drawCelColossusMech(
  ctx: CanvasRenderingContext2D,
  tc: TeamPalette,
  stride: number,
  bob: number,
  swing: number,
): void {
  const y = -bob * 1.8;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.1;

  // Back heavy hydraulic mech leg
  ctx.save();
  ctx.translate(-9, -40 + y);
  ctx.rotate(-stride * 0.34);
  celRect(ctx, -6, 0, 12, 23, '#334155', '#1e293b', 2, 3);
  celCircle(ctx, 0, 21, 5.2, '#64748b', '#1e293b', undefined, 1.8);
  celRect(ctx, -5, 21, 11, 18, '#475569', '#1e293b', 2, 2.5);
  celRect(ctx, -9, 34, 21, 7, '#1e293b', '#090d16', 2, 2);
  ctx.restore();

  // Front heavy hydraulic mech leg with glowing knee actuator
  ctx.save();
  ctx.translate(9, -40 + y);
  ctx.rotate(stride * 0.34);
  celRect(ctx, -6, 0, 13, 23, '#475569', '#1e293b', 2, 3);
  celCircle(ctx, 0.5, 21, 5.6, '#94a3b8', '#334155', '#ffffff', 1.8);
  ctx.fillStyle = tc.glow;
  ctx.beginPath();
  ctx.arc(0.5, 21, 2.2, 0, Math.PI * 2);
  ctx.fill();
  celRect(ctx, -5, 21, 12, 18, '#64748b', '#334155', 2, 2.5);
  celRect(ctx, -8, 34, 22, 7, '#334155', '#0f172a', 2, 2);
  ctx.restore();

  // Armored pelvis block
  celRect(ctx, -18, -46 + y, 36, 11, '#334155', '#0f172a', 2, 3);

  // Dorsal twin shoulder missile pods
  celRect(ctx, -27, -91 + y, 18, 16, '#1e293b', '#090d16', 2, 3);
  for (let my = -88; my <= -79; my += 4.5) {
    ctx.fillStyle = tc.highlight;
    ctx.fillRect(-13, my + y, 3.5, 3);
  }

  // Massive sculpted armored torso hull
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(-24, -45 + y);
  ctx.lineTo(-28, -77 + y);
  ctx.lineTo(19, -82 + y);
  ctx.lineTo(29, -58 + y);
  ctx.lineTo(20, -45 + y);
  ctx.closePath();
  ctx.fill();
  // Cel shadow bevel on bottom hull
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-24, -45 + y);
  ctx.lineTo(-26, -57 + y);
  ctx.lineTo(27, -57 + y);
  ctx.lineTo(20, -45 + y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Team armored chest chevron + glowing reactor visor cockpit
  celRect(ctx, -20, -71 + y, 25, 7, tc.primary, tc.shade, 1.7, 2);
  ctx.save();
  ctx.shadowColor = tc.glow;
  ctx.shadowBlur = 14;
  ctx.fillStyle = tc.glow;
  ctx.beginPath();
  ctx.moveTo(8, -74 + y);
  ctx.lineTo(25, -69 + y);
  ctx.lineTo(22, -60 + y);
  ctx.lineTo(8, -62 + y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, -70 + y, 11, 2.5);
  ctx.restore();

  // Dual heavy plasma arm cannons with glowing barrel coils
  const recoil = -swing * 6.5;
  celRect(ctx, 2 + recoil, -63 + y, 36, 13, '#334155', '#0f172a', 2.1, 3);
  ctx.save();
  ctx.shadowColor = tc.glow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = tc.glow;
  ctx.fillRect(14 + recoil, -60 + y, 23, 3);
  ctx.fillRect(14 + recoil, -55 + y, 23, 3);
  if (swing > 0.5) drawMuzzleStar(ctx, 41, -56.5 + y, 12, '#e0f2fe');
  ctx.restore();
}

function drawCelSpokedWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  woodColor: string,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  // Outer iron tire + wooden rim
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = woodColor;
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Spokes
  ctx.strokeStyle = woodColor;
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(a) * radius, -Math.sin(a) * radius);
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    ctx.stroke();
  }
  celCircle(ctx, 0, 0, 3.2, '#94a3b8', '#334155', undefined, 1.4);
  ctx.restore();
}
