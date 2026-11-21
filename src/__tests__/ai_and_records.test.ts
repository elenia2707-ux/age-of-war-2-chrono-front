import { describe, expect, it } from 'vitest';
import { BattleCamera } from '../game/camera';
import { WORLD_WIDTH } from '../game/constants';
import { GameEngine } from '../game/engine';
import { formatDuration, loadRecords, recordMatchResult } from '../storage/records';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (idx: number) => Array.from(store.keys())[idx] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('Enemy AI, Camera & Local Records', () => {
  it('enemy AI spawns units, builds turrets, buys gold upgrades, and evolves over time', () => {
    const engine = new GameEngine();
    engine.startNewGame('hard', 2026);
    engine.enemy.xp = 500;
    engine.enemy.gold = 3500;

    // Run 12 seconds of simulation
    for (let i = 0; i < 240; i++) engine.step(0.05);

    expect(engine.enemy.eraIndex).toBeGreaterThanOrEqual(1);
    expect(engine.enemy.unitsSpawned).toBeGreaterThan(0);
    const totalEnemyUpgrades = Object.values(engine.enemy.upgrades).reduce((a, b) => a + b, 0);
    expect(totalEnemyUpgrades).toBeGreaterThan(0);
  });

  it('caps EnemyAI gold upgrade levels by difficulty (easy <= Lv.3 across all 8 upgrades)', () => {
    const engine = new GameEngine();
    engine.startNewGame('easy', 1337);
    engine.enemy.gold = 200000;

    for (let i = 0; i < 400; i++) engine.step(0.05);

    for (const lvl of Object.values(engine.enemy.upgrades)) {
      expect(lvl).toBeLessThanOrEqual(3);
    }
  });

  it('clamps BattleCamera safely inside world bounds and decays drag velocity', () => {
    const cam = new BattleCamera();
    cam.setViewport(852, 393);

    cam.jumpToWorldX(-500);
    expect(cam.x).toBe(0);

    cam.jumpToWorldX(WORLD_WIDTH + 500);
    expect(cam.x).toBeCloseTo(cam.getMaxX(), 4);

    cam.beginDrag();
    cam.dragByScreenDelta(40, 393);
    cam.endDrag();
    const velAfterDrag = Math.abs(cam.velocity);
    expect(velAfterDrag).toBeGreaterThan(0);

    cam.update(0.25);
    expect(Math.abs(cam.velocity)).toBeLessThan(velAfterDrag);
  });

  it('persists high scores, fastest victory per difficulty, and formats durations', () => {
    const storage = createMemoryStorage();
    const initial = loadRecords(storage);
    expect(initial.victories).toBe(0);
    expect(initial.bestVictoryTimeSec.normal).toBeNull();

    const first = recordMatchResult(
      { won: true, difficulty: 'normal', elapsedSec: 245, eraReached: 6, kills: 42 },
      storage,
    );
    expect(first.isNewBestTime).toBe(true);
    expect(first.records.bestVictoryTimeSec.normal).toBe(245);
    expect(first.records.highestEraReached).toBe(6);

    const slower = recordMatchResult(
      { won: true, difficulty: 'normal', elapsedSec: 310, eraReached: 10, kills: 60 },
      storage,
    );
    expect(slower.isNewBestTime).toBe(false);
    expect(slower.records.bestVictoryTimeSec.normal).toBe(245);
    expect(slower.records.highestEraReached).toBe(10);
    expect(slower.records.totalKills).toBe(102);

    expect(formatDuration(245)).toBe('04:05');
    expect(formatDuration(null)).toBe('--:--');
  });
});
