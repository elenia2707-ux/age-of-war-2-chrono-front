import type { Team, UnitEntity, UnitVisualKind } from '../data/types';
import { GROUND_Y, UNIT_DEATH_DURATION } from '../game/constants';

export interface UnitPoseParams {
  kind: UnitVisualKind;
  team: Team;
  walkPhase: number;
  attackAnim: number; // 0..1 (1 at attack start, decays to 0)
  hitFlash: number;
  deathProgress: number; // 0 alive -> 1 faded
}

function teamColors(team: Team) {
  return team === 'player'
    ? {
        primary: '#2563eb',
        light: '#60a5fa',
        dark: '#1e3a8a',
        glow: '#38bdf8',
      }
    : {
        primary: '#dc2626',
        light: '#f87171',
        dark: '#7f1d1d',
        glow: '#fb7185',
      };
}

let hitFlashCanvas: HTMLCanvasElement | null = null;
let hitFlashCtx: CanvasRenderingContext2D | null = null;

function getHitFlashScratch(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  if (!hitFlashCanvas) {
    hitFlashCanvas = document.createElement('canvas');
    hitFlashCanvas.width = 180;
    hitFlashCanvas.height = 160;
    hitFlashCtx = hitFlashCanvas.getContext('2d');
  }
  if (!hitFlashCtx) return null;
  return { canvas: hitFlashCanvas, ctx: hitFlashCtx };
}

export function renderUnitEntity(ctx: CanvasRenderingContext2D, unit: UnitEntity): void {
  const deathProgress = unit.state === 'dead' ? Math.min(1, unit.deathTimer / UNIT_DEATH_DURATION) : 0;

  ctx.save();
  ctx.translate(unit.x, GROUND_Y);

  // Subtle ground contact shadow
  ctx.fillStyle = `rgba(0, 0, 0, ${(0.34 * (1 - deathProgress)).toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(0, 1, unit.def.width * 0.48, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const pose: UnitPoseParams = {
    kind: unit.def.id,
    team: unit.team,
    walkPhase: unit.state === 'walk' ? unit.walkPhase : 0,
    attackAnim: unit.attackAnim,
    hitFlash: unit.hitFlash,
    deathProgress,
  };

  if (unit.hitFlash > 0.05) {
    const scratch = getHitFlashScratch();
    if (scratch) {
      const { canvas: sc, ctx: sctx } = scratch;
      sctx.clearRect(0, 0, sc.width, sc.height);
      sctx.save();
      sctx.translate(90, 128);
      renderUnitPose(sctx, { ...pose, hitFlash: 0 });
      sctx.globalCompositeOperation = 'source-atop';
      sctx.fillStyle = `rgba(255, 255, 255, ${(unit.hitFlash * 0.72).toFixed(2)})`;
      sctx.fillRect(-90, -128, sc.width, sc.height);
      sctx.restore();
      ctx.drawImage(sc, -90, -128);
    } else {
      renderUnitPose(ctx, { ...pose, hitFlash: 0 });
    }
  } else {
    renderUnitPose(ctx, { ...pose, hitFlash: 0 });
  }

  // Compact overhead HP bar only when damaged & alive
  if (unit.state !== 'dead' && unit.hp < unit.maxHp) {
    const barW = Math.max(24, Math.min(54, unit.def.width * 0.85));
    const barH = 4.5;
    const barY = -unit.def.height - 10;
    const ratio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));

    ctx.fillStyle = 'rgba(10, 14, 22, 0.78)';
    ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = unit.team === 'player' ? '#38bdf8' : '#f87171';
    ctx.fillRect(-barW / 2, barY, barW * ratio, barH);
  }

  ctx.restore();
}

export function renderUnitPose(ctx: CanvasRenderingContext2D, p: UnitPoseParams): void {
  const dir = p.team === 'player' ? 1 : -1;
  const tc = teamColors(p.team);

  ctx.save();
  ctx.scale(dir, 1);

  if (p.deathProgress > 0) {
    ctx.globalAlpha = Math.max(0, 1 - p.deathProgress);
    const fallAngle = -Math.min(1, p.deathProgress * 1.45) * (Math.PI * 0.46);
    ctx.translate(-p.deathProgress * 12, p.deathProgress * 4);
    ctx.rotate(fallAngle);
  }

  const stride = Math.sin(p.walkPhase);
  const bob = Math.abs(Math.cos(p.walkPhase)) * 2.2;
  const swing = Math.sin(p.attackAnim * Math.PI); // peaks at 0.5

  switch (p.kind) {
    // -----------------------------------------------------------------------
    // ERA 1: STONE AGE
    // -----------------------------------------------------------------------
    case 'clubman':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#d99b6c',
        torso: '#8c5327',
        legs: '#6b3e1b',
        helm: 'caveman',
        backArmAngle: -0.3 + stride * 0.4,
        frontArmAngle: -0.4 - swing * 1.35,
        weapon: (c) => {
          // Knotted wooden club
          c.fillStyle = '#5c3415';
          c.beginPath();
          c.moveTo(0, -2);
          c.lineTo(18, -5);
          c.lineTo(22, 1);
          c.lineTo(16, 5);
          c.lineTo(0, 2);
          c.closePath();
          c.fill();
          c.fillStyle = '#8b5a2b';
          c.fillRect(14, -3, 4, 4);
        },
      });
      break;

    case 'slinger':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#d49464',
        torso: '#9c6c3b',
        legs: '#784e26',
        helm: 'headband',
        backArmAngle: 0.25,
        frontArmAngle: -0.8 - swing * 1.1,
        weapon: (c) => {
          c.strokeStyle = '#6b4226';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(10, -8, 16, 2);
          c.stroke();
          c.fillStyle = '#9ca3af';
          c.beginPath();
          c.arc(16, 2, 3.2, 0, Math.PI * 2);
          c.fill();
        },
      });
      break;

    case 'dino_rider':
      drawDinoRider(ctx, tc, stride, bob, swing);
      break;

    // -----------------------------------------------------------------------
    // ERA 2: ANCIENT ERA
    // -----------------------------------------------------------------------
    case 'spearman':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#d8a274',
        torso: '#b8863b',
        legs: '#8f5e24',
        cape: tc.primary,
        helm: 'hoplite',
        backArmAngle: -0.1,
        frontArmAngle: -0.15,
        shield: 'round_bronze',
        weapon: (c) => {
          const thrust = swing * 11;
          c.fillStyle = '#6e4522';
          c.fillRect(-10 + thrust, -1.5, 38, 3);
          c.fillStyle = '#e2e8f0';
          c.beginPath();
          c.moveTo(28 + thrust, -4);
          c.lineTo(38 + thrust, 0);
          c.lineTo(28 + thrust, 4);
          c.closePath();
          c.fill();
        },
      });
      break;

    case 'archer':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#d8a274',
        torso: tc.dark,
        legs: '#7c5c3b',
        helm: 'ancient_cap',
        backArmAngle: -0.2,
        frontArmAngle: -0.25 - swing * 0.2,
        weapon: (c) => {
          // Recurve bow
          c.strokeStyle = '#925d2c';
          c.lineWidth = 2.6;
          c.beginPath();
          c.arc(6, 0, 12, -1.15, 1.15);
          c.stroke();
          // Bowstring
          c.strokeStyle = '#e5e7eb';
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(11, -11);
          c.lineTo(5 - swing * 5, 0);
          c.lineTo(11, 11);
          c.stroke();
          // Nocked arrow
          c.fillStyle = '#d97706';
          c.fillRect(5 - swing * 4, -0.8, 17, 1.6);
        },
      });
      break;

    case 'chariot':
      drawChariot(ctx, tc, p.walkPhase, stride, swing);
      break;

    // -----------------------------------------------------------------------
    // ERA 3: MEDIEVAL ERA (4 units)
    // -----------------------------------------------------------------------
    case 'knight':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#cbd5e1',
        torso: '#94a3b8',
        legs: '#64748b',
        cape: tc.primary,
        helm: 'knight',
        backArmAngle: -0.1,
        frontArmAngle: -0.5 - swing * 1.45,
        shield: 'kite',
        weapon: (c) => {
          // Broadsword
          c.fillStyle = '#f59e0b';
          c.fillRect(-1, -4, 3, 8);
          c.fillStyle = '#f1f5f9';
          c.beginPath();
          c.moveTo(2, -2.5);
          c.lineTo(24, -1.5);
          c.lineTo(28, 0);
          c.lineTo(24, 1.5);
          c.lineTo(2, 2.5);
          c.closePath();
          c.fill();
        },
      });
      break;

    case 'crossbowman':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#dfb18c',
        torso: '#5c4938',
        legs: '#3f342a',
        helm: 'kettle',
        backArmAngle: 0.1,
        frontArmAngle: -0.15 - swing * 0.22,
        weapon: (c) => {
          // Crossbow stock + prod
          c.fillStyle = '#784824';
          c.fillRect(-3, -2, 18, 4);
          c.strokeStyle = '#94a3b8';
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(13, -7);
          c.quadraticCurveTo(17, 0, 13, 7);
          c.stroke();
          c.fillStyle = '#e2e8f0';
          c.fillRect(10, -1, 12, 1.8);
        },
      });
      break;

    case 'heavy_cavalry':
      drawHeavyCavalry(ctx, tc, stride, bob, swing);
      break;

    case 'catapult':
      drawCatapult(ctx, tc, p.walkPhase, swing);
      break;

    // -----------------------------------------------------------------------
    // ERA 4: GUNPOWDER / EARLY MODERN
    // -----------------------------------------------------------------------
    case 'pikeman':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#e0b38d',
        torso: '#64748b',
        legs: tc.dark,
        helm: 'morion',
        backArmAngle: 0.1,
        frontArmAngle: -0.1,
        weapon: (c) => {
          const thrust = swing * 12;
          c.fillStyle = '#6b4423';
          c.fillRect(-14 + thrust, -1.5, 50, 2.8);
          c.fillStyle = '#f8fafc';
          c.beginPath();
          c.moveTo(36 + thrust, -3.5);
          c.lineTo(46 + thrust, 0);
          c.lineTo(36 + thrust, 3.5);
          c.closePath();
          c.fill();
        },
      });
      break;

    case 'musketeer':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#e0b38d',
        torso: tc.primary,
        legs: '#e2e8f0',
        helm: 'tricorn',
        backArmAngle: 0.15,
        frontArmAngle: -0.12 - swing * 0.18,
        weapon: (c) => {
          const recoil = -swing * 4;
          c.fillStyle = '#7c4a21';
          c.fillRect(-4 + recoil, -1.5, 18, 3.8);
          c.fillStyle = '#94a3b8';
          c.fillRect(6 + recoil, -2.2, 22, 2.2);
          // Bayonet
          c.fillStyle = '#e2e8f0';
          c.fillRect(26 + recoil, 0, 8, 1.5);
          if (swing > 0.65) {
            c.fillStyle = '#fde047';
            c.beginPath();
            c.arc(31, -1, 5.5, 0, Math.PI * 2);
            c.fill();
          }
        },
      });
      break;

    case 'field_cannon':
      drawFieldCannon(ctx, tc, p.walkPhase, swing);
      break;

    // -----------------------------------------------------------------------
    // ERA 5: WORLD WAR
    // -----------------------------------------------------------------------
    case 'rifleman':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#dfb18b',
        torso: '#556142',
        legs: '#3f4732',
        helm: 'ww_helmet',
        backArmAngle: 0.12,
        frontArmAngle: -0.14 - swing * 0.16,
        weapon: (c) => {
          const recoil = -swing * 3.5;
          c.fillStyle = '#6c4727';
          c.fillRect(-4 + recoil, -1.5, 17, 3.5);
          c.fillStyle = '#334155';
          c.fillRect(8 + recoil, -2, 18, 2.2);
          if (swing > 0.65) {
            c.fillStyle = '#fef08a';
            c.beginPath();
            c.arc(28, -1, 5, 0, Math.PI * 2);
            c.fill();
          }
        },
      });
      break;

    case 'flamethrower':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#94a3b8',
        torso: '#4b553b',
        legs: '#353d2a',
        helm: 'gasmask',
        backpack: 'flame_tanks',
        backArmAngle: 0.2,
        frontArmAngle: -0.08,
        weapon: (c) => {
          c.fillStyle = '#334155';
          c.fillRect(-2, -2, 22, 4);
          c.fillStyle = '#f97316';
          c.fillRect(20, -2.5, 5, 5);
          if (swing > 0.2) {
            c.fillStyle = '#fde047';
            c.beginPath();
            c.arc(27, 0, 5 + swing * 4, 0, Math.PI * 2);
            c.fill();
          }
        },
      });
      break;

    case 'early_tank':
      drawEarlyTank(ctx, tc, p.walkPhase, swing);
      break;

    // -----------------------------------------------------------------------
    // ERA 6: MODERN ERA
    // -----------------------------------------------------------------------
    case 'spec_ops':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#d9ad86',
        torso: '#273240',
        legs: '#1c242e',
        helm: 'tactical',
        backArmAngle: 0.15,
        frontArmAngle: -0.12 - swing * 0.12,
        weapon: (c) => {
          const recoil = -swing * 3;
          c.fillStyle = '#111827';
          c.fillRect(-4 + recoil, -2.4, 24, 4.4);
          c.fillStyle = '#475569';
          c.fillRect(7 + recoil, 2, 3, 5); // Magazine
          c.fillStyle = tc.glow;
          c.fillRect(6 + recoil, -4.2, 4, 1.8); // Sight
          if (swing > 0.55) {
            c.fillStyle = '#fde047';
            c.beginPath();
            c.arc(23, -0.5, 5, 0, Math.PI * 2);
            c.fill();
          }
        },
      });
      break;

    case 'at_rocket':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#d9ad86',
        torso: '#3a473a',
        legs: '#293329',
        helm: 'tactical',
        backArmAngle: -0.1,
        frontArmAngle: -0.35 - swing * 0.16,
        weapon: (c) => {
          const recoil = -swing * 4.5;
          // Shoulder-mounted rocket launcher tube
          c.fillStyle = '#3f5334';
          c.fillRect(-14 + recoil, -5.5, 34, 6);
          c.fillStyle = '#1f2937';
          c.fillRect(-16 + recoil, -6.5, 4, 8);
          c.fillStyle = '#d97706';
          c.beginPath();
          c.moveTo(20 + recoil, -5);
          c.lineTo(27 + recoil, -2.5);
          c.lineTo(20 + recoil, 0);
          c.closePath();
          c.fill();
        },
      });
      break;

    case 'mbt':
      drawMainBattleTank(ctx, tc, p.walkPhase, swing);
      break;

    // -----------------------------------------------------------------------
    // ERA 7: FUTURE ERA
    // -----------------------------------------------------------------------
    case 'cyborg':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#334155',
        torso: '#1e293b',
        legs: '#0f172a',
        helm: 'cyborg',
        shield: 'energy',
        backArmAngle: -0.15,
        frontArmAngle: -0.5 - swing * 1.4,
        weapon: (c) => {
          // Glowing plasma energy blade
          c.fillStyle = '#475569';
          c.fillRect(-2, -2, 6, 4);
          c.shadowColor = tc.glow;
          c.shadowBlur = 8;
          c.fillStyle = tc.glow;
          c.beginPath();
          c.moveTo(4, -2.5);
          c.lineTo(27, -1);
          c.lineTo(31, 0);
          c.lineTo(27, 1);
          c.lineTo(4, 2.5);
          c.closePath();
          c.fill();
          c.fillStyle = '#ffffff';
          c.fillRect(5, -0.7, 22, 1.4);
          c.shadowBlur = 0;
        },
      });
      break;

    case 'railgun_sniper':
      drawHumanoid(ctx, tc, stride, bob, {
        skin: '#475569',
        torso: '#1e293b',
        legs: '#0f172a',
        helm: 'cyborg',
        backArmAngle: 0.1,
        frontArmAngle: -0.1 - swing * 0.15,
        weapon: (c) => {
          const recoil = -swing * 5;
          c.fillStyle = '#0f172a';
          c.fillRect(-6 + recoil, -3.5, 36, 6);
          c.fillStyle = '#94a3b8';
          c.fillRect(10 + recoil, -4, 24, 2);
          c.fillRect(10 + recoil, 1.5, 24, 2);
          // Charged capacitor glow
          c.fillStyle = tc.glow;
          c.fillRect(12 + recoil, -1.3, 21, 2.2);
        },
      });
      break;

    case 'colossus_mech':
      drawColossusMech(ctx, tc, stride, bob, swing);
      break;
  }

  ctx.restore();
}

interface HumanoidSpec {
  skin: string;
  torso: string;
  legs: string;
  cape?: string;
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
  backpack?: 'flame_tanks';
  backArmAngle: number;
  frontArmAngle: number;
  weapon: (ctx: CanvasRenderingContext2D) => void;
}

function drawHumanoid(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  stride: number,
  bob: number,
  spec: HumanoidSpec,
): void {
  const hipY = -16 - bob;
  const shoulderY = -31 - bob;

  // Optional cape fluttering behind
  if (spec.cape) {
    ctx.fillStyle = spec.cape;
    ctx.beginPath();
    ctx.moveTo(-4, shoulderY + 1);
    ctx.lineTo(-14 - stride * 2, hipY + 10);
    ctx.lineTo(-4, hipY + 6);
    ctx.closePath();
    ctx.fill();
  }

  // Optional flamethrower tanks
  if (spec.backpack === 'flame_tanks') {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-12, shoulderY + 1, 7, 15);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-11, shoulderY + 3, 2, 11);
  }

  // Back leg
  ctx.save();
  ctx.translate(-2, hipY);
  ctx.rotate(-stride * 0.45);
  ctx.fillStyle = spec.legs;
  ctx.fillRect(-2.8, 0, 5.4, 16);
  ctx.restore();

  // Front leg
  ctx.save();
  ctx.translate(2, hipY);
  ctx.rotate(stride * 0.45);
  ctx.fillStyle = spec.legs;
  ctx.fillRect(-2.8, 0, 5.6, 16);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-2.8, 13, 6.8, 3.5);
  ctx.restore();

  // Torso
  ctx.fillStyle = spec.torso;
  ctx.beginPath();
  ctx.roundRect(-6.5, shoulderY, 13, 17, 3);
  ctx.fill();
  // Team sash / chest trim
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-5.5, shoulderY + 4, 11, 3.5);

  // Head
  const headY = shoulderY - 6.5;
  ctx.fillStyle = spec.skin;
  ctx.beginPath();
  ctx.arc(0.5, headY, 5.8, 0, Math.PI * 2);
  ctx.fill();

  // Era headgear
  drawHeadgear(ctx, 0.5, headY, spec.helm, tc);

  // Front arm & weapon
  ctx.save();
  ctx.translate(2, shoulderY + 4);
  ctx.rotate(spec.frontArmAngle);
  ctx.fillStyle = spec.torso;
  ctx.fillRect(-2.5, -2.5, 11, 4.5);
  ctx.translate(9, 0);
  spec.weapon(ctx);
  ctx.restore();

  // Optional Shield
  if (spec.shield === 'round_bronze') {
    ctx.fillStyle = '#d4a037';
    ctx.strokeStyle = tc.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(8, shoulderY + 9, 5.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (spec.shield === 'kite') {
    ctx.fillStyle = tc.primary;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, shoulderY + 2);
    ctx.lineTo(13, shoulderY + 2);
    ctx.lineTo(12, shoulderY + 14);
    ctx.lineTo(8.5, shoulderY + 20);
    ctx.lineTo(4.5, shoulderY + 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (spec.shield === 'energy') {
    ctx.fillStyle = tc.glow + '55';
    ctx.strokeStyle = tc.glow;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(10, shoulderY + 9, 4.5, 12, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawHeadgear(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  helm: HumanoidSpec['helm'],
  tc: ReturnType<typeof teamColors>,
): void {
  switch (helm) {
    case 'caveman':
      ctx.fillStyle = '#3b2314';
      ctx.beginPath();
      ctx.arc(hx - 1, hy - 2, 6.2, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      ctx.fillStyle = tc.primary;
      ctx.fillRect(hx - 5.5, hy - 4, 11, 2.2);
      break;
    case 'headband':
      ctx.fillStyle = '#4a2c16';
      ctx.beginPath();
      ctx.arc(hx - 1, hy - 2.5, 5.8, Math.PI, Math.PI * 2.1);
      ctx.fill();
      ctx.fillStyle = tc.light;
      ctx.fillRect(hx - 6, hy - 3.5, 12, 2.5);
      break;
    case 'hoplite':
      ctx.fillStyle = '#d4a037';
      ctx.beginPath();
      ctx.arc(hx, hy - 1, 6.4, Math.PI, Math.PI * 2);
      ctx.fill();
      // Crest plume
      ctx.fillStyle = tc.primary;
      ctx.beginPath();
      ctx.ellipse(hx - 1, hy - 9, 7, 3.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ancient_cap':
      ctx.fillStyle = tc.primary;
      ctx.beginPath();
      ctx.moveTo(hx - 6, hy - 2);
      ctx.lineTo(hx + 2, hy - 9);
      ctx.lineTo(hx + 7, hy - 2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'knight':
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.roundRect(hx - 6, hy - 7, 12.5, 12.5, 3);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hx + 1, hy - 2, 5.5, 2.2);
      ctx.fillStyle = tc.primary;
      ctx.beginPath();
      ctx.moveTo(hx - 2, hy - 7);
      ctx.lineTo(hx - 10, hy - 13);
      ctx.lineTo(hx - 5, hy - 5);
      ctx.closePath();
      ctx.fill();
      break;
    case 'kettle':
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 6, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(hx - 8.5, hy - 3, 17, 2.4);
      break;
    case 'morion':
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(hx, hy - 2, 6, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 9, hy - 2);
      ctx.quadraticCurveTo(hx, hy - 6, hx + 9, hy - 2);
      ctx.lineTo(hx + 7, hy);
      ctx.lineTo(hx - 7, hy);
      ctx.closePath();
      ctx.fill();
      break;
    case 'tricorn':
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(hx - 9, hy - 3);
      ctx.lineTo(hx, hy - 10);
      ctx.lineTo(hx + 9, hy - 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(hx - 7, hy - 4.2, 14, 1.5);
      break;
    case 'ww_helmet':
      ctx.fillStyle = '#4f5d3c';
      ctx.beginPath();
      ctx.arc(hx, hy - 1.5, 6.8, Math.PI * 0.92, Math.PI * 2.08);
      ctx.fill();
      ctx.fillRect(hx - 7.5, hy - 2.5, 15, 2);
      break;
    case 'gasmask':
      ctx.fillStyle = '#3f4732';
      ctx.beginPath();
      ctx.arc(hx, hy - 1, 6.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(hx + 1.5, hy - 2.5, 4, 2.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hx + 3, hy + 1, 4.5, 3.5);
      break;
    case 'tactical':
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(hx, hy - 1.5, 6.6, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      // NVG goggles glow
      ctx.fillStyle = tc.glow;
      ctx.fillRect(hx + 2, hy - 3, 5, 2.6);
      break;
    case 'cyborg':
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(hx, hy - 0.5, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tc.glow;
      ctx.fillRect(hx + 0.5, hy - 2.5, 6.5, 3);
      break;
  }
}

function drawDinoRider(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  stride: number,
  bob: number,
  swing: number,
): void {
  const y = -bob * 1.4;
  // Swaying dino tail
  ctx.fillStyle = '#4d7c3f';
  ctx.beginPath();
  ctx.moveTo(-10, -24 + y);
  ctx.quadraticCurveTo(-28, -28 + y, -34, -18 + y + stride * 3);
  ctx.lineTo(-10, -16 + y);
  ctx.closePath();
  ctx.fill();

  // Back dino leg
  ctx.save();
  ctx.translate(-5, -18 + y);
  ctx.rotate(-stride * 0.55);
  ctx.fillStyle = '#3f6232';
  ctx.fillRect(-3.5, 0, 7, 18);
  ctx.restore();

  // Dino torso & neck & fierce jaw
  ctx.fillStyle = '#5c9149';
  ctx.beginPath();
  ctx.ellipse(2, -23 + y, 16, 9, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Dino head (lunges forward on attack!)
  const lunge = swing * 7;
  ctx.beginPath();
  ctx.moveTo(11, -27 + y);
  ctx.lineTo(25 + lunge, -36 + y);
  ctx.lineTo(29 + lunge, -29 + y);
  ctx.lineTo(15, -20 + y);
  ctx.closePath();
  ctx.fill();
  // Teeth & eye
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(19 + lunge, -34 + y, 2.5, 2.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(23 + lunge, -30 + y, 4, 2);

  // Front dino leg
  ctx.save();
  ctx.translate(4, -18 + y);
  ctx.rotate(stride * 0.55);
  ctx.fillStyle = '#5c9149';
  ctx.fillRect(-3.5, 0, 7.5, 18);
  ctx.fillStyle = '#2e4724';
  ctx.fillRect(-3, 15, 9, 3.5);
  ctx.restore();

  // Rider on dino back
  ctx.save();
  ctx.translate(-1, -26 + y);
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-5, -14, 10, 12);
  ctx.fillStyle = '#d99b6c';
  ctx.beginPath();
  ctx.arc(0, -19, 4.8, 0, Math.PI * 2);
  ctx.fill();
  // Bone spear
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(-6 + swing * 10, -12, 30, 2.5);
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(24 + swing * 10, -14.5);
  ctx.lineTo(32 + swing * 10, -10.8);
  ctx.lineTo(24 + swing * 10, -7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawChariot(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  walkPhase: number,
  stride: number,
  swing: number,
): void {
  // Warhorse in front
  ctx.save();
  ctx.translate(16, 0);
  drawHorseBody(ctx, '#8b5a2b', tc.primary, stride);
  ctx.restore();

  // Harness shaft
  ctx.strokeStyle = '#784824';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-8, -14);
  ctx.lineTo(14, -20);
  ctx.stroke();

  // Chariot cab
  ctx.fillStyle = '#b8863b';
  ctx.beginPath();
  ctx.moveTo(-24, -12);
  ctx.lineTo(-4, -12);
  ctx.lineTo(-1, -29);
  ctx.lineTo(-18, -28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-20, -24, 16, 5);

  // Charioteer inside cab
  ctx.fillStyle = '#d8a274';
  ctx.beginPath();
  ctx.arc(-13, -38, 4.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4a037';
  ctx.beginPath();
  ctx.arc(-13, -39, 5.2, Math.PI, Math.PI * 2);
  ctx.fill();
  // Thrusting spear
  ctx.fillStyle = '#784824';
  ctx.fillRect(-16 + swing * 12, -32, 34, 2.5);
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(18 + swing * 12, -34.5);
  ctx.lineTo(26 + swing * 12, -30.8);
  ctx.lineTo(18 + swing * 12, -27);
  ctx.closePath();
  ctx.fill();

  // Spinning bronze spoked wheel
  drawSpokedWheel(ctx, -14, -11, 11, walkPhase * 1.4, '#d4a037');
}

function drawHeavyCavalry(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  stride: number,
  bob: number,
  swing: number,
): void {
  drawHorseBody(ctx, '#475569', tc.primary, stride);
  // Barding steel armor drape
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-14, -28 - bob * 0.5, 24, 12);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(8, -36 - bob * 0.5, 10, 6); // Horse chanfron

  // Armored Knight rider
  ctx.save();
  ctx.translate(-2, -31 - bob);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-6, -15, 12, 15);
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.roundRect(-5, -24, 10, 10, 2);
  ctx.fill();
  ctx.fillStyle = tc.primary;
  ctx.beginPath();
  ctx.moveTo(-3, -24);
  ctx.lineTo(-12, -29);
  ctx.lineTo(-6, -21);
  ctx.closePath();
  ctx.fill();

  // Couched jousting lance with pennant
  const thrust = swing * 12;
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(-8 + thrust, -9);
  ctx.lineTo(38 + thrust, -11);
  ctx.lineTo(38 + thrust, -9.2);
  ctx.lineTo(-8 + thrust, -5.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tc.light;
  ctx.beginPath();
  ctx.moveTo(22 + thrust, -10);
  ctx.lineTo(14 + thrust, -5);
  ctx.lineTo(14 + thrust, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHorseBody(
  ctx: CanvasRenderingContext2D,
  coat: string,
  saddleColor: string,
  stride: number,
): void {
  // Legs
  const legs = [
    { x: -12, a: stride * 0.55 },
    { x: -7, a: -stride * 0.45 },
    { x: 8, a: -stride * 0.55 },
    { x: 13, a: stride * 0.45 },
  ];
  ctx.fillStyle = coat;
  for (const leg of legs) {
    ctx.save();
    ctx.translate(leg.x, -17);
    ctx.rotate(leg.a);
    ctx.fillRect(-2.2, 0, 4.4, 17);
    ctx.restore();
  }
  // Body
  ctx.beginPath();
  ctx.ellipse(0, -23, 17, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Neck & head
  ctx.beginPath();
  ctx.moveTo(10, -27);
  ctx.lineTo(18, -40);
  ctx.lineTo(25, -34);
  ctx.lineTo(22, -30);
  ctx.lineTo(14, -20);
  ctx.closePath();
  ctx.fill();
  // Saddle cloth
  ctx.fillStyle = saddleColor;
  ctx.fillRect(-7, -30, 12, 8);
}

function drawCatapult(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  walkPhase: number,
  swing: number,
): void {
  // Throwing arm pivots forward when firing!
  ctx.save();
  ctx.translate(-4, -18);
  const armAngle = -2.15 + swing * 1.65;
  ctx.rotate(armAngle);
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(0, -2.5, 34, 5);
  // Cup & boulder
  ctx.fillStyle = '#5c3a1d';
  ctx.beginPath();
  ctx.arc(34, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();
  if (swing < 0.45) {
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.arc(34, -2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Heavy timber A-frame
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(-26, -16, 52, 7);
  ctx.beginPath();
  ctx.moveTo(-16, -16);
  ctx.lineTo(4, -38);
  ctx.lineTo(10, -38);
  ctx.lineTo(18, -16);
  ctx.lineTo(11, -16);
  ctx.lineTo(6, -30);
  ctx.lineTo(-9, -16);
  ctx.closePath();
  ctx.fill();

  // Team heraldry plate
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-10, -16, 20, 6);

  drawSpokedWheel(ctx, -17, -9, 9, walkPhase, '#5c3a1d');
  drawSpokedWheel(ctx, 17, -9, 9, walkPhase, '#5c3a1d');
}

function drawFieldCannon(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  walkPhase: number,
  swing: number,
): void {
  const recoil = -swing * 6;
  // Wooden trail carriage
  ctx.fillStyle = '#6b4226';
  ctx.beginPath();
  ctx.moveTo(-26, -4);
  ctx.lineTo(8, -20);
  ctx.lineTo(12, -14);
  ctx.lineTo(-18, -2);
  ctx.closePath();
  ctx.fill();

  // Polished brass cannon barrel
  ctx.save();
  ctx.translate(recoil, 0);
  ctx.fillStyle = '#b48a3e';
  ctx.beginPath();
  ctx.moveTo(-10, -24);
  ctx.lineTo(24, -28);
  ctx.lineTo(24, -19);
  ctx.lineTo(-10, -15);
  ctx.closePath();
  ctx.fill();
  // Reinforced iron bands
  ctx.fillStyle = '#334155';
  ctx.fillRect(-4, -24, 3, 9);
  ctx.fillRect(10, -26, 3, 8);
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-10, -22, 6, 5);
  if (swing > 0.6) {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(28, -23.5, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawSpokedWheel(ctx, 2, -13, 13, walkPhase, '#784824');
}

function drawEarlyTank(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  walkPhase: number,
  swing: number,
): void {
  const recoil = -swing * 5;
  // Armored caterpillar tracks
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.roundRect(-34, -17, 68, 17, 8);
  ctx.fill();

  // Animated track rollers
  ctx.fillStyle = '#64748b';
  for (let i = -24; i <= 24; i += 12) {
    const rot = walkPhase * 1.8;
    ctx.beginPath();
    ctx.arc(i, -8.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(i - Math.cos(rot) * 3.5, -8.5 - Math.sin(rot) * 3.5);
    ctx.lineTo(i + Math.cos(rot) * 3.5, -8.5 + Math.sin(rot) * 3.5);
    ctx.stroke();
  }

  // Riveted olive steel hull
  ctx.fillStyle = '#4e5d42';
  ctx.beginPath();
  ctx.moveTo(-30, -16);
  ctx.lineTo(-22, -31);
  ctx.lineTo(24, -31);
  ctx.lineTo(32, -16);
  ctx.closePath();
  ctx.fill();

  // Team insignia stripe
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-14, -27, 16, 6);

  // Turret & gun barrel
  ctx.fillStyle = '#3f4c35';
  ctx.beginPath();
  ctx.roundRect(-14, -44, 28, 15, 4);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(12 + recoil, -39, 27, 4.5);
  if (swing > 0.65) {
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.arc(42, -36.8, 7.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMainBattleTank(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  walkPhase: number,
  swing: number,
): void {
  const recoil = -swing * 6;
  // Treads
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.roundRect(-38, -16, 76, 16, 7);
  ctx.fill();

  ctx.fillStyle = '#475569';
  for (let i = -28; i <= 28; i += 11) {
    ctx.beginPath();
    ctx.arc(i, -8, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Reactive armor side skirt
  ctx.fillStyle = '#475569';
  ctx.fillRect(-36, -21, 72, 9);
  ctx.fillStyle = '#334155';
  for (let i = -32; i < 32; i += 12) {
    ctx.fillRect(i, -20, 9, 7);
  }

  // Low-profile sloped composite hull
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(-36, -20);
  ctx.lineTo(-26, -31);
  ctx.lineTo(26, -31);
  ctx.lineTo(39, -20);
  ctx.closePath();
  ctx.fill();

  // Sloped angular MBT turret
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(-22, -31);
  ctx.lineTo(-16, -45);
  ctx.lineTo(14, -45);
  ctx.lineTo(24, -36);
  ctx.lineTo(18, -31);
  ctx.closePath();
  ctx.fill();

  // Team IFF panel
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-14, -41, 14, 5);
  // Commander optic
  ctx.fillStyle = tc.glow;
  ctx.fillRect(4, -48, 6, 3);

  // Smoothbore cannon with bore evacuator
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(18 + recoil, -40, 34, 4.5);
  ctx.fillStyle = '#334155';
  ctx.fillRect(30 + recoil, -41.5, 9, 7.5);
  if (swing > 0.65) {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(54, -37.8, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  void walkPhase;
}

function drawColossusMech(
  ctx: CanvasRenderingContext2D,
  tc: ReturnType<typeof teamColors>,
  stride: number,
  bob: number,
  swing: number,
): void {
  const y = -bob * 1.8;

  // Back articulated mech leg
  ctx.save();
  ctx.translate(-8, -38 + y);
  ctx.rotate(-stride * 0.35);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-5, 0, 10, 22);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-4, 20, 10, 18);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-8, 34, 18, 6);
  ctx.restore();

  // Front articulated mech leg
  ctx.save();
  ctx.translate(8, -38 + y);
  ctx.rotate(stride * 0.35);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-5, 0, 11, 22);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-4, 20, 11, 18);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-7, 34, 19, 6);
  ctx.fillStyle = tc.glow;
  ctx.fillRect(-2, 16, 6, 3);
  ctx.restore();

  // Armored pelvis & reactor core torso
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-16, -44 + y, 32, 10);

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(-22, -44 + y);
  ctx.lineTo(-26, -74 + y);
  ctx.lineTo(18, -78 + y);
  ctx.lineTo(26, -56 + y);
  ctx.lineTo(18, -44 + y);
  ctx.closePath();
  ctx.fill();

  // Shoulder missile pod
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-24, -88 + y, 16, 14);
  ctx.fillStyle = tc.light;
  ctx.fillRect(-12, -85 + y, 3, 3);
  ctx.fillRect(-12, -80 + y, 3, 3);

  // Team armor stripe & glowing reactor visor
  ctx.fillStyle = tc.primary;
  ctx.fillRect(-18, -68 + y, 24, 6);
  ctx.shadowColor = tc.glow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = tc.glow;
  ctx.beginPath();
  ctx.moveTo(8, -70 + y);
  ctx.lineTo(22, -66 + y);
  ctx.lineTo(20, -59 + y);
  ctx.lineTo(8, -61 + y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Dual heavy plasma arm cannon
  const recoil = -swing * 6;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(4 + recoil, -60 + y, 32, 11);
  ctx.fillStyle = tc.glow;
  ctx.fillRect(14 + recoil, -57 + y, 22, 4.5);
  if (swing > 0.55) {
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(38, -54.5 + y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpokedWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(a) * radius, -Math.sin(a) * radius);
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    ctx.stroke();
  }
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
