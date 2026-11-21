import type { TurretVisualKind, UnitVisualKind, UpgradeId } from '../data/types';
import { isSpriteAtlasReady, renderSpriteToDataUrl } from './spriteAtlas';

const unitIconCache = new Map<UnitVisualKind, string>();
const turretIconCache = new Map<TurretVisualKind, string>();
const upgradeIconCache = new Map<UpgradeId, string>();

export function clearIconCache(): void {
  unitIconCache.clear();
  turretIconCache.clear();
  upgradeIconCache.clear();
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

export function getUpgradeIconUrl(upgradeId: UpgradeId): string {
  const existing = upgradeIconCache.get(upgradeId);
  if (existing) return existing;
  if (typeof document === 'undefined' || !isSpriteAtlasReady()) return '';

  const url = renderSpriteToDataUrl(`icon/upg_${upgradeId}`, 72, 60, 6);
  if (!url) return '';
  upgradeIconCache.set(upgradeId, url);
  return url;
}
