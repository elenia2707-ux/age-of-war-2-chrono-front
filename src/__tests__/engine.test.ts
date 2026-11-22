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

  it('requires & deducts XP to execute every era ultimate cleanly across all 10 eras', () => {
    for (let eraIdx = 0; eraIdx < ERAS.length; eraIdx++) {
      const engine = new GameEngine();
      engine.startNewGame('normal', 500 + eraIdx);
      engine.player.eraIndex = eraIdx;
      engine.player.ultimateCooldown = 0;

      // Without enough XP, ultimate MUST be blocked (no free spamming!)
      engine.player.xp = ERAS[eraIdx].ultimate.xpCost - 1;
      expect(engine.canUseUltimate('player')).toBe(false);
      expect(engine.triggerUltimate('player')).toBe(false);

      // Grant sufficient XP -> ultimate casts and deducts exact XP cost
      const cost = engine.getUltimateXpCost('player');
      engine.player.xp = cost + 50;

      // Spawn a cluster of enemy units in midfield
      const sampleUnit = ERAS[eraIdx].units[0];
      const targets = [0, 1, 2].map((i) => {
        const u = engine.spawnUnit('enemy', sampleUnit);
        u.x = 1100 + i * 35;
        return u;
      });
      const totalBefore = targets.reduce((sum, u) => sum + u.hp, 0);

      expect(engine.triggerUltimate('player')).toBe(true);
      expect(engine.player.xp).toBe(50);
      expect(engine.ultimates).toHaveLength(1);

      for (let t = 0; t < 110; t++) engine.step(0.05);

      const totalAfter = targets.reduce((sum, u) => sum + u.hp, 0);
      expect(totalAfter).toBeLessThan(totalBefore);
    }
  });

  it('applies all 8 gold spec upgrades up to Lv.10 and preserves bonuses on evolve', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 314);
    engine.player.gold = 500000;

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

    // 3. Attack Speed & Crit Mastery upgrades shorten attack cooldown and elevate crit output
    expect(engine.buyUpgrade('player', 'attack_speed')).toBe(true);
    expect(engine.buyUpgrade('player', 'attack_speed')).toBe(true);
    expect(engine.buyUpgrade('player', 'crit_mastery')).toBe(true);
    const fastAttacker = engine.spawnUnit('player', UNIT_BY_ID.clubman);
    fastAttacker.x = 1600;
    fastAttacker.attackCooldown = 0;
    const dummyEnemy = engine.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    dummyEnemy.x = 1625;
    dummyEnemy.attackCooldown = 10;
    engine.step(0.05);
    // Attack cooldown should be strictly faster than base 1 / attackRate
    expect(fastAttacker.attackCooldown).toBeLessThan(1 / UNIT_BY_ID.clubman.attackRate);

    // 4. Mobility upgrade boosts march speed
    const walkerBefore = engine.spawnUnit('player', UNIT_BY_ID.clubman);
    walkerBefore.x = 400;
    engine.step(0.05);
    const dxLv0 = walkerBefore.x - 400;
    expect(engine.buyUpgrade('player', 'mobility')).toBe(true);
    expect(engine.buyUpgrade('player', 'mobility')).toBe(true);
    expect(engine.buyUpgrade('player', 'mobility')).toBe(true);
    const walkerAfter = engine.spawnUnit('player', UNIT_BY_ID.clubman);
    walkerAfter.x = 400;
    engine.step(0.05);
    const dxLv3 = walkerAfter.x - 400;
    expect(dxLv3).toBeGreaterThan(dxLv0);

    // 5. Economy upgrade boosts passive gold income and speeds up unit training
    const baseTrainTime = UNIT_BY_ID.dino_rider.trainTime;
    expect(engine.buyUpgrade('player', 'economy')).toBe(true);
    expect(engine.buyUpgrade('player', 'economy')).toBe(true);
    expect(engine.enqueueUnit('player', 'dino_rider')).toBe(true);
    expect(engine.player.queue[0].trainTime).toBeLessThan(baseTrainTime);
    const goldBeforeStep = engine.player.gold;
    for (let t = 0; t < 20; t++) engine.step(0.05);
    // Passive gold should be > base 4G/s due to Lv.2 economy (+30% -> 5.2G/s)
    expect(engine.player.gold - goldBeforeStep).toBeGreaterThan(4.8);

    // 6. Bounty upgrade boosts kill gold & kill XP rewards
    expect(engine.buyUpgrade('player', 'bounty')).toBe(true);
    expect(engine.buyUpgrade('player', 'bounty')).toBe(true);
    expect(engine.buyUpgrade('player', 'bounty')).toBe(true);
    const weakEnemy = engine.spawnUnit('enemy', UNIT_BY_ID.clubman);
    weakEnemy.x = 1800;
    weakEnemy.hp = 1;
    weakEnemy.attackCooldown = 10;
    const slayer = engine.spawnUnit('player', UNIT_BY_ID.dino_rider);
    slayer.x = 1775;
    slayer.attackCooldown = 0;
    const xpBeforeKill = engine.player.xp;
    engine.step(0.05);
    expect(engine.player.xp - xpBeforeKill).toBeGreaterThan(UNIT_BY_ID.clubman.killXp);

    // 7. Fortress upgrade boosts base max HP, repairs damaged base, reduces ult cooldown, and persists through evolve()
    engine.player.baseHp = 200;
    const prevBaseMaxHp = engine.player.baseMaxHp;
    const prevUltMaxCd = engine.player.ultimateMaxCooldown;
    expect(engine.buyUpgrade('player', 'fortress')).toBe(true);
    expect(engine.player.baseMaxHp).toBeGreaterThan(prevBaseMaxHp);
    expect(engine.player.baseHp).toBeGreaterThan(200);
    expect(engine.player.ultimateMaxCooldown).toBeLessThan(prevUltMaxCd);

    engine.player.xp = ERAS[0].evolveXp;
    expect(engine.evolve('player')).toBe(true);
    expect(engine.player.baseMaxHp).toBe(Math.round(ERAS[1].baseMaxHp * 1.1));
    expect(engine.player.ultimateMaxCooldown).toBeLessThan(ERAS[1].ultimate.cooldown);

    // 8. Caps cleanly at Lv.10 and cannot buy past MAX
    while (engine.buyUpgrade('player', 'weapons')) {
      // buy to max
    }
    expect(engine.player.upgrades.weapons).toBe(10);
    expect(engine.getUpgradeCost('player', 'weapons')).toBeNull();
    expect(engine.buyUpgrade('player', 'weapons')).toBe(false);
  });

  it('applies all 8 newly added spec upgrades (armor_pierce, regeneration, lifesteal, thorns, range_optics, siege_craft, ultimate_power, discount)', () => {
    // 1. Discount reduces unit & turret gold costs cleanly
    const engDisc = new GameEngine();
    engDisc.startNewGame('normal', 601);
    engDisc.player.gold = 100000;
    const baseUnitCost = engDisc.getEffectiveUnitCost('player', UNIT_BY_ID.dino_rider.cost);
    const baseTurretCost = engDisc.getEffectiveTurretCost('player', ERAS[0].turrets[0].cost);
    for (let i = 0; i < 4; i++) expect(engDisc.buyUpgrade('player', 'discount')).toBe(true);
    const discUnitCost = engDisc.getEffectiveUnitCost('player', UNIT_BY_ID.dino_rider.cost);
    const discTurretCost = engDisc.getEffectiveTurretCost('player', ERAS[0].turrets[0].cost);
    expect(discUnitCost).toBeLessThan(baseUnitCost);
    expect(discTurretCost).toBeLessThan(baseTurretCost);
    const goldBeforeQueue = engDisc.player.gold;
    expect(engDisc.enqueueUnit('player', 'dino_rider')).toBe(true);
    expect(engDisc.player.gold).toBe(goldBeforeQueue - discUnitCost);

    // 2. Regeneration passively heals injured units over time
    const engRegen = new GameEngine();
    engRegen.startNewGame('normal', 602);
    engRegen.player.gold = 100000;
    for (let i = 0; i < 5; i++) expect(engRegen.buyUpgrade('player', 'regeneration')).toBe(true);
    const injured = engRegen.spawnUnit('player', UNIT_BY_ID.dino_rider);
    injured.x = 600;
    injured.hp = injured.maxHp * 0.5;
    const hpBeforeRegen = injured.hp;
    for (let t = 0; t < 20; t++) engRegen.step(0.05);
    expect(injured.hp).toBeGreaterThan(hpBeforeRegen);

    // 3. Lifesteal heals attacking unit when dealing damage
    const engLife = new GameEngine();
    engLife.startNewGame('normal', 603);
    engLife.player.gold = 100000;
    for (let i = 0; i < 5; i++) expect(engLife.buyUpgrade('player', 'lifesteal')).toBe(true);
    const leecher = engLife.spawnUnit('player', UNIT_BY_ID.dino_rider);
    leecher.x = 1000;
    leecher.hp = leecher.maxHp * 0.5;
    leecher.attackCooldown = 0;
    const dummy = engLife.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    dummy.x = 1030;
    dummy.attackCooldown = 10;
    const leechHpBefore = leecher.hp;
    engLife.step(0.05);
    expect(leecher.hp).toBeGreaterThan(leechHpBefore);

    // 4. Thorns reflects melee damage back onto enemy attackers without infinite recursion
    const engThorns = new GameEngine();
    engThorns.startNewGame('normal', 604);
    engThorns.player.gold = 100000;
    for (let i = 0; i < 5; i++) expect(engThorns.buyUpgrade('player', 'thorns')).toBe(true);
    const defender = engThorns.spawnUnit('player', UNIT_BY_ID.dino_rider);
    defender.x = 1000;
    defender.attackCooldown = 10;
    const meleeEnemy = engThorns.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    meleeEnemy.x = 1030;
    meleeEnemy.attackCooldown = 0;
    const enemyHpBefore = meleeEnemy.hp;
    engThorns.step(0.05);
    expect(meleeEnemy.hp).toBeLessThan(enemyHpBefore);

    // 5. Armor Pierce shreds enemy armor for higher net damage against heavily armored targets
    const engNoPierce = new GameEngine();
    engNoPierce.startNewGame('normal', 605);
    const tBase = engNoPierce.spawnUnit('enemy', UNIT_BY_ID.heavy_cavalry);
    tBase.x = 1030;
    tBase.attackCooldown = 10;
    const aBase = engNoPierce.spawnUnit('player', UNIT_BY_ID.knight);
    aBase.x = 1000;
    aBase.attackCooldown = 0;
    engNoPierce.step(0.05);
    const dmgNoPierce = tBase.maxHp - tBase.hp;

    const engPierce = new GameEngine();
    engPierce.startNewGame('normal', 605);
    engPierce.player.gold = 100000;
    for (let i = 0; i < 5; i++) expect(engPierce.buyUpgrade('player', 'armor_pierce')).toBe(true);
    const tPierced = engPierce.spawnUnit('enemy', UNIT_BY_ID.heavy_cavalry);
    tPierced.x = 1030;
    tPierced.attackCooldown = 10;
    const aPierced = engPierce.spawnUnit('player', UNIT_BY_ID.knight);
    aPierced.x = 1000;
    aPierced.attackCooldown = 0;
    engPierce.step(0.05);
    const dmgWithPierce = tPierced.maxHp - tPierced.hp;
    expect(dmgWithPierce).toBeGreaterThan(dmgNoPierce);

    // 6. Range Optics lets ranged units engage from further away
    const engRange = new GameEngine();
    engRange.startNewGame('normal', 606);
    engRange.player.gold = 100000;
    for (let i = 0; i < 6; i++) expect(engRange.buyUpgrade('player', 'range_optics')).toBe(true);
    const shooter = engRange.spawnUnit('player', UNIT_BY_ID.slinger);
    shooter.x = 700;
    shooter.attackCooldown = 0;
    const farEnemy = engRange.spawnUnit('enemy', UNIT_BY_ID.clubman);
    // Base slinger range is 175; place enemy at +205px so ONLY upgraded optics can shoot immediately
    farEnemy.x = 700 + UNIT_BY_ID.slinger.range + 28;
    farEnemy.attackCooldown = 10;
    engRange.step(0.05);
    expect(engRange.projectiles.length).toBeGreaterThan(0);

    // 7. Siege Craft boosts damage dealt against enemy base
    const engNoSiege = new GameEngine();
    engNoSiege.startNewGame('normal', 607);
    const sBase = engNoSiege.spawnUnit('player', UNIT_BY_ID.dino_rider);
    sBase.x = 2155;
    sBase.attackCooldown = 0;
    engNoSiege.step(0.05);
    const baseDmgLv0 = engNoSiege.enemy.baseMaxHp - engNoSiege.enemy.baseHp;

    const engSiege = new GameEngine();
    engSiege.startNewGame('normal', 607);
    engSiege.player.gold = 100000;
    for (let i = 0; i < 5; i++) expect(engSiege.buyUpgrade('player', 'siege_craft')).toBe(true);
    const sUpg = engSiege.spawnUnit('player', UNIT_BY_ID.dino_rider);
    sUpg.x = 2155;
    sUpg.attackCooldown = 0;
    engSiege.step(0.05);
    const baseDmgLv5 = engSiege.enemy.baseMaxHp - engSiege.enemy.baseHp;
    expect(baseDmgLv5).toBeGreaterThan(baseDmgLv0);

    // 8. Ultimate Power reduces ultimate max cooldown and increases ultimate strike damage
    const engUlt = new GameEngine();
    engUlt.startNewGame('normal', 608);
    engUlt.player.gold = 100000;
    const ultCdBefore = engUlt.player.ultimateMaxCooldown;
    for (let i = 0; i < 4; i++) expect(engUlt.buyUpgrade('player', 'ultimate_power')).toBe(true);
    expect(engUlt.player.ultimateMaxCooldown).toBeLessThan(ultCdBefore);
  });

  it('applies all 4 Special mastery upgrades (xp_mastery, ult_efficiency, executioner, turret_rapid)', () => {
    // 1. XP Mastery increases kill XP & base-hit XP
    const engXp = new GameEngine();
    engXp.startNewGame('normal', 701);
    engXp.player.gold = 100000;
    for (let i = 0; i < 5; i++) expect(engXp.buyUpgrade('player', 'xp_mastery')).toBe(true);
    const victim = engXp.spawnUnit('enemy', UNIT_BY_ID.clubman);
    victim.x = 1230;
    victim.hp = 1;
    victim.attackCooldown = 10;
    const slayer = engXp.spawnUnit('player', UNIT_BY_ID.dino_rider);
    slayer.x = 1200;
    slayer.attackCooldown = 0;
    engXp.step(0.05);
    expect(engXp.player.xp).toBeGreaterThan(UNIT_BY_ID.clubman.killXp);

    // 2. Ultimate Efficiency cuts ultimate XP cost
    const engEff = new GameEngine();
    engEff.startNewGame('normal', 702);
    engEff.player.gold = 100000;
    const baseCost = engEff.getUltimateXpCost('player');
    for (let i = 0; i < 6; i++) expect(engEff.buyUpgrade('player', 'ult_efficiency')).toBe(true);
    expect(engEff.getUltimateXpCost('player')).toBeLessThan(baseCost);

    // 3. Executioner deals bonus finisher damage to targets at <= 40% HP
    const engBaseExec = new GameEngine();
    engBaseExec.startNewGame('normal', 703);
    const lowTargetA = engBaseExec.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    lowTargetA.x = 1030;
    lowTargetA.hp = lowTargetA.maxHp * 0.35;
    lowTargetA.attackCooldown = 10;
    const hitA = engBaseExec.spawnUnit('player', UNIT_BY_ID.clubman);
    hitA.x = 1000;
    hitA.attackCooldown = 0;
    const hpBeforeA = lowTargetA.hp;
    engBaseExec.step(0.05);
    const dmgBase = hpBeforeA - lowTargetA.hp;

    const engExec = new GameEngine();
    engExec.startNewGame('normal', 703);
    engExec.player.gold = 100000;
    for (let i = 0; i < 6; i++) expect(engExec.buyUpgrade('player', 'executioner')).toBe(true);
    const lowTargetB = engExec.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    lowTargetB.x = 1030;
    lowTargetB.hp = lowTargetB.maxHp * 0.35;
    lowTargetB.attackCooldown = 10;
    const hitB = engExec.spawnUnit('player', UNIT_BY_ID.clubman);
    hitB.x = 1000;
    hitB.attackCooldown = 0;
    const hpBeforeB = lowTargetB.hp;
    engExec.step(0.05);
    const dmgExec = hpBeforeB - lowTargetB.hp;
    expect(dmgExec).toBeGreaterThan(dmgBase);

    // 4. Turret Rapid boosts turret fire rate (shorter cooldown) and range
    const engTurret = new GameEngine();
    engTurret.startNewGame('normal', 704);
    engTurret.player.gold = 100000;
    for (let i = 0; i < 5; i++) expect(engTurret.buyUpgrade('player', 'turret_rapid')).toBe(true);
    expect(engTurret.installTurret('player', 'bone_catapult', 0)).toBe(true);
    const farTarget = engTurret.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    // bone_catapult base range is 350 from turret mount (~155); place beyond base range at 540
    farTarget.x = 540;
    farTarget.attackCooldown = 10;
    for (let t = 0; t < 10; t++) engTurret.step(0.05);
    expect(engTurret.projectiles.length).toBeGreaterThan(0);
    expect(engTurret.player.turrets[0]!.cooldown).toBeLessThan(1 / ERAS[0].turrets[1].attackRate);
  });

  it('supports tesla_arc chain lightning, railgun/gravity piercing, hover units, 2x speed, pause, and victory resolution', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 999);
    engine.player.eraIndex = 5;

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

    // Era 6 Tesla Coil Trooper chains lightning across 2 enemies!
    const tesla = engine.spawnUnit('player', UNIT_BY_ID.tesla_coil_trooper);
    tesla.x = 700;
    tesla.attackCooldown = 0;
    const t1 = engine.spawnUnit('enemy', UNIT_BY_ID.steam_trooper);
    const t2 = engine.spawnUnit('enemy', UNIT_BY_ID.steam_trooper);
    t1.x = 840;
    t2.x = 890;
    engine.step(0.05);
    expect(t1.hp).toBeLessThan(t1.maxHp);
    expect(t2.hp).toBeLessThan(t2.maxHp);
    expect(engine.beams.some((b) => b.style === 'tesla_arc')).toBe(true);

    // Era 9 Railgun sniper pierces multiple enemy units in a line
    engine.player.eraIndex = 8;
    const sniper = engine.spawnUnit('player', UNIT_BY_ID.railgun_sniper);
    sniper.x = 900;
    const e1 = engine.spawnUnit('enemy', UNIT_BY_ID.cyborg);
    const e2 = engine.spawnUnit('enemy', UNIT_BY_ID.cyborg);
    e1.x = 1080;
    e2.x = 1140;

    for (let t = 0; t < 10; t++) engine.step(0.05);
    expect(e1.hp).toBeLessThan(e1.maxHp);
    expect(e2.hp).toBeLessThan(e2.maxHp);

    // Era 9 Hover Drone & Era 10 Star Archon have hoverHeight and fire cleanly
    expect(UNIT_BY_ID.hover_drone.hoverHeight).toBeGreaterThan(0);
    expect(UNIT_BY_ID.star_archon.hoverHeight).toBeGreaterThan(0);

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

  it('supports Veteran unit promotions (★/★★/★★★), Chrono Fever 10-kill rush, and Midfield Supply Crates', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 888);

    // 1. Midfield Chrono Supply Crate lands and awards bonus Gold + XP when destroyed by units
    const crate = engine.spawnSupplyCrate(1100);
    crate.y = 326;
    crate.landed = true;
    crate.hp = 10;
    const goldBeforeCrate = engine.player.gold;
    const xpBeforeCrate = engine.player.xp;
    const raider = engine.spawnUnit('player', UNIT_BY_ID.dino_rider);
    raider.x = 1065;
    raider.attackCooldown = 0;
    engine.step(0.05);
    expect(engine.supplyCrates).toHaveLength(0);
    expect(engine.player.gold).toBeGreaterThanOrEqual(goldBeforeCrate + crate.goldReward);
    expect(engine.player.xp).toBeGreaterThanOrEqual(xpBeforeCrate + crate.xpReward);

    // 2. Unit Veteran Promotion (1 -> ★, 3 -> ★★, 5 -> ★★★) + Chrono Fever at 10 kills
    const hero = engine.spawnUnit('player', UNIT_BY_ID.dino_rider);
    hero.x = 1200;
    const initialHeroMaxHp = hero.maxHp;

    for (let k = 0; k < 10; k++) {
      const e = engine.spawnUnit('enemy', UNIT_BY_ID.clubman);
      e.x = 1230;
      e.hp = 1;
      e.attackCooldown = 10;
      hero.attackCooldown = 0;
      engine.step(0.05);
    }

    expect(hero.kills).toBe(10);
    expect(hero.vetRank).toBe(3);
    expect(hero.maxHp).toBeGreaterThan(initialHeroMaxHp);
    expect(engine.player.feverTimer).toBeGreaterThan(0);
  });

  it('applies all 4 Command upgrades (vanguard_shield, berserk_fury, veteran_drill, chrono_fever)', () => {
    // 1. Vanguard Shield grants starting shield to existing & newly spawned allies and absorbs damage before HP
    const engShield = new GameEngine();
    engShield.startNewGame('normal', 901);
    engShield.player.gold = 200000;
    const livingAlly = engShield.spawnUnit('player', UNIT_BY_ID.dino_rider);
    livingAlly.x = 600;
    expect(livingAlly.maxShield).toBe(0);

    for (let i = 0; i < 5; i++) expect(engShield.buyUpgrade('player', 'vanguard_shield')).toBe(true);
    expect(livingAlly.maxShield).toBeGreaterThan(0);
    expect(livingAlly.shield).toBeGreaterThan(0);

    const shieldedUnit = engShield.spawnUnit('player', UNIT_BY_ID.dino_rider);
    shieldedUnit.x = 1100;
    shieldedUnit.attackCooldown = 10;
    expect(shieldedUnit.maxShield).toBe(Math.round(shieldedUnit.maxHp * 0.3));
    expect(shieldedUnit.shield).toBe(shieldedUnit.maxShield);

    const enemyHitter = engShield.spawnUnit('enemy', UNIT_BY_ID.clubman);
    enemyHitter.x = 1125;
    enemyHitter.attackCooldown = 0;
    const hpBeforeHit = shieldedUnit.hp;
    const shieldBeforeHit = shieldedUnit.shield;
    engShield.step(0.05);
    expect(shieldedUnit.shield).toBeLessThan(shieldBeforeHit);
    expect(shieldedUnit.hp).toBe(hpBeforeHit);

    // 2. Berserk Fury scales attack damage & attack speed as HP drops
    const engFull = new GameEngine();
    engFull.startNewGame('normal', 902);
    engFull.player.gold = 200000;
    for (let i = 0; i < 6; i++) expect(engFull.buyUpgrade('player', 'berserk_fury')).toBe(true);
    const fullHpFighter = engFull.spawnUnit('player', UNIT_BY_ID.clubman);
    fullHpFighter.x = 1000;
    fullHpFighter.attackCooldown = 0;
    const targetFull = engFull.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    targetFull.x = 1025;
    targetFull.attackCooldown = 10;
    engFull.step(0.05);
    const dmgAtFullHp = targetFull.maxHp - targetFull.hp;
    const cdAtFullHp = fullHpFighter.attackCooldown;

    const engLow = new GameEngine();
    engLow.startNewGame('normal', 902);
    engLow.player.gold = 200000;
    for (let i = 0; i < 6; i++) expect(engLow.buyUpgrade('player', 'berserk_fury')).toBe(true);
    const woundedFighter = engLow.spawnUnit('player', UNIT_BY_ID.clubman);
    woundedFighter.x = 1000;
    woundedFighter.hp = woundedFighter.maxHp * 0.2;
    woundedFighter.attackCooldown = 0;
    const targetLow = engLow.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    targetLow.x = 1025;
    targetLow.attackCooldown = 10;
    engLow.step(0.05);
    const dmgAtLowHp = targetLow.maxHp - targetLow.hp;
    const cdAtLowHp = woundedFighter.attackCooldown;

    expect(dmgAtLowHp).toBeGreaterThan(dmgAtFullHp);
    expect(cdAtLowHp).toBeLessThan(cdAtFullHp);

    // 3. Veteran Drill accelerates promotion threshold (3 kills -> ★★★ at Lv.7+) and boosts veteran stats
    const engVet = new GameEngine();
    engVet.startNewGame('normal', 903);
    engVet.player.gold = 500000;
    for (let i = 0; i < 7; i++) expect(engVet.buyUpgrade('player', 'veteran_drill')).toBe(true);
    const elite = engVet.spawnUnit('player', UNIT_BY_ID.dino_rider);
    elite.vetRank = 0;
    elite.maxHp = UNIT_BY_ID.dino_rider.maxHp;
    elite.hp = elite.maxHp;
    elite.x = 1200;

    for (let k = 0; k < 3; k++) {
      const f = engVet.spawnUnit('enemy', UNIT_BY_ID.clubman);
      f.x = 1228;
      f.hp = 1;
      f.attackCooldown = 10;
      elite.attackCooldown = 0;
      engVet.step(0.05);
    }
    expect(elite.kills).toBe(3);
    expect(elite.vetRank).toBe(3);
    // Base ★★★ gives 1.5x maxHp; Lv.7 veteran_drill amplifies bonus by +105% -> ~2.025x
    expect(elite.maxHp).toBeGreaterThan(Math.round(UNIT_BY_ID.dino_rider.maxHp * 1.75));

    // 4. Chrono Fever upgrade extends fever duration and increases Supply Crate Gold/XP rewards
    const engBaseCrate = new GameEngine();
    engBaseCrate.startNewGame('normal', 904);
    const baseCrate = engBaseCrate.spawnSupplyCrate(1100);
    baseCrate.y = 326;
    baseCrate.landed = true;
    baseCrate.hp = 10;
    const baseGold0 = engBaseCrate.player.gold;
    const baseXp0 = engBaseCrate.player.xp;
    const r0 = engBaseCrate.spawnUnit('player', UNIT_BY_ID.dino_rider);
    r0.x = 1065;
    r0.attackCooldown = 0;
    engBaseCrate.step(0.05);
    const baseCrateGoldGain = engBaseCrate.player.gold - baseGold0;
    const baseCrateXpGain = engBaseCrate.player.xp - baseXp0;

    const engFever = new GameEngine();
    engFever.startNewGame('normal', 904);
    engFever.player.gold = 500000;
    for (let i = 0; i < 6; i++) expect(engFever.buyUpgrade('player', 'chrono_fever')).toBe(true);
    const boostedCrate = engFever.spawnSupplyCrate(1100);
    boostedCrate.y = 326;
    boostedCrate.landed = true;
    boostedCrate.hp = 10;
    const feverGold0 = engFever.player.gold;
    const feverXp0 = engFever.player.xp;
    const r1 = engFever.spawnUnit('player', UNIT_BY_ID.dino_rider);
    r1.x = 1065;
    r1.attackCooldown = 0;
    engFever.step(0.05);
    const boostedCrateGoldGain = engFever.player.gold - feverGold0;
    const boostedCrateXpGain = engFever.player.xp - feverXp0;
    expect(boostedCrateGoldGain).toBeGreaterThan(baseCrateGoldGain * 1.6);
    expect(boostedCrateXpGain).toBeGreaterThan(baseCrateXpGain * 1.6);

    // Trigger 10 kills -> feverTimer should exceed base 10s (Lv.6 -> 16s)
    const champ = engFever.spawnUnit('player', UNIT_BY_ID.dino_rider);
    champ.x = 1350;
    for (let k = 0; k < 10; k++) {
      const m = engFever.spawnUnit('enemy', UNIT_BY_ID.clubman);
      m.x = 1378;
      m.hp = 1;
      m.attackCooldown = 10;
      champ.attackCooldown = 0;
      engFever.step(0.05);
    }
    expect(engFever.player.feverTimer).toBeGreaterThan(14.5);
  });
});
