import type { UpgradeCategory, UpgradeDef, UpgradeId, UpgradeLevels } from './types';

export const MAX_UPGRADE_LEVEL = 10;

export const UPGRADE_CATEGORIES: readonly { id: UpgradeCategory; label: string }[] = [
  { id: 'offense', label: '공격' },
  { id: 'defense', label: '방어' },
  { id: 'tactics', label: '전술' },
  { id: 'empire', label: '제국' },
  { id: 'special', label: '특수' },
  { id: 'command', label: '지휘' },
] as const;

const STANDARD_UPGRADE_COSTS = [80, 170, 360, 760, 1550, 3200, 6500, 13000, 25000, 48000] as const;
const TACTICAL_UPGRADE_COSTS = [95, 200, 420, 880, 1800, 3700, 7500, 15000, 29000, 54000] as const;
const SPECIALIST_UPGRADE_COSTS = [110, 235, 495, 1040, 2150, 4400, 8800, 17500, 34000, 64000] as const;
const ECONOMY_UPGRADE_COSTS = [90, 195, 420, 900, 1900, 4000, 8200, 16500, 32000, 60000] as const;
const FORTRESS_UPGRADE_COSTS = [100, 215, 460, 980, 2100, 4400, 9000, 18000, 35000, 65000] as const;

export const UPGRADES: readonly UpgradeDef[] = [
  // ============================================================================
  // PAGE 1: 공격 (OFFENSE — 4종)
  // ============================================================================
  {
    id: 'weapons',
    category: 'offense',
    name: '무기 강화',
    shortName: '무기강화',
    effectText: '공격력 +12%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: STANDARD_UPGRADE_COSTS,
    spriteKey: 'icon/upg_weapons',
  },
  {
    id: 'attack_speed',
    category: 'offense',
    name: '공격 속도',
    shortName: '공속강화',
    effectText: '공속 +8%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_attack_speed',
  },
  {
    id: 'crit_mastery',
    category: 'offense',
    name: '치명타 숙련',
    shortName: '치명타',
    effectText: '치명 +3.5%·배율',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_crit_mastery',
  },
  {
    id: 'armor_pierce',
    category: 'offense',
    name: '관통·폭발',
    shortName: '관통폭발',
    effectText: '방관 +8%·범위↑',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: SPECIALIST_UPGRADE_COSTS,
    spriteKey: 'icon/upg_armor_pierce',
  },

  // ============================================================================
  // PAGE 2: 방어 (DEFENSE — 4종)
  // ============================================================================
  {
    id: 'armor',
    category: 'defense',
    name: '장갑 강화',
    shortName: '장갑강화',
    effectText: '체력 +14%·방어',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: STANDARD_UPGRADE_COSTS,
    spriteKey: 'icon/upg_armor',
  },
  {
    id: 'regeneration',
    category: 'defense',
    name: '전장 재생',
    shortName: '전장재생',
    effectText: '초당 체력 +1.2%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_regeneration',
  },
  {
    id: 'lifesteal',
    category: 'defense',
    name: '전투 흡혈',
    shortName: '전투흡혈',
    effectText: '피해 흡혈 +3%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: SPECIALIST_UPGRADE_COSTS,
    spriteKey: 'icon/upg_lifesteal',
  },
  {
    id: 'thorns',
    category: 'defense',
    name: '가시 갑옷',
    shortName: '가시갑옷',
    effectText: '근접 반사 +6%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_thorns',
  },

  // ============================================================================
  // PAGE 3: 전술 (TACTICS — 4종)
  // ============================================================================
  {
    id: 'mobility',
    category: 'tactics',
    name: '기동·진군',
    shortName: '기동강화',
    effectText: '이속 +7%·저항',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_mobility',
  },
  {
    id: 'range_optics',
    category: 'tactics',
    name: '사거리·조준',
    shortName: '사거리↑',
    effectText: '사거리 +5%·탄속',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: SPECIALIST_UPGRADE_COSTS,
    spriteKey: 'icon/upg_range_optics',
  },
  {
    id: 'siege_craft',
    category: 'tactics',
    name: '공성 파괴',
    shortName: '공성파괴',
    effectText: '기지·중갑 +10%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: SPECIALIST_UPGRADE_COSTS,
    spriteKey: 'icon/upg_siege_craft',
  },
  {
    id: 'ultimate_power',
    category: 'tactics',
    name: '필살기 증폭',
    shortName: '필살강화',
    effectText: '위력 +15%·쿨↓',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: FORTRESS_UPGRADE_COSTS,
    spriteKey: 'icon/upg_ultimate_power',
  },

  // ============================================================================
  // PAGE 4: 제국 (EMPIRE — 4종)
  // ============================================================================
  {
    id: 'economy',
    category: 'empire',
    name: '훈련·보급',
    shortName: '훈련보급',
    effectText: '생산·골드↑',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: ECONOMY_UPGRADE_COSTS,
    spriteKey: 'icon/upg_economy',
  },
  {
    id: 'bounty',
    category: 'empire',
    name: '약탈·전리품',
    shortName: '전리품',
    effectText: '처치골드·XP↑',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: ECONOMY_UPGRADE_COSTS,
    spriteKey: 'icon/upg_bounty',
  },
  {
    id: 'discount',
    category: 'empire',
    name: '군수 절감',
    shortName: '비용절감',
    effectText: '생산비 -3.5%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: SPECIALIST_UPGRADE_COSTS,
    spriteKey: 'icon/upg_discount',
  },
  {
    id: 'fortress',
    category: 'empire',
    name: '요새·포탑',
    shortName: '요새포탑',
    effectText: '포탑·HP·수리',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: FORTRESS_UPGRADE_COSTS,
    spriteKey: 'icon/upg_fortress',
  },

  // ============================================================================
  // PAGE 5: 특수 (SPECIAL — 4종)
  // ============================================================================
  {
    id: 'xp_mastery',
    category: 'special',
    name: '경험 숙련',
    shortName: '경험숙련',
    effectText: '획득 XP +12%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: ECONOMY_UPGRADE_COSTS,
    spriteKey: 'icon/upg_xp_mastery',
  },
  {
    id: 'ult_efficiency',
    category: 'special',
    name: '필살 절약',
    shortName: '필살절약',
    effectText: '필살 XP -5%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: SPECIALIST_UPGRADE_COSTS,
    spriteKey: 'icon/upg_ult_efficiency',
  },
  {
    id: 'executioner',
    category: 'special',
    name: '처형 본능',
    shortName: '처형본능',
    effectText: '빈사 추뎀 +12%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_executioner',
  },
  {
    id: 'turret_rapid',
    category: 'special',
    name: '포탑 속사',
    shortName: '포탑속사',
    effectText: '포탑 공속·사거리',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: FORTRESS_UPGRADE_COSTS,
    spriteKey: 'icon/upg_turret_rapid',
  },

  // ============================================================================
  // PAGE 6: 지휘 (COMMAND — 4종)
  // ============================================================================
  {
    id: 'vanguard_shield',
    category: 'command',
    name: '선봉 방벽',
    shortName: '선봉방벽',
    effectText: '초기 보호막 +6%',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: TACTICAL_UPGRADE_COSTS,
    spriteKey: 'icon/upg_vanguard_shield',
  },
  {
    id: 'berserk_fury',
    category: 'command',
    name: '전투 광기',
    shortName: '전투광기',
    effectText: '저체력 공·공속↑',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: SPECIALIST_UPGRADE_COSTS,
    spriteKey: 'icon/upg_berserk_fury',
  },
  {
    id: 'veteran_drill',
    category: 'command',
    name: '정예 훈련',
    shortName: '정예훈련',
    effectText: '베테랑 승급·강화',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: SPECIALIST_UPGRADE_COSTS,
    spriteKey: 'icon/upg_veteran_drill',
  },
  {
    id: 'chrono_fever',
    category: 'command',
    name: '피버·보급',
    shortName: '피버보급',
    effectText: '피버·보급상자↑',
    maxLevel: MAX_UPGRADE_LEVEL,
    costs: ECONOMY_UPGRADE_COSTS,
    spriteKey: 'icon/upg_chrono_fever',
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
    attack_speed: 0,
    crit_mastery: 0,
    armor_pierce: 0,
    armor: 0,
    regeneration: 0,
    lifesteal: 0,
    thorns: 0,
    mobility: 0,
    range_optics: 0,
    siege_craft: 0,
    ultimate_power: 0,
    economy: 0,
    bounty: 0,
    discount: 0,
    fortress: 0,
    xp_mastery: 0,
    ult_efficiency: 0,
    executioner: 0,
    turret_rapid: 0,
    vanguard_shield: 0,
    berserk_fury: 0,
    veteran_drill: 0,
    chrono_fever: 0,
  };
}

export function getTotalUpgradeLevel(upgrades: UpgradeLevels): number {
  return (
    upgrades.weapons +
    upgrades.attack_speed +
    upgrades.crit_mastery +
    upgrades.armor_pierce +
    upgrades.armor +
    upgrades.regeneration +
    upgrades.lifesteal +
    upgrades.thorns +
    upgrades.mobility +
    upgrades.range_optics +
    upgrades.siege_craft +
    upgrades.ultimate_power +
    upgrades.economy +
    upgrades.bounty +
    upgrades.discount +
    upgrades.fortress +
    upgrades.xp_mastery +
    upgrades.ult_efficiency +
    upgrades.executioner +
    upgrades.turret_rapid +
    upgrades.vanguard_shield +
    upgrades.berserk_fury +
    upgrades.veteran_drill +
    upgrades.chrono_fever
  );
}

export function getNextUpgradeCost(id: UpgradeId, currentLevel: number): number | null {
  const def = UPGRADE_BY_ID[id];
  if (currentLevel >= def.maxLevel) return null;
  return def.costs[currentLevel] ?? null;
}

// ---- OFFENSE ----

/** Unit attack damage multiplier (+12% per weapons level) */
export function getWeaponDamageMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.weapons * 0.12;
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

/** Fraction of enemy armor ignored (+8% per armor_pierce level, up to 92% max shred) */
export function getArmorPierceFraction(upgrades: UpgradeLevels, innatePierce: boolean): number {
  const base = innatePierce ? 0.6 : 0;
  return Math.min(0.92, base + upgrades.armor_pierce * 0.08);
}

/** Splash radius multiplier (+6% per armor_pierce level) */
export function getSplashRadiusMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.armor_pierce * 0.06;
}

// ---- DEFENSE ----

/** Unit max HP multiplier (+14% per armor level) */
export function getArmorHpMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.armor * 0.14;
}

/** Bonus flat armor mitigation (+1.5% per armor level, capped cleanly in engine) */
export function getArmorMitigationBonus(upgrades: UpgradeLevels): number {
  return upgrades.armor * 0.015;
}

/** Passive max-HP regeneration per second (+1.2% maxHp/s per regeneration level) */
export function getRegenRatePerSec(upgrades: UpgradeLevels): number {
  return upgrades.regeneration * 0.012;
}

/** Lifesteal heal fraction on damage dealt (+3% per lifesteal level) */
export function getLifestealRatio(upgrades: UpgradeLevels): number {
  return upgrades.lifesteal * 0.03;
}

/** Melee damage reflection ratio (+6% per thorns level) */
export function getThornsReflectRatio(upgrades: UpgradeLevels): number {
  return upgrades.thorns * 0.06;
}

// ---- TACTICS ----

/** Unit movement speed multiplier (+7% per mobility level) */
export function getMoveSpeedMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.mobility * 0.07;
}

/** Incoming knockback multiplier (-8% knockback taken per mobility level, floor 0.25x) */
export function getKnockbackResistMult(upgrades: UpgradeLevels): number {
  return Math.max(0.25, 1 - upgrades.mobility * 0.08);
}

/** Ranged unit & turret range multiplier (+5% per range_optics level) */
export function getRangeMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.range_optics * 0.05;
}

/** Projectile travel speed multiplier (+6% per range_optics level) */
export function getProjectileSpeedMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.range_optics * 0.06;
}

/** Bonus damage multiplier vs enemy base & heavy/siege targets (+10% per siege_craft level) */
export function getSiegeDamageMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.siege_craft * 0.1;
}

/** Ultimate strike damage multiplier (+15% per ultimate_power level) */
export function getUltimateDamageMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.ultimate_power * 0.15;
}

/** Ultimate cooldown multiplier (-4% per ultimate_power level & -2% per fortress level, floor 0.45x) */
export function getUltimateCooldownMult(upgrades: UpgradeLevels): number {
  return Math.max(0.45, 1 - upgrades.ultimate_power * 0.04 - upgrades.fortress * 0.02);
}

// ---- EMPIRE ----

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

/** Kill XP reward multiplier (+8% per bounty level) */
export function getKillXpMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.bounty * 0.08;
}

/** Production gold cost discount multiplier (-3.5% per discount level, floor 0.65x) */
export function getCostDiscountMult(upgrades: UpgradeLevels): number {
  return Math.max(0.65, 1 - upgrades.discount * 0.035);
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

// ---- SPECIAL ----

/** All XP gain multiplier (+12% per xp_mastery level across kills, losses & base hits) */
export function getXpMasteryMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.xp_mastery * 0.12;
}

/** Ultimate XP cost multiplier (-5% per ult_efficiency level, floor 0.50x) */
export function getUltimateXpCostMult(upgrades: UpgradeLevels): number {
  return Math.max(0.5, 1 - upgrades.ult_efficiency * 0.05);
}

/** Bonus damage multiplier vs low-HP enemies (<= 40% HP): +12% per executioner level */
export function getExecutionerDamageMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.executioner * 0.12;
}

/** Turret fire rate multiplier (+10% faster turret cadence per turret_rapid level) */
export function getTurretAttackSpeedMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.turret_rapid * 0.1;
}

/** Extra turret range multiplier (+6% per turret_rapid level, stacks with range_optics) */
export function getTurretRapidRangeMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.turret_rapid * 0.06;
}

// ---- COMMAND (지휘) ----

/** Starting energy shield ratio of max HP (+6% per vanguard_shield level, up to 60%) */
export function getVanguardShieldRatio(upgrades: UpgradeLevels): number {
  return upgrades.vanguard_shield * 0.06;
}

/** Dynamic low-HP damage multiplier from Berserk Fury (up to +6% per level as HP approaches 0%) */
export function getBerserkDamageMult(upgrades: UpgradeLevels, hpRatio: number): number {
  if (upgrades.berserk_fury <= 0) return 1;
  const missing = Math.max(0, Math.min(1, 1 - hpRatio));
  return 1 + missing * upgrades.berserk_fury * 0.06;
}

/** Dynamic low-HP attack speed multiplier from Berserk Fury (up to +4% per level as HP approaches 0%) */
export function getBerserkAttackSpeedMult(upgrades: UpgradeLevels, hpRatio: number): number {
  if (upgrades.berserk_fury <= 0) return 1;
  const missing = Math.max(0, Math.min(1, 1 - hpRatio));
  return 1 + missing * upgrades.berserk_fury * 0.04;
}

/** Veteran star rank unlocked for a unit's kill count (accelerated by veteran_drill) */
export function getVeteranRankForKills(kills: number, upgrades: UpgradeLevels): 0 | 1 | 2 | 3 {
  const rank3Kills = upgrades.veteran_drill >= 7 ? 3 : upgrades.veteran_drill >= 3 ? 4 : 5;
  const rank2Kills = upgrades.veteran_drill >= 3 ? 2 : 3;
  if (kills >= rank3Kills) return 3;
  if (kills >= rank2Kills) return 2;
  if (kills >= 1) return 1;
  return 0;
}

/** Veteran star stat multiplier (damage & max HP), amplified +15% per veteran_drill level */
export function getVeteranStatMult(vetRank: 0 | 1 | 2 | 3, upgrades: UpgradeLevels): number {
  const baseBonus = vetRank === 3 ? 0.5 : vetRank === 2 ? 0.3 : vetRank === 1 ? 0.15 : 0;
  if (baseBonus === 0) return 1;
  return 1 + baseBonus * (1 + upgrades.veteran_drill * 0.15);
}

/** Chance for newly deployed units to start immediately at ★ Veteran rank (unlocks at Lv.4+, up to 60%) */
export function getVeteranSpawnChance(upgrades: UpgradeLevels): number {
  if (upgrades.veteran_drill < 4) return 0;
  return Math.min(0.6, (upgrades.veteran_drill - 3) * 0.085);
}

/** Chrono Fever duration in seconds (+10% per chrono_fever level) */
export function getFeverDurationSec(baseSec: number, upgrades: UpgradeLevels): number {
  return baseSec * (1 + upgrades.chrono_fever * 0.1);
}

/** Extra Chrono Fever attack-speed / gold bonus (+2.5% per chrono_fever level) */
export function getFeverPowerBonus(upgrades: UpgradeLevels): number {
  return upgrades.chrono_fever * 0.025;
}

/** Midfield Supply Crate Gold & XP reward multiplier (+15% per chrono_fever level) */
export function getSupplyCrateRewardMult(upgrades: UpgradeLevels): number {
  return 1 + upgrades.chrono_fever * 0.15;
}

/** Midfield Supply Crate drop interval multiplier (-4.5% per chrono_fever level, floor 0.55x) */
export function getSupplyCrateCooldownMult(upgrades: UpgradeLevels): number {
  return Math.max(0.55, 1 - upgrades.chrono_fever * 0.045);
}
