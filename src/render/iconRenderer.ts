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

/** Render handcrafted Flash-cartoon icon centered at (0, 0) for each of the 8 Gold Upgrades */
export function drawCartoonUpgradeIcon(ctx: CanvasRenderingContext2D, id: UpgradeId): void {
  switch (id) {
    case 'weapons': {
      // Gleaming crossed golden-hilted broadswords!
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
        drawCelRoundRect(ctx, -11, 9, 22, 5.5, 2, '#facc15', { highlight: '#fef08a', lineWidth: 2.0 });
        drawCelRoundRect(ctx, -3, 14, 6, 11, 2, '#92400e', { lineWidth: 2.0 });
        ctx.restore();
      }
      break;
    }

    case 'armor': {
      // Heroic golden-trimmed royal blue fortress shield!
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

    case 'attack_speed': {
      // Blazing golden-cyan comic lightning bolt!
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
      // Glowing crimson-gold bullseye reticle & starburst!
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

    case 'mobility': {
      // Heroic winged battle boot!
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
      // Sweeping golden speed wing
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
        { highlight: '#fef08a', lineWidth: 2.1 },
      );
      break;
    }

    case 'economy': {
      // Gleaming stacked gold coins + upward surge arrow!
      for (let i = 0; i < 3; i++) {
        drawCelEllipse(ctx, -8, 15 - i * 9, 15, 7, '#f59e0b', {
          highlight: '#fef08a',
          shadow: '#b45309',
          lineWidth: 2.1,
        });
      }
      // Vibrant emerald up-arrow
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
      // Royal golden war crown & treasure chest gleam!
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
      drawCelRoundRect(ctx, -22, 12, 44, 9, 3, '#d97706', { highlight: '#fde047', lineWidth: 2.1 });
      drawEnergyOrb(ctx, 0, 5, 5.2, '#38bdf8', '#ffffff');
      break;
    }

    case 'fortress': {
      // Crenellated blue-gold castle bastion tower!
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
