import { describe, expect, it } from 'vitest';
import { ERAS, UNIT_BY_ID } from '../data/eras';
import { MAX_QUEUE_SIZE, MAX_TURRET_SLOTS, STARTING_GOLD, TURRET_SLOT_COSTS } from '../game/constants';
import { GameEngine } from '../game/engine';

describe('GameEngine Core Simulation', () => {
  it('enqueues units up to max queue size, spawns after trainTime, and refunds 100% on cancel', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 42);
    expect(engine.player.gold).toBe(STARTING_GOLD);

    for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
      expect(engine.enqueueUnit('player', 'clubman')).toBe(true);
    }
    // Queue is now full
    expect(engine.enqueueUnit('player', 'clubman')).toBe(false);
    expect(engine.player.queue).toHaveLength(MAX_QUEUE_SIZE);
    expect(engine.player.gold).toBe(STARTING_GOLD - 15 * MAX_QUEUE_SIZE);

    // Cancel last queued item -> 100% refund
    expect(engine.cancelQueuedUnit('player', 4)).toBe(true);
    expect(engine.player.queue).toHaveLength(MAX_QUEUE_SIZE - 1);
    expect(engine.player.gold).toBe(STARTING_GOLD - 15 * (MAX_QUEUE_SIZE - 1));

    // Advance 1.5s so first clubman finishes training
    for (let t = 0; t < 30; t++) engine.step(0.05);
    expect(engine.units.some((u) => u.team === 'player' && u.def.id === 'clubman')).toBe(true);
  });

  it('expands turret slots up to 4, installs turrets, fires at enemies, and sells for 50% refund', () => {
    const engine = new GameEngine();
    engine.startNewGame('easy', 101);
    engine.player.gold = 3000;

    // Expand from 1 -> 4 slots
    for (const expectedCost of TURRET_SLOT_COSTS) {
      expect(engine.getNextTurretSlotCost('player')).toBe(expectedCost);
      expect(engine.expandTurretSlot('player')).toBe(true);
    }
    expect(engine.player.turretSlots).toBe(MAX_TURRET_SLOTS);
    expect(engine.getNextTurretSlotCost('player')).toBeNull();

    // Install Era 1 turret & verify it attacks a nearby enemy unit
    expect(engine.installTurret('player', 'bone_catapult', 0)).toBe(true);
    const enemy = engine.spawnUnit('enemy', UNIT_BY_ID.clubman);
    enemy.x = 320; // within 350 range

    const initialEnemyHp = enemy.hp;
    for (let t = 0; t < 40; t++) engine.step(0.05);
    expect(enemy.hp).toBeLessThan(initialEnemyHp);

    // Sell turret for 50% refund
    const goldBeforeSell = engine.player.gold;
    expect(engine.sellTurret('player', 0)).toBe(true);
    expect(engine.player.turrets[0]).toBeNull();
    expect(Math.round(engine.player.gold - goldBeforeSell)).toBe(75);
  });

  it('evolves across all 7 eras with HP bonuses, XP checks, and ultimate cooldown resets', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 77);

    // Cannot evolve with 0 XP
    expect(engine.evolve('player')).toBe(false);

    for (let eraIdx = 0; eraIdx < ERAS.length - 1; eraIdx++) {
      const curr = ERAS[eraIdx];
      const next = ERAS[eraIdx + 1];
      engine.player.xp = curr.evolveXp;
      engine.player.ultimateCooldown = 25;
      const prevHp = engine.player.baseHp;

      expect(engine.evolve('player')).toBe(true);
      expect(engine.player.eraIndex).toBe(eraIdx + 1);
      expect(engine.player.baseMaxHp).toBe(next.baseMaxHp);
      expect(engine.player.baseHp).toBe(prevHp + (next.baseMaxHp - curr.baseMaxHp));
      expect(engine.player.ultimateCooldown).toBe(0);
    }

    // Cannot evolve past Era 7
    expect(engine.canEvolve('player')).toBe(false);
    expect(engine.evolve('player')).toBe(false);
  });

  it('executes every era ultimate cleanly and damages enemy troops', () => {
    for (let eraIdx = 0; eraIdx < ERAS.length; eraIdx++) {
      const engine = new GameEngine();
      engine.startNewGame('normal', 500 + eraIdx);
      engine.player.eraIndex = eraIdx;
      engine.player.ultimateCooldown = 0;

      // Spawn a cluster of enemy units in midfield
      const sampleUnit = ERAS[eraIdx].units[0];
      const targets = [0, 1, 2].map((i) => {
        const u = engine.spawnUnit('enemy', sampleUnit);
        u.x = 1100 + i * 35;
        return u;
      });
      const totalBefore = targets.reduce((sum, u) => sum + u.hp, 0);

      expect(engine.triggerUltimate('player')).toBe(true);
      expect(engine.ultimates).toHaveLength(1);

      for (let t = 0; t < 110; t++) engine.step(0.05);

      const totalAfter = targets.reduce((sum, u) => sum + u.hp, 0);
      expect(totalAfter).toBeLessThan(totalBefore);
    }
  });

  it('supports piercing railgun shots, 2x speed, pause, and victory/defeat resolution', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 999);
    engine.player.eraIndex = 6;

    // Pause freezes simulation time
    engine.setPaused(true);
    engine.step(0.05);
    expect(engine.elapsed).toBe(0);
    engine.setPaused(false);

    // 2x speed advances twice as fast
    engine.setSpeed(2);
    engine.step(0.05);
    expect(engine.elapsed).toBeCloseTo(0.1, 4);
    engine.setSpeed(1);

    // Railgun sniper pierces multiple enemy units in a line
    const sniper = engine.spawnUnit('player', UNIT_BY_ID.railgun_sniper);
    sniper.x = 900;
    const e1 = engine.spawnUnit('enemy', UNIT_BY_ID.cyborg);
    const e2 = engine.spawnUnit('enemy', UNIT_BY_ID.cyborg);
    e1.x = 1080;
    e2.x = 1140;

    for (let t = 0; t < 10; t++) engine.step(0.05);
    expect(e1.hp).toBeLessThan(e1.maxHp);
    expect(e2.hp).toBeLessThan(e2.maxHp);

    // Victory triggers when enemy base HP reaches 0
    engine.enemy.baseHp = 10;
    const attacker = engine.spawnUnit('player', UNIT_BY_ID.colossus_mech);
    attacker.x = 2050;
    for (let t = 0; t < 40 && engine.status === 'playing'; t++) engine.step(0.05);
    expect(engine.status).toBe('victory');
    expect(engine.enemy.baseHp).toBe(0);
  });
});
