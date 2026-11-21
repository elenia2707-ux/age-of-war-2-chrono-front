import type { DifficultyConfig, DifficultyId } from './types';

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    name: '쉬움',
    description: '여유로운 자원 흐름과 완만한 적 공세',
    aiGoldMultiplier: 0.78,
    aiXpMultiplier: 0.8,
    aiThinkInterval: 2.3,
    aiMaxTurrets: 2,
    aiUsesUltimate: false,
    aiEvolveDelay: 6,
    aiMaxUpgradeLevel: 3,
    aiUpgradeChance: 0.22,
  },
  normal: {
    id: 'normal',
    name: '보통',
    description: '균형 잡힌 조합 생산과 시대 진화·강화 대결',
    aiGoldMultiplier: 1.0,
    aiXpMultiplier: 1.0,
    aiThinkInterval: 1.45,
    aiMaxTurrets: 3,
    aiUsesUltimate: true,
    aiEvolveDelay: 2.5,
    aiMaxUpgradeLevel: 6,
    aiUpgradeChance: 0.36,
  },
  hard: {
    id: 'hard',
    name: '어려움',
    description: '공격적인 카운터 병력·스펙 강화·필살기 압박',
    aiGoldMultiplier: 1.24,
    aiXpMultiplier: 1.22,
    aiThinkInterval: 0.95,
    aiMaxTurrets: 4,
    aiUsesUltimate: true,
    aiEvolveDelay: 0.5,
    aiMaxUpgradeLevel: 9,
    aiUpgradeChance: 0.54,
  },
};

export const DIFFICULTY_LIST: DifficultyConfig[] = [
  DIFFICULTIES.easy,
  DIFFICULTIES.normal,
  DIFFICULTIES.hard,
];
