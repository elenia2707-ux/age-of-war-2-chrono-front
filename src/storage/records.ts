import { ERAS } from '../data/eras';
import type { DifficultyId } from '../data/types';

export interface PlayerRecords {
  bestVictoryTimeSec: Record<DifficultyId, number | null>;
  victories: number;
  matchesPlayed: number;
  highestEraReached: number; // 1..ERAS.length
  totalKills: number;
  muted: boolean;
}

const STORAGE_KEY = 'chrono_front_aow2_records_v1';

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

export function loadRecords(storage: Storage | null = getStorage()): PlayerRecords {
  const defaults = createDefaultRecords();
  if (!storage) return defaults;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PlayerRecords>;
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

export function recordMatchResult(
  params: {
    won: boolean;
    difficulty: DifficultyId;
    elapsedSec: number;
    eraReached: number;
    kills: number;
  },
  storage: Storage | null = getStorage(),
): { records: PlayerRecords; isNewBestTime: boolean } {
  const records = loadRecords(storage);
  records.matchesPlayed += 1;
  records.totalKills += Math.max(0, Math.floor(params.kills));
  records.highestEraReached = Math.max(
    records.highestEraReached,
    Math.min(ERAS.length, Math.max(1, params.eraReached)),
  );

  let isNewBestTime = false;
  if (params.won) {
    records.victories += 1;
    const rounded = Math.max(1, Math.round(params.elapsedSec));
    const prev = records.bestVictoryTimeSec[params.difficulty];
    if (prev === null || rounded < prev) {
      records.bestVictoryTimeSec[params.difficulty] = rounded;
      isNewBestTime = true;
    }
  }

  saveRecords(records, storage);
  return { records, isNewBestTime };
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '--:--';
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
