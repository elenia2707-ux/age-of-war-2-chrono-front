import type {
  AchievementDef,
  DailyMutatorDef,
  DailyMutatorId,
  DifficultyId,
  SanctuaryLevels,
  SanctuaryUpgradeDef,
  SanctuaryUpgradeId,
} from './types';

export const SANCTUARY_UPGRADES: readonly SanctuaryUpgradeDef[] = [
  {
    id: 'starting_gold',
    name: '왕실 군자금 금고',
    shortName: '시작 골드',
    effectText: '전투 시작 골드 +30G / Lv',
    maxLevel: 10,
    baseCost: 15,
    costStep: 12,
    accentColor: '#facc15',
  },
  {
    id: 'combat_doctrine',
    name: '고대 무훈 교범',
    shortName: '전군 공격력',
    effectText: '전 아군 공격력 +4% / Lv',
    maxLevel: 10,
    baseCost: 18,
    costStep: 14,
    accentColor: '#fb923c',
  },
  {
    id: 'eternal_masonry',
    name: '불멸의 성벽 축조',
    shortName: '성채 내구도',
    effectText: '아군 성채 최대체력 +6% / Lv',
    maxLevel: 10,
    baseCost: 15,
    costStep: 12,
    accentColor: '#4ade80',
  },
  {
    id: 'chrono_blessing',
    name: '시공의 깨달음',
    shortName: '경험치 증폭',
    effectText: '모든 XP 획득량 +5% / Lv',
    maxLevel: 10,
    baseCost: 18,
    costStep: 14,
    accentColor: '#38bdf8',
  },
  {
    id: 'royal_mint',
    name: '제국 황금 조폐국',
    shortName: '골드 수익',
    effectText: '초당·처치 골드 +4% / Lv',
    maxLevel: 10,
    baseCost: 20,
    costStep: 15,
    accentColor: '#fde047',
  },
  {
    id: 'starter_relic',
    name: '선발 유물 발굴단',
    shortName: '시작 유물',
    effectText: 'Lv.1 개전 유물 선택 · Lv↑ 고급 유물 확률↑',
    maxLevel: 5,
    baseCost: 30,
    costStep: 28,
    accentColor: '#2dd4bf',
  },
  {
    id: 'command_mastery',
    name: '전술 지휘부 증설',
    shortName: '전술 쿨감',
    effectText: '사령관 전술 스킬 쿨타임 -3.5% / Lv',
    maxLevel: 10,
    baseCost: 18,
    costStep: 14,
    accentColor: '#a855f7',
  },
  {
    id: 'turret_legacy',
    name: '고대 포탑 공학',
    shortName: '포탑 유산',
    effectText: '포탑 공속 +4%·화력 +3%/Lv (Lv.3 시작 슬롯+1)',
    maxLevel: 10,
    baseCost: 20,
    costStep: 15,
    accentColor: '#f43f5e',
  },
];

export const SANCTUARY_BY_ID: Record<SanctuaryUpgradeId, SanctuaryUpgradeDef> =
  SANCTUARY_UPGRADES.reduce(
    (acc, u) => {
      acc[u.id] = u;
      return acc;
    },
    {} as Record<SanctuaryUpgradeId, SanctuaryUpgradeDef>,
  );

export function createInitialSanctuaryLevels(): SanctuaryLevels {
  return {
    starting_gold: 0,
    combat_doctrine: 0,
    eternal_masonry: 0,
    chrono_blessing: 0,
    royal_mint: 0,
    starter_relic: 0,
    command_mastery: 0,
    turret_legacy: 0,
  };
}

export function getSanctuaryCost(id: SanctuaryUpgradeId, currentLevel: number): number | null {
  const def = SANCTUARY_BY_ID[id];
  if (!def || currentLevel >= def.maxLevel) return null;
  return def.baseCost + currentLevel * def.costStep;
}

export function getTotalSanctuaryMedalsSpent(levels: SanctuaryLevels): number {
  let sum = 0;
  for (const def of SANCTUARY_UPGRADES) {
    const lv = levels[def.id] ?? 0;
    for (let i = 0; i < lv; i++) {
      sum += def.baseCost + i * def.costStep;
    }
  }
  return sum;
}

export const DAILY_MUTATORS: Record<DailyMutatorId, DailyMutatorDef> = {
  turbo_forge: {
    id: 'turbo_forge',
    name: '초고속 병기창',
    shortName: '초고속 생산',
    description: '양 진영 유닛 생산속도 +85% · 초당 골드 +45%',
    accentColor: '#38bdf8',
  },
  colossus_war: {
    id: 'colossus_war',
    name: '거신병의 시대',
    shortName: '거신병 대전',
    description: '전 병력 최대체력 +35% · 공성 피해 +25%',
    accentColor: '#fb923c',
  },
  chain_storm: {
    id: 'chain_storm',
    name: '뇌전 폭풍 전선',
    shortName: '뇌전 폭풍',
    description: '모든 원거리·포탑 공격에 30% 연쇄 번개 부여',
    accentColor: '#67e8f9',
  },
  relic_rush: {
    id: 'relic_rush',
    name: '고대 유물의 축복',
    shortName: '유물 대방출',
    description: '전투 시작 즉시 크로노 유물 드래프트 1회 제공',
    accentColor: '#2dd4bf',
  },
  gold_fever: {
    id: 'gold_fever',
    name: '황금 광란제',
    shortName: '황금 광란',
    description: '처치 골드 +55% · 피버 발동 7킬로 단축',
    accentColor: '#facc15',
  },
  rift_overdrive: {
    id: 'rift_overdrive',
    name: '시공 균열 폭주',
    shortName: '균열 폭주',
    description: '중앙 시공 균열이 2배 빠르게 생성되고 효과 강화',
    accentColor: '#c084fc',
  },
  vampiric_front: {
    id: 'vampiric_front',
    name: '핏빛 결투장',
    shortName: '핏빛 흡혈',
    description: '전 병력 흡혈 +14% · 공격속도 +18%',
    accentColor: '#f43f5e',
  },
  siege_blitz: {
    id: 'siege_blitz',
    name: '전격 총력전',
    shortName: '전격 돌파',
    description: '이동속도 +25% · 성채 타격 피해 +40%',
    accentColor: '#ef4444',
  },
};

export const DAILY_MUTATOR_LIST: DailyMutatorDef[] = Object.values(DAILY_MUTATORS);

export interface DailyChallengeInfo {
  dateKey: string;
  seed: number;
  difficulty: DifficultyId;
  mutators: [DailyMutatorId, DailyMutatorId];
}

export function getTodayDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyChallengeInfo(dateKey = getTodayDateKey()): DailyChallengeInfo {
  let hash = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    hash ^= dateKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const seed = (hash >>> 0) || 20261122;
  const diffs: DifficultyId[] = ['normal', 'hard', 'brutal'];
  const difficulty = diffs[seed % diffs.length];

  const ids = DAILY_MUTATOR_LIST.map((m) => m.id);
  const idx1 = (seed >>> 3) % ids.length;
  let idx2 = (seed >>> 7) % (ids.length - 1);
  if (idx2 >= idx1) idx2 += 1;

  return {
    dateKey,
    seed,
    difficulty,
    mutators: [ids[idx1], ids[idx2]],
  };
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first_win', name: '초전 박살', description: '첫 전투에서 승리 달성', medalReward: 20, accentColor: '#4ade80' },
  { id: 'kills_100', name: '백인대장의 무훈', description: '누적 적군 100기 처치', medalReward: 15, accentColor: '#38bdf8' },
  { id: 'kills_500', name: '천군만마 학살자', description: '누적 적군 500기 처치', medalReward: 35, accentColor: '#fb923c' },
  { id: 'kills_2000', name: '시공의 사신', description: '누적 적군 2,000기 처치', medalReward: 75, accentColor: '#f43f5e' },
  { id: 'combo_10', name: '연쇄 섬멸', description: '단일 전투 10 콤보 달성', medalReward: 20, accentColor: '#facc15' },
  { id: 'combo_25', name: '폭풍의 지배자', description: '단일 전투 25 콤보 달성', medalReward: 45, accentColor: '#f97316' },
  { id: 'era_6', name: '화약 혁명가', description: '6시대(화약·근세) 도달', medalReward: 15, accentColor: '#fbbf24' },
  { id: 'era_10', name: '사이버네틱 사령관', description: '10시대(미래 시대) 도달', medalReward: 30, accentColor: '#38bdf8' },
  { id: 'era_12', name: '초월 문명의 각성', description: '최종 12시대(초월 문명) 도달', medalReward: 50, accentColor: '#2dd4bf' },
  { id: 'boss_slayer_1', name: '거물 사냥꾼', description: '시대 수호군주(보스) 첫 처치', medalReward: 25, accentColor: '#fde047' },
  { id: 'boss_slayer_10', name: '군주 파멸자', description: '누적 보스 10기 처치', medalReward: 60, accentColor: '#c084fc' },
  { id: 'relic_collector_6', name: '유물 탐사자', description: '서로 다른 크로노 유물 6종 발견', medalReward: 25, accentColor: '#2dd4bf' },
  { id: 'relic_collector_15', name: '시공 박물관장', description: '서로 다른 크로노 유물 15종 발견', medalReward: 65, accentColor: '#fef08a' },
  { id: 'codex_24', name: '백전연마 지휘관', description: '아군 병종 도감 24종 이상 소환 기록', medalReward: 30, accentColor: '#60a5fa' },
  { id: 'codex_48', name: '전 시대의 통솔자', description: '48종 전 시대 병종 모두 소환 달성', medalReward: 90, accentColor: '#fde047' },
  { id: 'win_hard', name: '전략가의 증명', description: '어려움 이상 난이도 승리', medalReward: 35, accentColor: '#facc15' },
  { id: 'win_brutal', name: '맹공 분쇄자', description: '매우 어려움 이상 난이도 승리', medalReward: 55, accentColor: '#fb923c' },
  { id: 'win_nightmare', name: '악몽을 걷는 자', description: '악몽 이상 난이도 승리', medalReward: 80, accentColor: '#f43f5e' },
  { id: 'win_mythic', name: '신화 속의 정복자', description: '신화 난이도 최종 승리', medalReward: 120, accentColor: '#c084fc' },
  { id: 'speedrun_180', name: '전격전의 달인', description: '정복전 3분(03:00) 이내 승리', medalReward: 45, accentColor: '#38bdf8' },
  { id: 'untouched_fort', name: '난공불락 철옹성', description: '성채 체력 90% 이상 유지하며 승리', medalReward: 40, accentColor: '#4ade80' },
  { id: 'endless_wave_5', name: '차원문 방어선', description: '무한 크로노 웨이브 5웨이브 돌파', medalReward: 30, accentColor: '#a855f7' },
  { id: 'endless_wave_12', name: '영겁의 수호자', description: '무한 크로노 웨이브 12웨이브 돌파', medalReward: 75, accentColor: '#e879f9' },
  { id: 'daily_clear', name: '오늘의 시공 제패', description: '일일 시공 챌린지 클리어', medalReward: 50, accentColor: '#fde047' },
  { id: 'synergy_2', name: '유물 공명 각성', description: '동일 계열 유물 2세트 공명 시너지 발동', medalReward: 25, accentColor: '#38bdf8' },
  { id: 'synergy_3', name: '초월 공명 마스터', description: '동일 계열 유물 3세트 최종 공명 달성', medalReward: 60, accentColor: '#facc15' },
  { id: 'bounty_hunter_5', name: '전장 특임관', description: '전장 긴급 지령 누적 5회 완수', medalReward: 35, accentColor: '#4ade80' },
  { id: 'drone_hunter_3', name: '보물 수송기 사냥꾼', description: '황금 차원 수송기 누적 3기 격추', medalReward: 40, accentColor: '#fde047' },
  { id: 'spoil_collector_20', name: '전장의 수확자', description: '전장 드롭 전리품 직접 터치 회수 20회 달성', medalReward: 25, accentColor: '#fb923c' },
  { id: 'relic_collector_18', name: '만물 유물 지배자', description: '18종 모든 크로노 유물 도감 100% 완성', medalReward: 100, accentColor: '#2dd4bf' },
];
