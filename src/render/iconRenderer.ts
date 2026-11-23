import type {
  CommanderId,
  RelicId,
  SanctuaryUpgradeId,
  TurretVisualKind,
  UnitVisualKind,
  UpgradeId,
} from '../data/types';
import { drawTurretArt } from './baseRenderer';
import {
  drawCelEllipse,
  drawCelPoly,
  drawCelRoundRect,
  drawEnergyOrb,
  setInkStyle,
} from './cartoonPrimitives';
import { renderUnitPose } from './unitRenderer';

const unitIconCache = new Map<UnitVisualKind, string>();
const turretIconCache = new Map<TurretVisualKind, string>();
const upgradeIconCache = new Map<UpgradeId, string>();
const relicIconCache = new Map<RelicId, string>();
const commanderIconCache = new Map<CommanderId, string>();
const sanctuaryIconCache = new Map<SanctuaryUpgradeId, string>();

export function clearIconCache(): void {
  unitIconCache.clear();
  turretIconCache.clear();
  upgradeIconCache.clear();
  relicIconCache.clear();
  commanderIconCache.clear();
  sanctuaryIconCache.clear();
}

function getUnitIconFraming(unitId: UnitVisualKind): { scale: number; x: number; y: number } {
  if (unitId === 'chrono_sovereign') return { scale: 0.61, x: 64, y: 92 };
  if (unitId === 'omega_titan') return { scale: 0.70, x: 64, y: 92 };
  if (unitId === 'colossus_mech') return { scale: 0.84, x: 62, y: 92 };
  if (unitId === 'steam_walker') return { scale: 1.06, x: 64, y: 91 };
  if (unitId === 'star_archon') return { scale: 1.06, x: 68, y: 89 };
  if (unitId === 'aegis_seraph') return { scale: 1.32, x: 70, y: 92 };
  if (unitId === 'hover_drone') return { scale: 1.66, x: 72, y: 88 };
  if (unitId === 'mbt') return { scale: 1.15, x: 58, y: 86 };
  if (unitId === 'early_tank') return { scale: 1.22, x: 58, y: 87 };
  if (unitId === 'dragon_general') return { scale: 1.08, x: 64, y: 91 };
  if (unitId === 'heavy_cavalry') return { scale: 1.18, x: 60, y: 91 };
  if (unitId === 'dino_rider') return { scale: 1.24, x: 66, y: 91 };
  if (unitId === 'hwacha_cart') return { scale: 1.24, x: 66, y: 90 };
  if (unitId === 'sphinx_chariot' || unitId === 'chariot') return { scale: 1.28, x: 66, y: 89 };
  if (unitId === 'catapult' || unitId === 'field_cannon') return { scale: 1.32, x: 68, y: 89 };
  if (unitId === 'mortar_team') return { scale: 1.36, x: 66, y: 90 };
  if (unitId === 'riot_juggernaut') return { scale: 1.20, x: 64, y: 91 };
  if (unitId === 'void_templar') return { scale: 1.10, x: 64, y: 92 };
  if (unitId === 'chrono_blade' || unitId === 'quantum_weaver') return { scale: 1.10, x: 64, y: 92 };
  if (unitId === 'grenadier') return { scale: 1.12, x: 62, y: 92 };
  if (
    unitId === 'dynasty_swordsman' ||
    unitId === 'repeating_crossbow' ||
    unitId === 'gravity_sniper' ||
    unitId === 'cyborg' ||
    unitId === 'anubis_warrior' ||
    unitId === 'shaman' ||
    unitId === 'sun_priest' ||
    unitId === 'scorpion_guard' ||
    unitId === 'centurion' ||
    unitId === 'knight' ||
    unitId === 'steam_trooper' ||
    unitId === 'tesla_coil_trooper'
  ) {
    return { scale: 1.18, x: 62, y: 91 };
  }
  if (unitId === 'spearman' || unitId === 'pikeman' || unitId === 'railgun_sniper') {
    return { scale: 1.24, x: 58, y: 91 };
  }
  return { scale: 1.34, x: 62, y: 91 };
}

export function getUnitIconUrl(unitId: UnitVisualKind): string {
  const existing = unitIconCache.get(unitId);
  if (existing) return existing;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 144;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const { scale, x, y } = getUnitIconFraming(unitId);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  renderUnitPose(ctx, {
    kind: unitId,
    team: 'player',
    walkPhase: 0.35,
    attackAnim: 0,
    hitFlash: 0,
    deathProgress: 0,
    isWalking: false,
  });
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  unitIconCache.set(unitId, url);
  return url;
}

export function getTurretIconUrl(turretId: TurretVisualKind): string {
  const existing = turretIconCache.get(turretId);
  if (existing) return existing;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 112;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(48, 44);
  ctx.scale(1.85, 1.85);
  drawTurretArt(ctx, turretId, 'player', -0.16, 0);
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  turretIconCache.set(turretId, url);
  return url;
}

export function getUpgradeIconUrl(upgradeId: UpgradeId): string {
  const existing = upgradeIconCache.get(upgradeId);
  if (existing) return existing;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 88;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(44, 36);
  ctx.scale(1.18, 1.18);
  drawCartoonUpgradeIcon(ctx, upgradeId);
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  upgradeIconCache.set(upgradeId, url);
  return url;
}

/** Render handcrafted HD Flash-cartoon icon centered at (0, 0) for all 16 Gold Spec Upgrades */
export function drawCartoonUpgradeIcon(ctx: CanvasRenderingContext2D, id: UpgradeId): void {
  switch (id) {
    // ---- OFFENSE (공격) ----
    case 'weapons': {
      for (const dir of [-1, 1] as const) {
        ctx.save();
        ctx.scale(dir, 1);
        ctx.rotate(0.72);
        drawCelPoly(
          ctx,
          [
            [-4, 12],
            [4, 12],
            [5, -20],
            [0, -29],
            [-5, -20],
          ],
          '#e2e8f0',
          { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.3 },
        );
        drawCelRoundRect(ctx, -11, 9, 22, 5.5, 2, '#facc15', { highlight: '#fef08a', shadow: '#b45309', lineWidth: 2.0 });
        drawCelRoundRect(ctx, -3, 14, 6, 11, 2, '#92400e', { shadow: '#451a03', lineWidth: 2.0 });
        ctx.restore();
      }
      break;
    }

    case 'attack_speed': {
      drawCelPoly(
        ctx,
        [
          [4, -27],
          [-17, 2],
          [-2, 2],
          [-8, 27],
          [18, -4],
          [2, -4],
        ],
        '#facc15',
        { highlight: '#fef9c3', shadow: '#ea580c', lineWidth: 2.6 },
      );
      break;
    }

    case 'crit_mastery': {
      drawCelEllipse(ctx, 0, 0, 22, 22, '#ef4444', { highlight: '#fca5a5', shadow: '#991b1b', lineWidth: 2.5 });
      drawCelEllipse(ctx, 0, 0, 14, 14, '#fef08a', { lineWidth: 2.0 });
      drawCelEllipse(ctx, 0, 0, 6.5, 6.5, '#dc2626', { lineWidth: 1.8 });
      setInkStyle(ctx, 2.8, '#0f172a');
      ctx.beginPath();
      ctx.moveTo(-27, 0);
      ctx.lineTo(-10, 0);
      ctx.moveTo(10, 0);
      ctx.lineTo(27, 0);
      ctx.moveTo(0, -27);
      ctx.lineTo(0, -10);
      ctx.moveTo(0, 10);
      ctx.lineTo(0, 27);
      ctx.stroke();
      break;
    }

    case 'armor_pierce': {
      // Glowing cyan armor-piercing spearhead shattering a steel shield!
      drawCelPoly(
        ctx,
        [
          [-16, -20],
          [8, -20],
          [8, 4],
          [-4, 22],
          [-16, 4],
        ],
        '#64748b',
        { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 2.3 },
      );
      // Piercing glowing lance cutting diagonally across!
      ctx.save();
      ctx.rotate(-0.62);
      drawCelPoly(
        ctx,
        [
          [-26, -3],
          [10, -4.5],
          [28, 0],
          [10, 4.5],
          [-26, 3],
        ],
        '#38bdf8',
        { highlight: '#ffffff', shadow: '#0284c7', lineWidth: 2.2 },
      );
      ctx.restore();
      drawEnergyOrb(ctx, 6, -4, 6, '#fde047', '#ffffff');
      break;
    }

    // ---- DEFENSE (방어) ----
    case 'armor': {
      drawCelPoly(
        ctx,
        [
          [-22, -24],
          [22, -24],
          [22, 2],
          [0, 27],
          [-22, 2],
        ],
        '#facc15',
        { highlight: '#fef08a', shadow: '#b45309', lineWidth: 2.6 },
      );
      drawCelPoly(
        ctx,
        [
          [-16, -18],
          [16, -18],
          [16, 0],
          [0, 20],
          [-16, 0],
        ],
        '#2563eb',
        { highlight: '#60a5fa', shadow: '#1e3a8a', lineWidth: 2.0 },
      );
      drawCelEllipse(ctx, 0, -3, 6.5, 6.5, '#fef08a', { highlight: '#ffffff', lineWidth: 1.8 });
      break;
    }

    case 'regeneration': {
      // Radiant emerald healing heart + crisp white vitality cross!
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 23);
      ctx.bezierCurveTo(-28, 6, -28, -22, -10, -22);
      ctx.bezierCurveTo(-3, -22, 0, -14, 0, -11);
      ctx.bezierCurveTo(0, -14, 3, -22, 10, -22);
      ctx.bezierCurveTo(28, -22, 28, 6, 0, 23);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, -22, 0, 23);
      g.addColorStop(0, '#86efac');
      g.addColorStop(0.45, '#22c55e');
      g.addColorStop(1, '#15803d');
      ctx.fillStyle = g;
      ctx.fill();
      setInkStyle(ctx, 2.5);
      ctx.stroke();
      ctx.restore();
      drawCelRoundRect(ctx, -4, -10, 8, 20, 2, '#ffffff', { lineWidth: 1.6 });
      drawCelRoundRect(ctx, -10, -4, 20, 8, 2, '#ffffff', { lineWidth: 1.6 });
      break;
    }

    case 'lifesteal': {
      // Crimson-violet glowing vampire drop & twin fangs!
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.bezierCurveTo(22, -4, 22, 22, 0, 24);
      ctx.bezierCurveTo(-22, 22, -22, -4, 0, -26);
      ctx.closePath();
      const grad = ctx.createLinearGradient(-12, -22, 12, 24);
      grad.addColorStop(0, '#fb7185');
      grad.addColorStop(0.45, '#dc2626');
      grad.addColorStop(1, '#581c87');
      ctx.fillStyle = grad;
      ctx.fill();
      setInkStyle(ctx, 2.5);
      ctx.stroke();
      ctx.restore();
      // Gleaming white fangs biting over crimson orb
      drawCelPoly(
        ctx,
        [
          [-13, -6],
          [-7, 10],
          [-2, -6],
        ],
        '#ffffff',
        { shadow: '#cbd5e1', lineWidth: 1.8 },
      );
      drawCelPoly(
        ctx,
        [
          [2, -6],
          [7, 10],
          [13, -6],
        ],
        '#ffffff',
        { shadow: '#cbd5e1', lineWidth: 1.8 },
      );
      break;
    }

    case 'thorns': {
      // Spiked steel-and-crimson thorny buckler shield!
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        drawCelPoly(
          ctx,
          [
            [14, -4],
            [27, 0],
            [14, 4],
          ],
          '#e2e8f0',
          { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.8 },
        );
        ctx.restore();
      }
      drawCelEllipse(ctx, 0, 0, 16, 16, '#b91c1c', { highlight: '#f87171', shadow: '#450a0a', lineWidth: 2.4 });
      drawCelEllipse(ctx, 0, 0, 7, 7, '#facc15', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 1.8 });
      break;
    }

    // ---- TACTICS (전술) ----
    case 'mobility': {
      drawCelPoly(
        ctx,
        [
          [-14, -18],
          [2, -18],
          [2, 4],
          [22, 8],
          [22, 20],
          [-16, 20],
        ],
        '#2563eb',
        { highlight: '#60a5fa', shadow: '#1e3a8a', lineWidth: 2.5 },
      );
      drawCelRoundRect(ctx, -17, 15, 40, 6.5, 2.5, '#78350f', { lineWidth: 2.0 });
      drawCelPoly(
        ctx,
        [
          [-6, -4],
          [-28, -22],
          [-24, -8],
          [-30, -3],
          [-14, 6],
        ],
        '#facc15',
        { highlight: '#fef08a', shadow: '#b45309', lineWidth: 2.1 },
      );
      break;
    }

    case 'range_optics': {
      // Sleek golden sniper spyglass / laser optics lens!
      ctx.save();
      ctx.rotate(-0.48);
      drawCelRoundRect(ctx, -24, -6, 18, 12, 3, '#b45309', { highlight: '#fde047', shadow: '#78350f', lineWidth: 2.1 });
      drawCelRoundRect(ctx, -8, -8.5, 20, 17, 3, '#d97706', { highlight: '#fef08a', shadow: '#78350f', lineWidth: 2.2 });
      drawCelRoundRect(ctx, 10, -11, 14, 22, 4, '#334155', { highlight: '#94a3b8', shadow: '#0f172a', lineWidth: 2.2 });
      drawCelEllipse(ctx, 22, 0, 4.5, 9.5, '#38bdf8', { highlight: '#ffffff', shadow: '#0284c7', lineWidth: 1.8 });
      ctx.restore();
      break;
    }

    case 'siege_craft': {
      // Heavy blazing golden-iron siege warhammer!
      ctx.save();
      ctx.rotate(-0.55);
      drawCelRoundRect(ctx, -4, -6, 8, 30, 2.5, '#854d0e', { highlight: '#ca8a04', shadow: '#451a03', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -21, -24, 42, 20, 4, '#475569', { highlight: '#cbd5e1', shadow: '#0f172a', lineWidth: 2.5 });
      drawCelRoundRect(ctx, -18, -24, 8, 20, 2, '#f97316', { highlight: '#fef08a', lineWidth: 1.7 });
      drawCelRoundRect(ctx, 10, -24, 8, 20, 2, '#f97316', { highlight: '#fef08a', lineWidth: 1.7 });
      ctx.restore();
      break;
    }

    case 'ultimate_power': {
      // Radiant violet-gold supernova starburst meteor crest!
      const pts: [number, number][] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 25 : 11;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      drawCelPoly(ctx, pts, '#a855f7', { highlight: '#f5d0fe', shadow: '#581c87', lineWidth: 2.3 });
      drawEnergyOrb(ctx, 0, 0, 9.5, '#facc15', '#ffffff');
      break;
    }

    // ---- EMPIRE (제국) ----
    case 'economy': {
      for (let i = 0; i < 3; i++) {
        drawCelEllipse(ctx, -8, 15 - i * 9, 15, 7, '#f59e0b', {
          highlight: '#fef08a',
          shadow: '#b45309',
          lineWidth: 2.1,
        });
      }
      drawCelPoly(
        ctx,
        [
          [16, -24],
          [28, -8],
          [21, -8],
          [21, 18],
          [11, 18],
          [11, -8],
          [4, -8],
        ],
        '#22c55e',
        { highlight: '#86efac', shadow: '#15803d', lineWidth: 2.2 },
      );
      break;
    }

    case 'bounty': {
      drawCelPoly(
        ctx,
        [
          [-22, 16],
          [-25, -12],
          [-10, 0],
          [0, -22],
          [10, 0],
          [25, -12],
          [22, 16],
        ],
        '#facc15',
        { highlight: '#fef08a', shadow: '#b45309', lineWidth: 2.5 },
      );
      drawCelRoundRect(ctx, -22, 12, 44, 9, 3, '#d97706', { highlight: '#fde047', shadow: '#78350f', lineWidth: 2.1 });
      drawEnergyOrb(ctx, 0, 5, 5.2, '#38bdf8', '#ffffff');
      break;
    }

    case 'discount': {
      // Gleaming gold coin paired with emerald downward cost-cut arrow!
      drawCelEllipse(ctx, -7, -2, 18, 18, '#f59e0b', {
        highlight: '#fef08a',
        shadow: '#b45309',
        lineWidth: 2.5,
      });
      drawCelEllipse(ctx, -7, -2, 12, 12, '#eab308', { highlight: '#fef9c3', lineWidth: 1.5 });
      drawCelPoly(
        ctx,
        [
          [15, 25],
          [28, 7],
          [21, 7],
          [21, -18],
          [9, -18],
          [9, 7],
          [2, 7],
        ],
        '#22c55e',
        { highlight: '#86efac', shadow: '#15803d', lineWidth: 2.3 },
      );
      break;
    }

    case 'fortress': {
      drawCelRoundRect(ctx, -18, -12, 36, 34, 4, '#94a3b8', {
        highlight: '#f1f5f9',
        shadow: '#475569',
        lineWidth: 2.5,
      });
      for (let i = 0; i < 3; i++) {
        drawCelRoundRect(ctx, -21 + i * 16, -24, 10, 14, 2, '#cbd5e1', { highlight: '#ffffff', lineWidth: 2.2 });
      }
      drawCelRoundRect(ctx, -8, 4, 16, 18, 7, '#1e293b', { lineWidth: 2.2 });
      drawCelEllipse(ctx, 0, -4, 6.2, 6.2, '#4ade80', { highlight: '#dcfce7', lineWidth: 1.8 });
      break;
    }

    // ---- SPECIAL (특수) ----
    case 'xp_mastery': {
      // Glowing cyan-gold celestial XP mastery star crystal + upward boost chevron!
      drawCelPoly(
        ctx,
        [
          [-6, -24],
          [10, -4],
          [-6, 22],
          [-22, -4],
        ],
        '#0ea5e9',
        { highlight: '#bae6fd', shadow: '#0369a1', lineWidth: 2.4 },
      );
      drawEnergyOrb(ctx, -6, -3, 6.5, '#38bdf8', '#ffffff');
      drawCelPoly(
        ctx,
        [
          [16, -22],
          [28, -6],
          [21, -6],
          [21, 18],
          [11, 18],
          [11, -6],
          [4, -6],
        ],
        '#facc15',
        { highlight: '#fef08a', shadow: '#b45309', lineWidth: 2.1 },
      );
      break;
    }

    case 'ult_efficiency': {
      // Violet-cyan arcane efficiency hourglass / lightning prism saving ultimate XP!
      drawCelPoly(
        ctx,
        [
          [-18, -22],
          [18, -22],
          [5, 0],
          [18, 22],
          [-18, 22],
          [-5, 0],
        ],
        '#a855f7',
        { highlight: '#f5d0fe', shadow: '#581c87', lineWidth: 2.4 },
      );
      drawCelRoundRect(ctx, -21, -25, 42, 6, 2, '#facc15', { highlight: '#fef08a', lineWidth: 1.8 });
      drawCelRoundRect(ctx, -21, 19, 42, 6, 2, '#facc15', { highlight: '#fef08a', lineWidth: 1.8 });
      drawEnergyOrb(ctx, 0, 0, 6.5, '#22d3ee', '#ffffff');
      break;
    }

    case 'executioner': {
      // Menacing crimson-gold curved executioner scythe / skull finisher crest!
      ctx.save();
      ctx.rotate(-0.18);
      drawCelRoundRect(ctx, -18, -22, 6.5, 46, 2.5, '#78350f', { highlight: '#ca8a04', shadow: '#451a03', lineWidth: 2.1 });
      drawCelPoly(
        ctx,
        [
          [-14, -22],
          [24, -18],
          [12, -2],
          [-12, -10],
        ],
        '#ef4444',
        { highlight: '#fca5a5', shadow: '#7f1d1d', lineWidth: 2.4 },
      );
      drawCelPoly(
        ctx,
        [
          [-6, -19],
          [21, -17],
          [12, -8],
        ],
        '#fef08a',
        { lineWidth: 1.4 },
      );
      drawEnergyOrb(ctx, 10, 12, 7.5, '#f43f5e', '#fef08a');
      ctx.restore();
      break;
    }

    case 'turret_rapid': {
      // Twin rapid-fire turret barrels with glowing cyan speed chevrons!
      drawCelRoundRect(ctx, -24, -14, 22, 28, 5, '#475569', { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 2.4 });
      drawCelRoundRect(ctx, -4, -12, 28, 8, 2.5, '#f59e0b', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.1 });
      drawCelRoundRect(ctx, -4, 4, 28, 8, 2.5, '#f59e0b', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.1 });
      drawEnergyOrb(ctx, 25, -8, 5.2, '#22d3ee', '#ffffff');
      drawEnergyOrb(ctx, 25, 8, 5.2, '#22d3ee', '#ffffff');
      break;
    }

    case 'vanguard_shield': {
      // Radiant hexagonal cyan-gold Aegis barrier crest!
      drawCelPoly(
        ctx,
        [
          [0, -25],
          [22, -13],
          [20, 10],
          [0, 26],
          [-20, 10],
          [-22, -13],
        ],
        '#0ea5e9',
        { highlight: '#bae6fd', shadow: '#0369a1', lineWidth: 2.5 },
      );
      drawCelPoly(
        ctx,
        [
          [0, -17],
          [14, -8],
          [12, 7],
          [0, 18],
          [-12, 7],
          [-14, -8],
        ],
        '#38bdf8',
        { highlight: '#ffffff', shadow: '#0284c7', lineWidth: 1.7 },
      );
      drawEnergyOrb(ctx, 0, -1, 7.2, '#facc15', '#ffffff');
      break;
    }

    case 'berserk_fury': {
      // Blazing crimson-amber crossed battle-axes & raging fury flame!
      drawCelPoly(
        ctx,
        [
          [0, -26],
          [15, -8],
          [22, 6],
          [11, 23],
          [0, 15],
          [-11, 23],
          [-22, 6],
          [-15, -8],
        ],
        '#e11d48',
        { highlight: '#fda4af', shadow: '#881337', lineWidth: 2.4 },
      );
      drawCelPoly(
        ctx,
        [
          [0, -17],
          [10, 0],
          [6, 15],
          [0, 9],
          [-6, 15],
          [-10, 0],
        ],
        '#fb923c',
        { highlight: '#fef08a', shadow: '#c2410c', lineWidth: 1.8 },
      );
      drawEnergyOrb(ctx, 0, 2, 6.2, '#fde047', '#ffffff');
      break;
    }

    case 'veteran_drill': {
      // Triple-star gold commander chevron medal with crimson ribbon!
      drawCelPoly(
        ctx,
        [
          [-18, -22],
          [18, -22],
          [22, 6],
          [0, 24],
          [-22, 6],
        ],
        '#b91c1c',
        { highlight: '#f87171', shadow: '#7f1d1d', lineWidth: 2.4 },
      );
      drawCelPoly(
        ctx,
        [
          [-15, 2],
          [0, 14],
          [15, 2],
          [15, 9],
          [0, 21],
          [-15, 9],
        ],
        '#facc15',
        { highlight: '#fef08a', shadow: '#a16207', lineWidth: 1.8 },
      );
      drawEnergyOrb(ctx, 0, -11, 7.5, '#facc15', '#ffffff');
      drawEnergyOrb(ctx, -11, -5, 4.4, '#fde047', '#ffffff');
      drawEnergyOrb(ctx, 11, -5, 4.4, '#fde047', '#ffffff');
      break;
    }

    case 'chrono_fever': {
      // Golden Chrono supply crate + blazing lightning fever wings!
      drawCelRoundRect(ctx, -17, -14, 34, 30, 5, '#d97706', { highlight: '#fde047', shadow: '#78350f', lineWidth: 2.5 });
      drawCelRoundRect(ctx, -17, -4, 34, 8, 2, '#facc15', { highlight: '#fef9c3', lineWidth: 1.6 });
      drawCelRoundRect(ctx, -4, -14, 8, 30, 2, '#facc15', { highlight: '#fef9c3', lineWidth: 1.6 });
      drawCelPoly(
        ctx,
        [
          [3, -26],
          [-9, -6],
          [1, -6],
          [-4, 12],
          [11, -10],
          [1, -10],
        ],
        '#22d3ee',
        { highlight: '#ffffff', shadow: '#0e7490', lineWidth: 1.8 },
      );
      break;
    }
  }
}

export function getRelicIconUrl(relicId: RelicId): string {
  const existing = relicIconCache.get(relicId);
  if (existing) return existing;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 88;
  canvas.height = 88;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(44, 44);
  ctx.scale(1.22, 1.22);
  drawCartoonRelicIcon(ctx, relicId);
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  relicIconCache.set(relicId, url);
  return url;
}

export function getCommanderIconUrl(commanderId: CommanderId): string {
  const existing = commanderIconCache.get(commanderId);
  if (existing) return existing;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 88;
  canvas.height = 88;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(44, 44);
  ctx.scale(1.24, 1.24);
  drawCartoonCommanderIcon(ctx, commanderId);
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  commanderIconCache.set(commanderId, url);
  return url;
}

export function getSanctuaryIconUrl(upgradeId: SanctuaryUpgradeId): string {
  const existing = sanctuaryIconCache.get(upgradeId);
  if (existing) return existing;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(40, 36);
  ctx.scale(1.16, 1.16);
  drawCartoonSanctuaryIcon(ctx, upgradeId);
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  sanctuaryIconCache.set(upgradeId, url);
  return url;
}

export function drawCartoonCommanderIcon(ctx: CanvasRenderingContext2D, id: CommanderId): void {
  switch (id) {
    case 'vanguard': {
      // Winged Azure Crest Shield + Golden Spearhead
      drawCelPoly(
        ctx,
        [
          [0, -24],
          [20, -14],
          [16, 10],
          [0, 24],
          [-16, 10],
          [-20, -14],
        ],
        '#0284c7',
        { highlight: '#7dd3fc', shadow: '#0c4a6e', lineWidth: 2.5 },
      );
      drawCelPoly(
        ctx,
        [
          [0, -18],
          [7, 4],
          [0, 16],
          [-7, 4],
        ],
        '#facc15',
        { highlight: '#fef9c3', shadow: '#a16207', lineWidth: 2 },
      );
      drawEnergyOrb(ctx, 0, -2, 5.5, '#38bdf8', '#ffffff');
      break;
    }
    case 'ordnance': {
      // Twin Crossed Heavy Howitzer Barrels + Explosive Star
      for (const dir of [-1, 1] as const) {
        ctx.save();
        ctx.scale(dir, 1);
        ctx.rotate(0.65);
        drawCelRoundRect(ctx, -6, -22, 12, 38, 4, '#475569', {
          highlight: '#94a3b8',
          shadow: '#1e293b',
          lineWidth: 2.2,
        });
        drawCelRoundRect(ctx, -8, -24, 16, 7, 2, '#f97316', { highlight: '#fdba74', lineWidth: 1.8 });
        ctx.restore();
      }
      drawEnergyOrb(ctx, 0, -2, 8.5, '#fb923c', '#fef08a');
      break;
    }
    case 'archon': {
      // Imperial Sun Crown + Golden Gem Scepter
      drawCelPoly(
        ctx,
        [
          [-22, 12],
          [-18, -10],
          [-8, 0],
          [0, -20],
          [8, 0],
          [18, -10],
          [22, 12],
        ],
        '#eab308',
        { highlight: '#fef08a', shadow: '#854d0e', lineWidth: 2.5 },
      );
      drawCelRoundRect(ctx, -22, 10, 44, 8, 3, '#ca8a04', { highlight: '#fde047', lineWidth: 2 });
      drawEnergyOrb(ctx, 0, 2, 6, '#38bdf8', '#ffffff');
      break;
    }
    case 'aegis': {
      // Celestial Emerald Halo Wings + Sacred Ankh Cross
      drawCelEllipse(ctx, 0, 0, 22, 22, '#059669', { highlight: '#6ee7b7', shadow: '#064e3b', lineWidth: 2.4 });
      drawCelRoundRect(ctx, -4, -15, 8, 30, 3, '#fef08a', { highlight: '#ffffff', lineWidth: 1.8 });
      drawCelRoundRect(ctx, -15, -4, 30, 8, 3, '#fef08a', { highlight: '#ffffff', lineWidth: 1.8 });
      drawEnergyOrb(ctx, 0, 0, 5.5, '#4ade80', '#ffffff');
      break;
    }
  }
}

export function drawCartoonSanctuaryIcon(ctx: CanvasRenderingContext2D, id: SanctuaryUpgradeId): void {
  switch (id) {
    case 'starting_gold':
      drawCartoonUpgradeIcon(ctx, 'economy');
      drawEnergyOrb(ctx, 0, -14, 5, '#fef08a', '#ffffff');
      break;
    case 'combat_doctrine':
      drawCartoonUpgradeIcon(ctx, 'weapons');
      break;
    case 'eternal_masonry':
      drawCartoonUpgradeIcon(ctx, 'fortress');
      break;
    case 'chrono_blessing':
      drawCartoonUpgradeIcon(ctx, 'xp_mastery');
      break;
    case 'royal_mint':
      drawCartoonUpgradeIcon(ctx, 'bounty');
      break;
    case 'starter_relic':
      drawCelPoly(
        ctx,
        [
          [0, -24],
          [18, -4],
          [10, 20],
          [-10, 20],
          [-18, -4],
        ],
        '#14b8a6',
        { highlight: '#99f6e4', shadow: '#0f766e', lineWidth: 2.4 },
      );
      drawEnergyOrb(ctx, 0, -2, 7.5, '#fef08a', '#ffffff');
      break;
    case 'command_mastery':
      drawCartoonCommanderIcon(ctx, 'vanguard');
      break;
    case 'turret_legacy':
      drawCartoonUpgradeIcon(ctx, 'turret_rapid');
      break;
  }
}

export function drawCartoonRelicIcon(ctx: CanvasRenderingContext2D, id: RelicId): void {
  switch (id) {
    case 'chrono_overclock': {
      // Golden Chrono Gear + Cyan Clock Hands
      drawCelEllipse(ctx, 0, 0, 22, 22, '#0284c7', { highlight: '#7dd3fc', shadow: '#0c4a6e', lineWidth: 2.5 });
      drawCelEllipse(ctx, 0, 0, 14, 14, '#eab308', { highlight: '#fef08a', shadow: '#854d0e', lineWidth: 2 });
      setInkStyle(ctx, 3, '#ffffff');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -10);
      ctx.moveTo(0, 0);
      ctx.lineTo(8, 4);
      ctx.stroke();
      drawEnergyOrb(ctx, 0, 0, 4.5, '#38bdf8', '#ffffff');
      break;
    }
    case 'golden_chalice': {
      // Radiant Alchemical Chalice overflowing with gold light
      drawCelPoly(
        ctx,
        [
          [-16, -16],
          [16, -16],
          [10, 4],
          [-10, 4],
        ],
        '#eab308',
        { highlight: '#fef08a', shadow: '#a16207', lineWidth: 2.4 },
      );
      drawCelRoundRect(ctx, -4, 4, 8, 12, 2, '#ca8a04', { highlight: '#fde047', lineWidth: 2 });
      drawCelRoundRect(ctx, -13, 15, 26, 6, 3, '#eab308', { highlight: '#fef08a', lineWidth: 2 });
      drawEnergyOrb(ctx, 0, -16, 7.5, '#fde047', '#ffffff');
      break;
    }
    case 'blood_oath': {
      // Crimson Double-Bladed Berserker War-Axe
      drawCelRoundRect(ctx, -3, -22, 6, 44, 2, '#78350f', { highlight: '#b45309', lineWidth: 2 });
      for (const dir of [-1, 1] as const) {
        ctx.save();
        ctx.scale(dir, 1);
        drawCelPoly(
          ctx,
          [
            [3, -14],
            [21, -22],
            [24, -4],
            [18, 10],
            [3, 4],
          ],
          '#e11d48',
          { highlight: '#fda4af', shadow: '#881337', lineWidth: 2.3 },
        );
        ctx.restore();
      }
      drawEnergyOrb(ctx, 0, -5, 5.5, '#fb7185', '#ffffff');
      break;
    }
    case 'thunder_core': {
      // High-voltage Tesla Sphere + Twin Lightning Forks
      drawCelEllipse(ctx, 0, 0, 19, 19, '#0e7490', { highlight: '#67e8f9', shadow: '#164e63', lineWidth: 2.4 });
      drawCelPoly(
        ctx,
        [
          [4, -24],
          [-10, -2],
          [1, -2],
          [-6, 23],
          [12, -4],
          [1, -4],
        ],
        '#fef08a',
        { highlight: '#ffffff', shadow: '#ca8a04', lineWidth: 2 },
      );
      break;
    }
    case 'immortal_bastion': {
      // Emerald Fortress Bastion Shield
      drawCelPoly(
        ctx,
        [
          [-18, -18],
          [-10, -18],
          [-10, -12],
          [-3, -12],
          [-3, -18],
          [3, -18],
          [3, -12],
          [10, -12],
          [10, -18],
          [18, -18],
          [16, 8],
          [0, 23],
          [-16, 8],
        ],
        '#10b981',
        { highlight: '#6ee7b7', shadow: '#065f46', lineWidth: 2.4 },
      );
      drawEnergyOrb(ctx, 0, 2, 6.5, '#38bdf8', '#ffffff');
      break;
    }
    case 'warlord_signet': {
      // Ruby & Gold Warlord Signet Ring with Triple Hero Star
      drawCelEllipse(ctx, 0, 2, 20, 20, '#eab308', { highlight: '#fef08a', shadow: '#854d0e', lineWidth: 2.5 });
      drawCelEllipse(ctx, 0, 2, 12, 12, '#b91c1c', { highlight: '#f87171', shadow: '#7f1d1d', lineWidth: 2 });
      drawEnergyOrb(ctx, 0, -14, 6.5, '#fef08a', '#ffffff');
      drawEnergyOrb(ctx, 0, 2, 5, '#fde047', '#ffffff');
      break;
    }
    case 'guillotine_blade': {
      // Diagonal Executioner Heavy Cleaver + Rose Victory Spark
      ctx.save();
      ctx.rotate(-0.45);
      drawCelPoly(
        ctx,
        [
          [-10, -24],
          [14, -18],
          [12, 16],
          [-10, 12],
        ],
        '#e2e8f0',
        { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.4 },
      );
      drawCelRoundRect(ctx, -5, 12, 8, 14, 2, '#9f1239', { highlight: '#fb7185', lineWidth: 2 });
      ctx.restore();
      drawEnergyOrb(ctx, 10, -10, 5.5, '#4ade80', '#ffffff');
      break;
    }
    case 'prism_split': {
      // Mythic Prismatic Crystal splitting 1 beam into 3
      drawCelPoly(
        ctx,
        [
          [0, -23],
          [21, 16],
          [-21, 16],
        ],
        '#2dd4bf',
        { highlight: '#ccfbf1', shadow: '#0f766e', lineWidth: 2.5 },
      );
      drawEnergyOrb(ctx, -12, -8, 4.2, '#38bdf8', '#ffffff');
      drawEnergyOrb(ctx, 12, -8, 4.2, '#f472b6', '#ffffff');
      drawEnergyOrb(ctx, 0, 4, 6, '#fef08a', '#ffffff');
      break;
    }
    case 'siegebreaker_ram': {
      // Bronze Horned Battering Ram Head
      drawCelRoundRect(ctx, -20, -9, 34, 18, 5, '#9a3412', { highlight: '#fb923c', shadow: '#431407', lineWidth: 2.4 });
      drawCelPoly(
        ctx,
        [
          [8, -14],
          [24, 0],
          [8, 14],
        ],
        '#facc15',
        { highlight: '#fef9c3', shadow: '#a16207', lineWidth: 2.4 },
      );
      break;
    }
    case 'turret_overcharge': {
      // Overcharged Reactor Core + Twin Turret Muzzles
      drawCelRoundRect(ctx, -18, -14, 36, 28, 7, '#1e293b', { highlight: '#64748b', shadow: '#0f172a', lineWidth: 2.4 });
      drawCelRoundRect(ctx, 12, -10, 12, 7, 2, '#38bdf8', { highlight: '#bae6fd', lineWidth: 1.8 });
      drawCelRoundRect(ctx, 12, 3, 12, 7, 2, '#38bdf8', { highlight: '#bae6fd', lineWidth: 1.8 });
      drawEnergyOrb(ctx, -2, 0, 9, '#38bdf8', '#ffffff');
      break;
    }
    case 'rewind_hourglass': {
      // Mythic Golden Chrono Hourglass
      drawCelRoundRect(ctx, -16, -22, 32, 6, 2, '#eab308', { highlight: '#fef08a', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -16, 16, 32, 6, 2, '#eab308', { highlight: '#fef08a', lineWidth: 2.2 });
      drawCelPoly(
        ctx,
        [
          [-13, -16],
          [13, -16],
          [3, 0],
          [13, 16],
          [-13, 16],
          [-3, 0],
        ],
        '#2dd4bf',
        { highlight: '#ccfbf1', shadow: '#0f766e', lineWidth: 2.2 },
      );
      drawEnergyOrb(ctx, 0, 0, 5, '#fef08a', '#ffffff');
      break;
    }
    case 'starlight_bounty': {
      // Golden Bounty Star Seal + Scroll
      drawCelRoundRect(ctx, -16, -18, 32, 36, 5, '#fef3c7', { highlight: '#ffffff', shadow: '#d97706', lineWidth: 2.3 });
      drawCelPoly(
        ctx,
        [
          [0, -13],
          [4, -3],
          [14, -3],
          [6, 4],
          [9, 14],
          [0, 8],
          [-9, 14],
          [-6, 4],
          [-14, -3],
          [-4, -3],
        ],
        '#eab308',
        { highlight: '#fef08a', shadow: '#a16207', lineWidth: 2 },
      );
      break;
    }
    case 'iron_maiden': {
      // Spiked Steel Pauldron Cuirass
      drawCelEllipse(ctx, 0, 2, 19, 17, '#64748b', { highlight: '#cbd5e1', shadow: '#334155', lineWidth: 2.4 });
      for (const ang of [-0.9, -0.45, 0, 0.45, 0.9]) {
        ctx.save();
        ctx.rotate(ang);
        drawCelPoly(
          ctx,
          [
            [-4, -15],
            [0, -26],
            [4, -15],
          ],
          '#e2e8f0',
          { highlight: '#ffffff', lineWidth: 1.8 },
        );
        ctx.restore();
      }
      break;
    }
    case 'berserker_horn': {
      // Blazing Curved War-Horn
      drawCelPoly(
        ctx,
        [
          [-20, -14],
          [-8, -18],
          [8, 4],
          [22, 8],
          [18, 18],
          [-2, 14],
          [-18, -2],
        ],
        '#ea580c',
        { highlight: '#fdba74', shadow: '#7c2d12', lineWidth: 2.4 },
      );
      drawEnergyOrb(ctx, 18, 12, 6, '#fde047', '#ffffff');
      break;
    }
    case 'imperial_conscription': {
      // Mythic Imperial Triple War-Banner
      drawCelRoundRect(ctx, -18, -20, 36, 5, 2, '#eab308', { highlight: '#fef08a', lineWidth: 2 });
      drawCelPoly(
        ctx,
        [
          [-14, -15],
          [14, -15],
          [14, 16],
          [0, 24],
          [-14, 16],
        ],
        '#9333ea',
        { highlight: '#d8b4fe', shadow: '#581c87', lineWidth: 2.4 },
      );
      drawEnergyOrb(ctx, 0, 1, 7, '#fde047', '#ffffff');
      break;
    }
    case 'supernova_catalyst': {
      // Mythic Supernova Singularity Core
      drawCelEllipse(ctx, 0, 0, 22, 10, '#c026d3', { highlight: '#f5d0fe', lineWidth: 2 });
      ctx.save();
      ctx.rotate(Math.PI / 2);
      drawCelEllipse(ctx, 0, 0, 22, 10, '#a855f7', { highlight: '#e9d5ff', lineWidth: 2 });
      ctx.restore();
      drawEnergyOrb(ctx, 0, 0, 10, '#e879f9', '#ffffff');
      break;
    }
    case 'cryo_shard': {
      // Absolute-Zero Faceted Ice Crystal
      drawCelPoly(
        ctx,
        [
          [0, -24],
          [15, -8],
          [11, 16],
          [0, 24],
          [-11, 16],
          [-15, -8],
        ],
        '#38bdf8',
        { highlight: '#e0f2fe', shadow: '#0369a1', lineWidth: 2.4 },
      );
      drawEnergyOrb(ctx, 0, -2, 6, '#bae6fd', '#ffffff');
      break;
    }
    case 'meteor_incendiary': {
      // Blazing Magma Meteor Warhead
      drawCelPoly(
        ctx,
        [
          [-6, -24],
          [14, -16],
          [20, 2],
          [8, 20],
          [-14, 16],
          [-20, -4],
        ],
        '#dc2626',
        { highlight: '#fca5a5', shadow: '#7f1d1d', lineWidth: 2.4 },
      );
      drawEnergyOrb(ctx, -2, 2, 8, '#facc15', '#ffffff');
      break;
    }
  }
}

