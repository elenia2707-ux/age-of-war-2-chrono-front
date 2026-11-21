import type { UpgradeCategory, UpgradeDef, UpgradeId, UpgradeLevels } from './types';

export const MAX_UPGRADE_LEVEL = 10;

const STANDARD_UPGRADE_COSTS = [80, 170, 360, 760, 1550, 3200, 6500, 13000, 25000, 48000] as const;
const TACTICAL_UPGRADE_COSTS = [95, 200, 420, 880, 1800, 3700, 7500, 15000, 29000, 54000] as const;
const ECONOMY_UPGRADE_COSTS = [90, 195, 420, 900, 1900, 4000, 8200, 16500, 32000, 60000] as const;
const FORTRESS_UPGRADE_COSTS = [100, 215, 460, 980, 2100, 4400, 9000, 18000, 35000, 65000] as const;

export const UPGRADES: readonly UpgradeDef[] = [
  // Page 1: 전투 강화 (Combat)
  {
    id: 'weapons',
    category: 'combat',
    name: '무기 강화',
    shortName: '무기강화',
    effectText: '공격력 +12%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: STANDARD_UPGRADE_COSTS,
    spriteKey: 'icon/upg_weapons',
  },
  {
    id: 'armor',
    category: 'combat',
    name: '장갑 강화',
    shortName: '장갑강화',
    effectText: '체력 +14%·방어',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: STANDARD_UPGRADE_COSTS,
    spriteKey: 'icon/upg_armor',
  },
  {
    id: 'attack_speed',
    category: 'combat',
    name: '공격 속도',
    shortName: '공속강화',
    effectText: '공속 +8%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_attack_speed',
  },
  {
    id: 'crit_mastery',
    category: 'combat',
    name: '치명타 숙련',
    shortName: '치명타',
    effectText: '치명 +3.5%·배율',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_crit_mastery',
  },
  // Page 2: 지원 강화 (Support & Economy)
  {
    id: 'mobility',
    category: 'support',
    name: '기동·진군',
    shortName: '기동강화',
    effectText: '이속 +7%·저항',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_mobility',
  },
  {
    id: 'economy',
    category: 'support',
    name: '훈련·보급',
    shortName: '훈련보급',
    effectText: '생산·골드↑',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: ECONOMY_UPGRADE_COSTS,
    spriteKey: 'icon/upg_economy',
  },
  {
    id: 'bounty',
    category: 'support',
    name: '약탈·전리품',
    shortName: '전리품',
    effectText: '처치골드·XP↑',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: ECONOMY_UPGRADE_COSTS,
    spriteKey: 'icon/upg_bounty',
  },
  {
    id: 'fortress',
    category: 'support',
    name: '요새·포탑',
    shortName: '요새포탑',
    effectText: '포탑·수리·쿨↓',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: FORTRESS_UPGRADE_COSTS,
    spriteKey: 'icon/upg_fortress',
  },
];

export const UPGRADE_BY_ID: Record<UpgradeId, UpgradeDef> = Object.fromEntries(
  UPGRADES.map((u) => [u.id, u]),
) as Record<UpgradeId, UpgradeDef>;

export function getUpgradesByCategory(category: UpgradeCategory): UpgradeDef[] {
  return UPGRADES.filter((u) => u.category === category);
}

export function createInitialUpgrades(): UpgradeLevels {
  return {
    weapons: 0,
    armor: 0,
    attack_speed: 0,
    crit_mastery: 0,
    mobility: 0,
    economy: 0,
    bounty: 0,
    fortress: 0,
  };
}

export function getTotalUpgradeLevel(upgrades: UpgradeLevels): number {
  return (
    upgrades.weapons +
    upgrades.armor +
    upgrades.attack_speed +
    upgrades.crit_mastery +
    upgrades.mobility +
    upgrades.economy +
    upgrades.bounty +
    upgrades.fortress
  );
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

/** Unit attack speed multiplier (+8% faster attack cadence per attack_speed level) */
export function getAttackSpeedMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.attack_speed * 0.08;
}

/** Bonus critical hit probability (+3.5% per crit_mastery level) */
export function getCritChanceBonus(upgrades: UpgradeLevels): number {
  return upgrades.crit_mastery * 0.035;
}

/** Bonus critical hit multiplier (+0.08 per crit_mastery level, e.g. 1.6x -> 2.4x at Lv.10) */
export function getCritDamageBonus(upgrades: UpgradeLevels): number {
  return upgrades.crit_mastery * 0.08;
}

/** Unit movement speed multiplier (+7% per mobility level) */
export function getMoveSpeedMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.mobility * 0.07;
}

/** Incoming knockback multiplier (-8% knockback taken per mobility level, floor 0.25x) */
export function getKnockbackResistMult(upgrades: UpgradeLevels): number {
  return Math.max(0.25, 1 - upgrades.mobility * 0.08);
}

/** Training speed divisor (+12% faster training per economy level) */
export function getTrainSpeedMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.economy * 0.12;
}

/** Passive gold income multiplier (+15% per economy level) */
export function getGoldIncomeMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.economy * 0.15;
}

/** Kill gold bounty multiplier (+12% per bounty level) */
export function getKillGoldMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.bounty * 0.12;
}

/** Kill XP reward multiplier (+10% per bounty level) */
export function getKillXpMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.bounty * 0.1;
}

/** Turret damage multiplier (+15% per fortress level) */
export function getTurretDamageMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.fortress * 0.15;
}

/** Base Max HP multiplier (+10% per fortress level) */
export function getBaseMaxHpMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.fortress * 0.1;
}

/** Ultimate cooldown multiplier (-4% cooldown per fortress level, floor 0.55x) */
export function getUltimateCooldownMult(upgrades: UpgradeLevels): number {
  return Math.max(0.55, 1 - upgrades.fortress * 0.04);
}

/** Instant base repair ratio on each fortress upgrade purchase (15% of base max HP) */
export const FORTRESS_UPGRADE_REPAIR_RATIO = 0.15;
