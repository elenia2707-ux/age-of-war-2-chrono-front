import { UNIT_BY_ID } from '../data/eras';
import type { TurretVisualKind, UnitVisualKind } from '../data/types';
import { drawTurretArt } from './baseRenderer';
import { renderUnitPose } from './unitRenderer';

const unitIconCache = new Map<UnitVisualKind, string>();
const turretIconCache = new Map<TurretVisualKind, string>();

export function getUnitIconUrl(unitId: UnitVisualKind): string {
  const existing = unitIconCache.get(unitId);
  if (existing) return existing;
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 72;
  canvas.height = 56;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const def = UNIT_BY_ID[unitId];
  const scale = Math.min(54 / Math.max(36, def.width + 12), 44 / Math.max(42, def.height + 6));

  ctx.save();
  ctx.translate(34, 50);
  ctx.scale(scale, scale);
  renderUnitPose(ctx, {
    kind: unitId,
    team: 'player',
    walkPhase: 0.4,
    attackAnim: 0,
    hitFlash: 0,
    deathProgress: 0,
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
  canvas.width = 72;
  canvas.height = 56;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.save();
  ctx.translate(28, 34);
  ctx.scale(1.62, 1.62);
  drawTurretArt(ctx, turretId, 'player', -0.1, 0);
  ctx.restore();

  const url = canvas.toDataURL('image/png');
  turretIconCache.set(turretId, url);
  return url;
}
