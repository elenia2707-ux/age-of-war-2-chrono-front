import { COMMANDERS } from '../data/commanders';
import { ERAS } from '../data/eras';
import {
  ACHIEVEMENTS,
  createInitialSanctuaryLevels,
  getSanctuaryCost,
  getTotalSanctuaryMedalsSpent,
  SANCTUARY_UPGRADES,
} from '../data/metaProgression';
import { RELIC_BY_ID } from '../data/relics';
import type {
  AchievementDef,
  CommanderId,
  DifficultyId,
  GameMode,
  RelicId,
  SanctuaryLevels,
  SanctuaryUpgradeId,
  UnitVisualKind,
} from '../data/types';

export interface PlayerRecords {
  bestVictoryTimeSec: Record<DifficultyId, number | null>;
  victories: number;
  matchesPlayed: number;
  highestEraReached: number; // 1..ERAS.length
  totalKills: number;
  muted: boolean;
  // Meta-progression & Codex
  chronoMedals: number;
  totalMedalsEarned: number;
  selectedCommander: CommanderId;
  sanctuary: SanctuaryLevels;
  unlockedAchievements: string[];
  discoveredUnits: UnitVisualKind[];
  discoveredRelics: RelicId[];
  bestEndlessWave: number;
  bestCombo: number;
  totalBossKills: number;
  dailyClearedDate: string | null;
}

const STORAGE_KEY = 'chrono_front_aow2_records_v1';

const DIFF_RANK: Record<DifficultyId, number> = {
  easy: 0,
  normal: 1,
  hard: 2,
  brutal: 3,
  nightmare: 4,
  mythic: 5,
};

const DIFF_MEDAL_MULT: Record<DifficultyId, number> = {
  easy: 0.85,
  normal: 1.0,
  hard: 1.3,
  brutal: 1.65,
  nightmare: 2.0,
  mythic: 2.5,
};

export function createDefaultRecords(): PlayerRecords {
  return {
    bestVictoryTimeSec: {
      easy: null,
      normal: null,
      hard: null,
      brutal: null,
      nightmare: null,
      mythic: null,
    },
    victories: 0,
    matchesPlayed: 0,
    highestEraReached: 1,
    totalKills: 0,
    muted: false,
    chronoMedals: 0,
    totalMedalsEarned: 0,
    selectedCommander: 'vanguard',
    sanctuary: createInitialSanctuaryLevels(),
    unlockedAchievements: [],
    discoveredUnits: [],
    discoveredRelics: [],
    bestEndlessWave: 0,
    bestCombo: 0,
    totalBossKills: 0,
    dailyClearedDate: null,
  };
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function sanitizeSanctuary(raw?: Partial<SanctuaryLevels>): SanctuaryLevels {
  const clean = createInitialSanctuaryLevels();
  if (!raw) return clean;
  for (const def of SANCTUARY_UPGRADES) {
    const val = raw[def.id];
    if (typeof val === 'number' && Number.isFinite(val)) {
      clean[def.id] = Math.max(0, Math.min(def.maxLevel, Math.floor(val)));
    }
  }
  return clean;
}

export function loadRecords(storage: Storage | null = getStorage()): PlayerRecords {
  const defaults = createDefaultRecords();
  if (!storage) return defaults;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PlayerRecords>;
    const commander =
      parsed.selectedCommander && COMMANDERS[parsed.selectedCommander]
        ? parsed.selectedCommander
        : 'vanguard';
    return {
      bestVictoryTimeSec: {
        easy: parsed.bestVictoryTimeSec?.easy ?? null,
        normal: parsed.bestVictoryTimeSec?.normal ?? null,
        hard: parsed.bestVictoryTimeSec?.hard ?? null,
        brutal: parsed.bestVictoryTimeSec?.brutal ?? null,
        nightmare: parsed.bestVictoryTimeSec?.nightmare ?? null,
        mythic: parsed.bestVictoryTimeSec?.mythic ?? null,
      },
      victories: typeof parsed.victories === 'number' ? parsed.victories : 0,
      matchesPlayed: typeof parsed.matchesPlayed === 'number' ? parsed.matchesPlayed : 0,
      highestEraReached:
        typeof parsed.highestEraReached === 'number'
          ? Math.max(1, Math.min(ERAS.length, parsed.highestEraReached))
          : 1,
      totalKills: typeof parsed.totalKills === 'number' ? parsed.totalKills : 0,
      muted: Boolean(parsed.muted),
      chronoMedals:
        typeof parsed.chronoMedals === 'number' ? Math.max(0, Math.floor(parsed.chronoMedals)) : 0,
      totalMedalsEarned:
        typeof parsed.totalMedalsEarned === 'number'
          ? Math.max(0, Math.floor(parsed.totalMedalsEarned))
          : 0,
      selectedCommander: commander,
      sanctuary: sanitizeSanctuary(parsed.sanctuary),
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements.filter((x): x is string => typeof x === 'string')
        : [],
      discoveredUnits: Array.isArray(parsed.discoveredUnits)
        ? (parsed.discoveredUnits.filter((x) => typeof x === 'string') as UnitVisualKind[])
        : [],
      discoveredRelics: Array.isArray(parsed.discoveredRelics)
        ? (parsed.discoveredRelics.filter(
            (x) => typeof x === 'string' && x in RELIC_BY_ID,
          ) as RelicId[])
        : [],
      bestEndlessWave:
        typeof parsed.bestEndlessWave === 'number'
          ? Math.max(0, Math.floor(parsed.bestEndlessWave))
          : 0,
      bestCombo:
        typeof parsed.bestCombo === 'number' ? Math.max(0, Math.floor(parsed.bestCombo)) : 0,
      totalBossKills:
        typeof parsed.totalBossKills === 'number'
          ? Math.max(0, Math.floor(parsed.totalBossKills))
          : 0,
      dailyClearedDate:
        typeof parsed.dailyClearedDate === 'string' ? parsed.dailyClearedDate : null,
    };
  } catch {
    return defaults;
  }
}

export function saveRecords(
  records: PlayerRecords,
  storage: Storage | null = getStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore quota/private mode errors on Safari
  }
}

function checkAchievements(
  records: PlayerRecords,
  matchCtx?: {
    won: boolean;
    mode: GameMode;
    difficulty: DifficultyId;
    elapsedSec: number;
    baseHpRatio: number;
  },
): AchievementDef[] {
  const newlyUnlocked: AchievementDef[] = [];
  const has = (id: string) => records.unlockedAchievements.includes(id);

  const unlock = (def: AchievementDef) => {
    if (!has(def.id)) {
      records.unlockedAchievements.push(def.id);
      records.chronoMedals += def.medalReward;
      records.totalMedalsEarned += def.medalReward;
      newlyUnlocked.push(def);
    }
  };

  const highestWonRank = ((): number => {
    let rank = -1;
    (Object.keys(DIFF_RANK) as DifficultyId[]).forEach((d) => {
      if (records.bestVictoryTimeSec[d] !== null) {
        rank = Math.max(rank, DIFF_RANK[d]);
      }
    });
    if (matchCtx?.won) {
      rank = Math.max(rank, DIFF_RANK[matchCtx.difficulty]);
    }
    return rank;
  })();

  for (const def of ACHIEVEMENTS) {
    if (has(def.id)) continue;
    switch (def.id) {
      case 'first_win':
        if (records.victories >= 1) unlock(def);
        break;
      case 'kills_100':
        if (records.totalKills >= 100) unlock(def);
        break;
      case 'kills_500':
        if (records.totalKills >= 500) unlock(def);
        break;
      case 'kills_2000':
        if (records.totalKills >= 2000) unlock(def);
        break;
      case 'combo_10':
        if (records.bestCombo >= 10) unlock(def);
        break;
      case 'combo_25':
        if (records.bestCombo >= 25) unlock(def);
        break;
      case 'era_6':
        if (records.highestEraReached >= 6) unlock(def);
        break;
      case 'era_10':
        if (records.highestEraReached >= 10) unlock(def);
        break;
      case 'era_12':
        if (records.highestEraReached >= 12) unlock(def);
        break;
      case 'boss_slayer_1':
        if (records.totalBossKills >= 1) unlock(def);
        break;
      case 'boss_slayer_10':
        if (records.totalBossKills >= 10) unlock(def);
        break;
      case 'relic_collector_6':
        if (records.discoveredRelics.length >= 6) unlock(def);
        break;
      case 'relic_collector_15':
        if (records.discoveredRelics.length >= 15) unlock(def);
        break;
      case 'codex_24':
        if (records.discoveredUnits.length >= 24) unlock(def);
        break;
      case 'codex_48':
        if (records.discoveredUnits.length >= 48) unlock(def);
        break;
      case 'win_hard':
        if (highestWonRank >= DIFF_RANK.hard) unlock(def);
        break;
      case 'win_brutal':
        if (highestWonRank >= DIFF_RANK.brutal) unlock(def);
        break;
      case 'win_nightmare':
        if (highestWonRank >= DIFF_RANK.nightmare) unlock(def);
        break;
      case 'win_mythic':
        if (highestWonRank >= DIFF_RANK.mythic) unlock(def);
        break;
      case 'speedrun_180':
        if (
          matchCtx?.won &&
          matchCtx.mode !== 'endless' &&
          Math.round(matchCtx.elapsedSec) <= 180
        ) {
          unlock(def);
        }
        break;
      case 'untouched_fort':
        if (matchCtx?.won && matchCtx.mode !== 'endless' && matchCtx.baseHpRatio >= 0.9) {
          unlock(def);
        }
        break;
      case 'endless_wave_5':
        if (records.bestEndlessWave >= 5) unlock(def);
        break;
      case 'endless_wave_12':
        if (records.bestEndlessWave >= 12) unlock(def);
        break;
      case 'daily_clear':
        if (records.dailyClearedDate !== null) unlock(def);
        break;
    }
  }

  return newlyUnlocked;
}

export interface MatchResultSummary {
  records: PlayerRecords;
  isNewBestTime: boolean;
  isNewBestWave: boolean;
  medalsEarned: number;
  runMedals: number;
  achievementMedals: number;
  newlyUnlockedAchievements: AchievementDef[];
}

export function recordMatchResult(
  params: {
    won: boolean;
    difficulty: DifficultyId;
    elapsedSec: number;
    eraReached: number;
    kills: number;
    mode?: GameMode;
    waveReached?: number;
    maxCombo?: number;
    bossKills?: number;
    baseHpRatio?: number;
    relicsCollected?: readonly RelicId[];
    dailyDateKey?: string;
  },
  storage: Storage | null = getStorage(),
): MatchResultSummary {
  const records = loadRecords(storage);
  const mode: GameMode = params.mode ?? 'campaign';
  const kills = Math.max(0, Math.floor(params.kills));
  const bossKills = Math.max(0, Math.floor(params.bossKills ?? 0));
  const maxCombo = Math.max(0, Math.floor(params.maxCombo ?? 0));
  const waveReached = Math.max(1, Math.floor(params.waveReached ?? 1));
  const clampedEra = Math.min(ERAS.length, Math.max(1, params.eraReached));

  records.matchesPlayed += 1;
  records.totalKills += kills;
  records.totalBossKills += bossKills;
  records.bestCombo = Math.max(records.bestCombo, maxCombo);
  records.highestEraReached = Math.max(records.highestEraReached, clampedEra);

  if (params.relicsCollected) {
    for (const r of params.relicsCollected) {
      if (!records.discoveredRelics.includes(r)) {
        records.discoveredRelics.push(r);
      }
    }
  }

  let isNewBestTime = false;
  let isNewBestWave = false;
  let dailyFirstClearBonus = 0;

  if (mode === 'endless') {
    if (waveReached > records.bestEndlessWave) {
      records.bestEndlessWave = waveReached;
      isNewBestWave = true;
    }
  } else if (params.won) {
    records.victories += 1;
    const rounded = Math.max(1, Math.round(params.elapsedSec));
    const prev = records.bestVictoryTimeSec[params.difficulty];
    if (prev === null || rounded < prev) {
      records.bestVictoryTimeSec[params.difficulty] = rounded;
      isNewBestTime = true;
    }
    if (mode === 'daily' && params.dailyDateKey) {
      if (records.dailyClearedDate !== params.dailyDateKey) {
        dailyFirstClearBonus = 35;
      }
      records.dailyClearedDate = params.dailyDateKey;
    }
  }

  // Compute Chrono Medals earned from the battle performance
  const diffMult = DIFF_MEDAL_MULT[params.difficulty] ?? 1.0;
  const eraMedals = Math.max(2, Math.round(clampedEra * 2.2));
  const killMedals = Math.floor(kills / 12);
  const bossMedals = bossKills * 6;
  const waveMedals = mode === 'endless' ? Math.max(0, waveReached - 1) * 4 : 0;
  const winBonus = params.won ? 18 : mode === 'endless' && waveReached >= 3 ? 10 : 4;
  const runMedals =
    Math.max(3, Math.round((eraMedals + killMedals + bossMedals + waveMedals + winBonus) * diffMult)) +
    dailyFirstClearBonus;

  records.chronoMedals += runMedals;
  records.totalMedalsEarned += runMedals;

  const newlyUnlockedAchievements = checkAchievements(records, {
    won: params.won,
    mode,
    difficulty: params.difficulty,
    elapsedSec: params.elapsedSec,
    baseHpRatio: params.baseHpRatio ?? 0,
  });

  const achievementMedals = newlyUnlockedAchievements.reduce((acc, a) => acc + a.medalReward, 0);
  const medalsEarned = runMedals + achievementMedals;

  saveRecords(records, storage);
  return {
    records,
    isNewBestTime,
    isNewBestWave,
    medalsEarned,
    runMedals,
    achievementMedals,
    newlyUnlockedAchievements,
  };
}

export function buySanctuaryUpgrade(
  id: SanctuaryUpgradeId,
  storage: Storage | null = getStorage(),
): { ok: boolean; records: PlayerRecords } {
  const records = loadRecords(storage);
  const currentLv = records.sanctuary[id] ?? 0;
  const cost = getSanctuaryCost(id, currentLv);
  if (cost === null || records.chronoMedals < cost) {
    return { ok: false, records };
  }
  records.chronoMedals -= cost;
  records.sanctuary[id] = currentLv + 1;
  saveRecords(records, storage);
  return { ok: true, records };
}

export function resetSanctuaryUpgrades(
  storage: Storage | null = getStorage(),
): { refunded: number; records: PlayerRecords } {
  const records = loadRecords(storage);
  const refunded = getTotalSanctuaryMedalsSpent(records.sanctuary);
  if (refunded > 0) {
    records.chronoMedals += refunded;
    records.sanctuary = createInitialSanctuaryLevels();
    saveRecords(records, storage);
  }
  return { refunded, records };
}

export function setSelectedCommander(
  commanderId: CommanderId,
  storage: Storage | null = getStorage(),
): PlayerRecords {
  const records = loadRecords(storage);
  records.selectedCommander = commanderId;
  saveRecords(records, storage);
  return records;
}

export function recordDiscoveredUnit(
  unitId: UnitVisualKind,
  storage: Storage | null = getStorage(),
): { records: PlayerRecords; newlyUnlocked: AchievementDef[] } {
  const records = loadRecords(storage);
  if (records.discoveredUnits.includes(unitId)) {
    return { records, newlyUnlocked: [] };
  }
  records.discoveredUnits.push(unitId);
  const newlyUnlocked = checkAchievements(records);
  saveRecords(records, storage);
  return { records, newlyUnlocked };
}

export function recordDiscoveredRelic(
  relicId: RelicId,
  storage: Storage | null = getStorage(),
): { records: PlayerRecords; newlyUnlocked: AchievementDef[] } {
  const records = loadRecords(storage);
  if (records.discoveredRelics.includes(relicId)) {
    return { records, newlyUnlocked: [] };
  }
  records.discoveredRelics.push(relicId);
  const newlyUnlocked = checkAchievements(records);
  saveRecords(records, storage);
  return { records, newlyUnlocked };
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '--:--';
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
