import type { TurretVisualKind, UnitVisualKind } from '../data/types';
import { isSpriteAtlasReady, renderSpriteToDataUrl } from './spriteAtlas';

const unitIconCache = new Map<UnitVisualKind, string>();
const turretIconCache = new Map<TurretVisualKind, string>();

export function clearIconCache(): void {
  unitIconCache.clear();
  turretIconCache.clear();
}

export function getUnitIconUrl(unitId: UnitVisualKind): string {
  const existing = unitIconCache.get(unitId);
  if (existing) return existing;
  if (typeof document === 'undefined' || !isSpriteAtlasReady()) return '';

  const url = renderSpriteToDataUrl(`unit/${unitId}/player/walk_0`, 96, 72, 4);
  if (!url) return '';
  unitIconCache.set(unitId, url);
  return url;
}

export function getTurretIconUrl(turretId: TurretVisualKind): string {
  const existing = turretIconCache.get(turretId);
  if (existing) return existing;
  if (typeof document === 'undefined' || !isSpriteAtlasReady()) return '';

  const url = renderSpriteToDataUrl(`turret/${turretId}/player/idle`, 96, 72, 8);
  if (!url) return '';
  turretIconCache.set(turretId, url);
  return url;
}
