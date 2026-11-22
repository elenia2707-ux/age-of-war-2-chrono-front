import type { TurretVisualKind, UnitVisualKind, UpgradeId } from '../data/types';
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

export function clearIconCache(): void {
  unitIconCache.clear();
  turretIconCache.clear();
  upgradeIconCache.clear();
}

function getUnitIconFraming(unitId: UnitVisualKind): { scale: number; x: number; y: number } {
  if (unitId === 'omega_titan') return { scale: 0.78, x: 64, y: 92 };
  if (unitId === 'colossus_mech') return { scale: 0.88, x: 62, y: 92 };
  if (unitId === 'steam_walker') return { scale: 1.12, x: 62, y: 90 };
  if (unitId === 'star_archon') return { scale: 1.14, x: 68, y: 88 };
  if (unitId === 'hover_drone') return { scale: 1.72, x: 70, y: 88 };
  if (unitId === 'mbt') return { scale: 1.18, x: 58, y: 84 };
  if (unitId === 'early_tank') return { scale: 1.24, x: 58, y: 86 };
  if (unitId === 'heavy_cavalry' || unitId === 'dino_rider') return { scale: 1.26, x: 64, y: 91 };
  if (unitId === 'sphinx_chariot' || unitId === 'chariot') return { scale: 1.32, x: 66, y: 88 };
  if (unitId === 'catapult' || unitId === 'field_cannon') return { scale: 1.34, x: 68, y: 88 };
  if (unitId === 'mortar_team') return { scale: 1.45, x: 66, y: 90 };
  if (unitId === 'riot_juggernaut') return { scale: 1.38, x: 64, y: 91 };
  return { scale: 1.62, x: 62, y: 91 };
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
  }
}
