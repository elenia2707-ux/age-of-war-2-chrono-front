import type { UpgradeDef, UpgradeId, UpgradeLevels } from './types';

export const MAX_UPGRADE_LEVEL = 8;

const STANDARD_UPGRADE_COSTS = [80, 180, 400, 880, 1900, 4100, 8800, 18500] as const;

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'weapons',
    name: '무기 강화',
    shortName: '무기강화',
    effectText: '공격력 +12%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: STANDARD_UPGRADE_COSTS,
    spriteKey: 'icon/upg_weapons',
  },
  {
    id: 'armor',
    name: '장갑 강화',
    shortName: '장갑강화',
    effectText: '체력 +14%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: STANDARD_UPGRADE_COSTS,
    spriteKey: 'icon/upg_armor',
  },
  {
    id: 'economy',
    name: '훈련·보급',
    shortName: '훈련보급',
    effectText: '생산·골드↑',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: [90, 200, 440, 960, 2100, 4500, 9600, 20000] as const,
    spriteKey: 'icon/upg_economy',
  },
  {
    id: 'fortress',
    name: '요새·포탑',
    shortName: '요새포탑',
    effectText: '포탑↑·수리',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: [100, 220, 480, 1050, 2300, 4900, 10400, 21500] as const,
    spriteKey: 'icon/upg_fortress',
  },
];

export const UPGRADE_BY_ID: Record<UpgradeId, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
) as Record<UpgradeId, UpgradeDef>;

export function createInitialUpgrades(): UpgradeLevels {
  return {
    weapons: 0,
    armor: 0,
    economy: 0,
    fortress: 0,
  };
}

export function getNextUpgradeCost(id: UpgradeId, currentLevel: number): number | null {
  const def = UPGRADE_BY_ID[id];
  if (currentLevel >= def.maxLevel) return null;
  return def.costs[currentLevel] ?? null;
}

/** Unit attack damage multiplier (+12% per weapons level) */
export function getWeaponDamageMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.weapons * 0.12;
}

/** Unit max HP multiplier (+14% per armor level) */
export function getArmorHpMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.armor * 0.14;
}

/** Bonus flat armor mitigation (+1.5% per armor level, capped cleanly in engine) */
export function getArmorMitigationBonus(upgrades: UpgradeLevels): number {
  return upgrades.armor * 0.015;
}

/** Training speed divisor (+12% faster training per economy level) */
export function getTrainSpeedMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.economy * 0.12;
}

/** Passive gold income multiplier (+15% per economy level) */
export function getGoldIncomeMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.economy * 0.15;
}

/** Turret damage multiplier (+15% per fortress level) */
export function getTurretDamageMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.fortress * 0.15;
}

/** Base Max HP multiplier (+10% per fortress level) */
export function getBaseMaxHpMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.fortress * 0.1;
}

/** Instant base repair ratio on each fortress upgrade purchase (15% of base max HP) */
export const FORTRESS_UPGRADE_REPAIR_RATIO = 0.15;
