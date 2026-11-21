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

  it('evolves across all 10 eras with HP bonuses, XP checks, and ultimate cooldown resets', () => {
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

    // Cannot evolve past Era 10
    expect(engine.canEvolve('player')).toBe(false);
    expect(engine.evolve('player')).toBe(false);
  });

  it('executes every era ultimate cleanly and damages enemy troops across all 10 eras', () => {
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

  it('applies all 4 gold spec upgrades (weapons, armor, economy, fortress) and preserves bonuses on evolve', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 314);
    engine.player.gold = 100000;

    // 1. Weapons upgrade increases attack damage dealt
    const baseTarget = engine.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    baseTarget.x = 1020;
    baseTarget.attackCooldown = 10;
    const baseAttacker = engine.spawnUnit('player', UNIT_BY_ID.clubman);
    baseAttacker.x = 995;
    baseAttacker.attackCooldown = 0;
    engine.step(0.05);
    const dmgLv0 = baseTarget.maxHp - baseTarget.hp;

    expect(engine.buyUpgrade('player', 'weapons')).toBe(true);
    expect(engine.buyUpgrade('player', 'weapons')).toBe(true);
    expect(engine.buyUpgrade('player', 'weapons')).toBe(true);
    expect(engine.player.upgrades.weapons).toBe(3);

    const upgTarget = engine.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    upgTarget.x = 1320;
    upgTarget.attackCooldown = 10;
    const upgAttacker = engine.spawnUnit('player', UNIT_BY_ID.clubman);
    upgAttacker.x = 1295;
    upgAttacker.attackCooldown = 0;
    engine.step(0.05);
    const dmgLv3 = upgTarget.maxHp - upgTarget.hp;
    expect(dmgLv3).toBeGreaterThan(dmgLv0);

    // 2. Armor upgrade increases live unit maxHp AND newly spawned unit maxHp
    const liveUnit = engine.spawnUnit('player', UNIT_BY_ID.clubman);
    const maxHpBefore = liveUnit.maxHp;
    expect(engine.buyUpgrade('player', 'armor')).toBe(true);
    expect(engine.buyUpgrade('player', 'armor')).toBe(true);
    expect(liveUnit.maxHp).toBeGreaterThan(maxHpBefore);
    const freshUnit = engine.spawnUnit('player', UNIT_BY_ID.clubman);
    expect(freshUnit.maxHp).toBe(Math.round(UNIT_BY_ID.clubman.maxHp * (1 + 2 * 0.14)));

    // 3. Economy upgrade boosts passive gold income and speeds up unit training
    const baseTrainTime = UNIT_BY_ID.dino_rider.trainTime;
    expect(engine.buyUpgrade('player', 'economy')).toBe(true);
    expect(engine.buyUpgrade('player', 'economy')).toBe(true);
    expect(engine.enqueueUnit('player', 'dino_rider')).toBe(true);
    expect(engine.player.queue[0].trainTime).toBeLessThan(baseTrainTime);
    const goldBeforeStep = engine.player.gold;
    for (let t = 0; t < 20; t++) engine.step(0.05);
    // Passive gold should be > base 4G/s due to Lv.2 economy (+30% -> 5.2G/s)
    expect(engine.player.gold - goldBeforeStep).toBeGreaterThan(4.8);

    // 4. Fortress upgrade boosts base max HP, repairs damaged base, and persists through evolve()
    engine.player.baseHp = 200;
    const prevBaseMaxHp = engine.player.baseMaxHp;
    expect(engine.buyUpgrade('player', 'fortress')).toBe(true);
    expect(engine.player.baseMaxHp).toBeGreaterThan(prevBaseMaxHp);
    expect(engine.player.baseHp).toBeGreaterThan(200);

    engine.player.xp = ERAS[0].evolveXp;
    expect(engine.evolve('player')).toBe(true);
    // Era 1 baseMaxHp (820) * 1.1 (Lv.1 fortress) = 902
    expect(engine.player.baseMaxHp).toBe(Math.round(ERAS[1].baseMaxHp * 1.1));

    // 5. Caps cleanly at Lv.8 and cannot buy past MAX
    while (engine.buyUpgrade('player', 'weapons')) {
      // buy to max
    }
    expect(engine.player.upgrades.weapons).toBe(8);
    expect(engine.getUpgradeCost('player', 'weapons')).toBeNull();
    expect(engine.buyUpgrade('player', 'weapons')).toBe(false);
  });

  it('supports piercing railgun/gravity shots, 2x speed, pause, and victory/defeat resolution', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 999);
    engine.player.eraIndex = 8;

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

    // Era 9 Railgun sniper pierces multiple enemy units in a line
    const sniper = engine.spawnUnit('player', UNIT_BY_ID.railgun_sniper);
    sniper.x = 900;
    const e1 = engine.spawnUnit('enemy', UNIT_BY_ID.cyborg);
    const e2 = engine.spawnUnit('enemy', UNIT_BY_ID.cyborg);
    e1.x = 1080;
    e2.x = 1140;

    for (let t = 0; t < 10; t++) engine.step(0.05);
    expect(e1.hp).toBeLessThan(e1.maxHp);
    expect(e2.hp).toBeLessThan(e2.maxHp);

    // Era 10 Gravity sniper also pierces multiple enemies cleanly
    engine.player.eraIndex = 9;
    const gSniper = engine.spawnUnit('player', UNIT_BY_ID.gravity_sniper);
    gSniper.x = 600;
    const g1 = engine.spawnUnit('enemy', UNIT_BY_ID.void_templar);
    const g2 = engine.spawnUnit('enemy', UNIT_BY_ID.void_templar);
    g1.x = 760;
    g2.x = 810;
    for (let t = 0; t < 10; t++) engine.step(0.05);
    expect(g1.hp).toBeLessThan(g1.maxHp);
    expect(g2.hp).toBeLessThan(g2.maxHp);

    // Victory triggers when enemy base HP reaches 0
    engine.enemy.baseHp = 10;
    const attacker = engine.spawnUnit('player', UNIT_BY_ID.omega_titan);
    attacker.x = 2050;
    for (let t = 0; t < 40 && engine.status === 'playing'; t++) engine.step(0.05);
    expect(engine.status).toBe('victory');
    expect(engine.enemy.baseHp).toBe(0);
  });
});
