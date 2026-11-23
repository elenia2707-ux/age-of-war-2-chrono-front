import type {
  CommanderId,
  DailyMutatorId,
  FactionCombatMods,
  RelicDef,
  RelicId,
  SanctuaryLevels,
} from './types';

export const RELICS: readonly RelicDef[] = [
  {
    id: 'chrono_overclock',
    rarity: 'rare',
    name: '시공 가속 태엽',
    shortName: '가속 태엽',
    effectText: '유닛 생산속도 +32% · 필살기 쿨타임 -20%',
    flavorText: '병영의 시간 흐름을 압축해 끝없는 병력을 쏟아냅니다.',
    accentColor: '#38bdf8',
  },
  {
    id: 'golden_chalice',
    rarity: 'rare',
    name: '황금 연금술 성배',
    shortName: '연금 성배',
    effectText: '초당 골드 +45% · 보급상자 보상 +50%',
    flavorText: '전장의 티끌마저 순금 군자금으로 제련하는 고대 성배입니다.',
    accentColor: '#facc15',
  },
  {
    id: 'blood_oath',
    rarity: 'epic',
    name: '피의 서약 도끼',
    shortName: '피의 도끼',
    effectText: '아군 흡혈 +10% · 체력 50% 이하 공격력 +30%',
    flavorText: '상처가 깊어질수록 더욱 흉포해지는 광전사의 맹세입니다.',
    accentColor: '#f43f5e',
  },
  {
    id: 'thunder_core',
    rarity: 'epic',
    name: '천둥벼락 공명핵',
    shortName: '벼락 공명핵',
    effectText: '원거리·포탑 타격 26% 확률로 주변 2기 연쇄 번개 발동',
    flavorText: '탄환과 화살 끝에 초고압 뇌전 에너지를 응축합니다.',
    accentColor: '#67e8f9',
  },
  {
    id: 'immortal_bastion',
    rarity: 'rare',
    name: '불멸의 수호 문장',
    shortName: '수호 문장',
    effectText: '출전 시 최대체력 22% 보호막 + 성채 초당 0.6% 자동수리',
    flavorText: '성채와 병사 모두에게 꺼지지 않는 수호 결계를 두릅니다.',
    accentColor: '#4ade80',
  },
  {
    id: 'warlord_signet',
    rarity: 'epic',
    name: '전장의 패왕 인장',
    shortName: '패왕 인장',
    effectText: '즉시 ★베테랑 출전 +35% · 베테랑 스탯 보너스 +35%',
    flavorText: '신병조차 백전노장의 기백으로 전선에 합류합니다.',
    accentColor: '#fbbf24',
  },
  {
    id: 'guillotine_blade',
    rarity: 'epic',
    name: '처형자의 단두날',
    shortName: '처형 단두날',
    effectText: '공격력 +16% · 처치 시 주변 아군 최대체력 9% 즉시 회복',
    flavorText: '적의 숨통을 끊는 순간 승리의 활력이 전선에 퍼집니다.',
    accentColor: '#fb7185',
  },
  {
    id: 'prism_split',
    rarity: 'mythic',
    name: '차원 분열 프리즘',
    shortName: '분열 프리즘',
    effectText: '원거리 유닛 공격 시 25% 확률로 추가 투사체/광선 연속 발사',
    flavorText: '평행 시간선의 사격을 현재 전장에 중첩 투사합니다.',
    accentColor: '#2dd4bf',
  },
  {
    id: 'siegebreaker_ram',
    rarity: 'rare',
    name: '공성 파쇄추',
    shortName: '공성 파쇄추',
    effectText: '적 성채·중장갑 피해 +45% · 이동속도 +12%',
    flavorText: '어떤 철옹성도 단숨에 무너뜨리는 중량 돌파 교리입니다.',
    accentColor: '#fb923c',
  },
  {
    id: 'turret_overcharge',
    rarity: 'rare',
    name: '과충전 포탑 코어',
    shortName: '포탑 코어',
    effectText: '포탑 공격력 +40% · 포탑 공속 +28%',
    flavorText: '성채 포탑에 과부하 원자로를 직결해 탄막을 형성합니다.',
    accentColor: '#38bdf8',
  },
  {
    id: 'rewind_hourglass',
    rarity: 'mythic',
    name: '시간 역행 모래시계',
    shortName: '역행 시계',
    effectText: '성채 위기(25%↓) 시 1회 체력 45% 역행 회복 + 피버 발동',
    flavorText: '패배 직전의 시간을 되돌려 전세를 단숨에 뒤집습니다.',
    accentColor: '#fef08a',
  },
  {
    id: 'starlight_bounty',
    rarity: 'rare',
    name: '별빛 현상금 계약서',
    shortName: '현상금 계약',
    effectText: '처치 골드·XP +28% · 정예/보스 보상 1.8배',
    flavorText: '거물을 쓰러뜨릴 때마다 막대한 현상금이 쏟아집니다.',
    accentColor: '#fde047',
  },
  {
    id: 'iron_maiden',
    rarity: 'rare',
    name: '강철 가시 성갑',
    shortName: '가시 성갑',
    effectText: '아군 최대체력 +22% · 방어력 +7%p · 가시 반사 +32%',
    flavorText: '공격을 받아낼수록 적의 선봉대가 스스로 부서집니다.',
    accentColor: '#94a3b8',
  },
  {
    id: 'berserker_horn',
    rarity: 'epic',
    name: '광전사의 뿔피리',
    shortName: '광전 뿔피리',
    effectText: '크로노 피버 필요 킬 10→7킬 단축 · 공격속도 +14%',
    flavorText: '전장이 달아오를수록 황금빛 광란이 끊이지 않습니다.',
    accentColor: '#f97316',
  },
  {
    id: 'imperial_conscription',
    rarity: 'mythic',
    name: '제국 총동원령',
    shortName: '총동원령',
    effectText: '유닛 비용 -15% · 최대 동시 병력 한도 18→22기 확장',
    flavorText: '전선을 가득 메우는 압도적인 대군으로 적을 집어삼킵니다.',
    accentColor: '#c084fc',
  },
  {
    id: 'supernova_catalyst',
    rarity: 'mythic',
    name: '초신성 증폭기',
    shortName: '초신성 핵',
    effectText: '필살기 피해량 +50% · 필살기 XP 소모량 -32%',
    flavorText: '하늘을 가르는 신벌의 위력을 극한까지 증폭합니다.',
    accentColor: '#e879f9',
  },
  {
    id: 'cryo_shard',
    rarity: 'epic',
    name: '절대영도 시공석',
    shortName: '시공 빙결석',
    effectText: '타격 시 35% 확률로 적 2.2초간 이속·공속 28% 둔화',
    flavorText: '적의 시간을 얼어붙게 만들어 일방적인 화력망에 가둡니다.',
    accentColor: '#7dd3fc',
  },
  {
    id: 'meteor_incendiary',
    rarity: 'epic',
    name: '유성 소이 탄두',
    shortName: '유성 탄두',
    effectText: '모든 광역 폭발 반경 +28px · 공격력 +18%',
    flavorText: '모든 포탄과 광역 타격이 거대한 화염 폭풍을 일으킵니다.',
    accentColor: '#ef4444',
  },
];

export const RELIC_BY_ID: Record<RelicId, RelicDef> = RELICS.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<RelicId, RelicDef>,
);

export function createBaseCombatMods(): FactionCombatMods {
  return {
    damageMult: 1,
    attackSpeedMult: 1,
    moveSpeedMult: 1,
    maxHpMult: 1,
    baseMaxHpMult: 1,
    passiveGoldMult: 1,
    killGoldMult: 1,
    xpMult: 1,
    trainSpeedMult: 1,
    unitCostMult: 1,
    turretCostMult: 1,
    turretDamageMult: 1,
    turretRateMult: 1,
    siegeDamageMult: 1,
    ultDamageMult: 1,
    ultCooldownMult: 1,
    ultXpCostMult: 1,
    crateRewardMult: 1,
    shieldBonusRatio: 0,
    lifestealBonus: 0,
    regenBonusPerSec: 0,
    armorBonus: 0,
    thornsBonus: 0,
    splashBonusPx: 0,
    vetSpawnBonus: 0,
    vetStatBonusMult: 1,
    chainLightningChance: 0,
    multishotChance: 0,
    cryoSlowChance: 0,
    baseRegenPerSec: 0,
    executeHealRatio: 0,
    feverKillsTarget: 10,
    maxUnitsBonus: 0,
    hasRewindHourglass: false,
    bloodOathLowHpBonus: 0,
    bountyBossMult: 1,
  };
}

export function computeFactionCombatMods(params: {
  commanderId: CommanderId | null;
  relics: readonly RelicId[];
  sanctuary?: Partial<SanctuaryLevels>;
  mutators?: readonly DailyMutatorId[];
  isPlayer: boolean;
}): FactionCombatMods {
  const m = createBaseCombatMods();
  const { commanderId, relics, sanctuary, mutators, isPlayer } = params;

  // 1. Commander passive doctrine
  if (commanderId === 'vanguard') {
    m.moveSpeedMult *= 1.08;
    m.shieldBonusRatio += 0.12;
  } else if (commanderId === 'ordnance') {
    m.turretDamageMult *= 1.15;
    m.siegeDamageMult *= 1.15;
    m.turretCostMult *= 0.9;
  } else if (commanderId === 'archon') {
    m.passiveGoldMult *= 1.15;
    m.crateRewardMult *= 1.25;
  } else if (commanderId === 'aegis') {
    m.regenBonusPerSec += 0.012;
    m.baseMaxHpMult *= 1.15;
  }

  // 2. Permanent Chrono Sanctuary upgrades (player only)
  if (isPlayer && sanctuary) {
    const combatLv = sanctuary.combat_doctrine ?? 0;
    const masonryLv = sanctuary.eternal_masonry ?? 0;
    const blessingLv = sanctuary.chrono_blessing ?? 0;
    const mintLv = sanctuary.royal_mint ?? 0;
    const turretLv = sanctuary.turret_legacy ?? 0;

    if (combatLv > 0) m.damageMult *= 1 + combatLv * 0.04;
    if (masonryLv > 0) m.baseMaxHpMult *= 1 + masonryLv * 0.06;
    if (blessingLv > 0) m.xpMult *= 1 + blessingLv * 0.05;
    if (mintLv > 0) {
      m.passiveGoldMult *= 1 + mintLv * 0.04;
      m.killGoldMult *= 1 + mintLv * 0.04;
    }
    if (turretLv > 0) {
      m.turretRateMult *= 1 + turretLv * 0.04;
      m.turretDamageMult *= 1 + turretLv * 0.03;
    }
  }

  // 3. Collected Chrono Relics
  for (let i = 0; i < relics.length; i++) {
    switch (relics[i]) {
      case 'chrono_overclock':
        m.trainSpeedMult *= 1.32;
        m.ultCooldownMult *= 0.8;
        break;
      case 'golden_chalice':
        m.passiveGoldMult *= 1.45;
        m.crateRewardMult *= 1.5;
        break;
      case 'blood_oath':
        m.lifestealBonus += 0.1;
        m.bloodOathLowHpBonus += 0.3;
        break;
      case 'thunder_core':
        m.chainLightningChance = Math.min(0.65, m.chainLightningChance + 0.26);
        break;
      case 'immortal_bastion':
        m.shieldBonusRatio += 0.22;
        m.baseRegenPerSec += 0.006;
        break;
      case 'warlord_signet':
        m.vetSpawnBonus += 0.35;
        m.vetStatBonusMult *= 1.35;
        break;
      case 'guillotine_blade':
        m.damageMult *= 1.16;
        m.executeHealRatio += 0.09;
        break;
      case 'prism_split':
        m.multishotChance = Math.min(0.55, m.multishotChance + 0.25);
        break;
      case 'siegebreaker_ram':
        m.siegeDamageMult *= 1.45;
        m.moveSpeedMult *= 1.12;
        break;
      case 'turret_overcharge':
        m.turretDamageMult *= 1.4;
        m.turretRateMult *= 1.28;
        break;
      case 'rewind_hourglass':
        m.hasRewindHourglass = true;
        break;
      case 'starlight_bounty':
        m.killGoldMult *= 1.28;
        m.xpMult *= 1.28;
        m.bountyBossMult *= 1.8;
        break;
      case 'iron_maiden':
        m.maxHpMult *= 1.22;
        m.armorBonus += 0.07;
        m.thornsBonus += 0.32;
        break;
      case 'berserker_horn':
        m.feverKillsTarget = Math.min(m.feverKillsTarget, 7);
        m.attackSpeedMult *= 1.14;
        break;
      case 'imperial_conscription':
        m.unitCostMult *= 0.85;
        m.maxUnitsBonus += 4;
        break;
      case 'supernova_catalyst':
        m.ultDamageMult *= 1.5;
        m.ultXpCostMult *= 0.68;
        break;
      case 'cryo_shard':
        m.cryoSlowChance = Math.min(0.75, m.cryoSlowChance + 0.35);
        break;
      case 'meteor_incendiary':
        m.splashBonusPx += 28;
        m.damageMult *= 1.18;
        break;
    }
  }

  // 4. Daily Challenge Mutators (apply symmetrically unless noted)
  if (mutators) {
    for (let i = 0; i < mutators.length; i++) {
      switch (mutators[i]) {
        case 'turbo_forge':
          m.trainSpeedMult *= 1.85;
          m.passiveGoldMult *= 1.45;
          break;
        case 'colossus_war':
          m.maxHpMult *= 1.35;
          m.siegeDamageMult *= 1.25;
          break;
        case 'chain_storm':
          m.chainLightningChance = Math.min(0.75, m.chainLightningChance + 0.3);
          break;
        case 'gold_fever':
          m.killGoldMult *= 1.55;
          m.feverKillsTarget = Math.min(m.feverKillsTarget, 7);
          break;
        case 'vampiric_front':
          m.lifestealBonus += 0.14;
          m.attackSpeedMult *= 1.18;
          break;
        case 'siege_blitz':
          m.moveSpeedMult *= 1.25;
          m.siegeDamageMult *= 1.4;
          break;
        case 'relic_rush':
        case 'rift_overdrive':
          break;
      }
    }
  }

  return m;
}

export function rollRelicChoices(
  owned: readonly RelicId[],
  randomFn: () => number,
  luckLevel = 0,
  count = 3,
): RelicId[] {
  const pool = RELICS.filter((r) => !owned.includes(r.id));
  if (pool.length <= count) return pool.map((r) => r.id);

  const picked: RelicId[] = [];
  const available = [...pool];

  const weightOf = (r: RelicDef): number => {
    if (r.rarity === 'mythic') return 14 + luckLevel * 4;
    if (r.rarity === 'epic') return 34 + luckLevel * 3;
    return 52;
  };

  while (picked.length < count && available.length > 0) {
    let totalW = 0;
    for (let i = 0; i < available.length; i++) totalW += weightOf(available[i]);
    let roll = randomFn() * totalW;
    let chosenIdx = 0;
    for (let i = 0; i < available.length; i++) {
      roll -= weightOf(available[i]);
      if (roll <= 0) {
        chosenIdx = i;
        break;
      }
    }
    picked.push(available[chosenIdx].id);
    available.splice(chosenIdx, 1);
  }

  return picked;
}
