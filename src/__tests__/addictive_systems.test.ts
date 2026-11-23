import { describe, expect, it } from 'vitest';
import { COMMANDER_LIST } from '../data/commanders';
import { ERAS, UNIT_BY_ID } from '../data/eras';
import {
  ACHIEVEMENTS,
  DAILY_MUTATOR_LIST,
  getDailyChallengeInfo,
  SANCTUARY_UPGRADES,
} from '../data/metaProgression';
import {
  computeFactionCombatMods,
  RELIC_SYNERGY_LIST,
  RELICS,
  rollRelicChoices,
} from '../data/relics';
import type { CommanderId, RelicId, SanctuaryUpgradeId } from '../data/types';
import { GameEngine } from '../game/engine';
import { renderBase } from '../render/baseRenderer';
import {
  drawCartoonCommanderIcon,
  drawCartoonRelicIcon,
  drawCartoonSanctuaryIcon,
} from '../render/iconRenderer';
import { renderUnitEntity, resetUnitCacheFrameBudget } from '../render/unitRenderer';
import {
  renderBattleSpoils,
  renderChronoRift,
  renderFrontlineMomentum,
  renderProjectiles,
  renderTreasureDrone,
} from '../render/vfxRenderer';
import {
  buySanctuaryUpgrade,
  loadRecords,
  recordDiscoveredRelic,
  recordDiscoveredUnit,
  recordMatchResult,
  resetSanctuaryUpgrades,
  saveRecords,
} from '../storage/records';

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

function createSpyCanvasContext() {
  const metrics = { drawCalls: 0, gradientCalls: 0, clipCalls: 0 };
  const dummyGrad = { addColorStop: () => undefined };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get(target, prop) {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => {
          metrics.gradientCalls++;
          return dummyGrad;
        };
      }
      if (prop === 'clip') {
        return () => {
          metrics.clipCalls++;
        };
      }
      if (prop in target) return target[prop as string];
      return () => {
        if (
          prop === 'fill' ||
          prop === 'stroke' ||
          prop === 'fillRect' ||
          prop === 'strokeRect' ||
          prop === 'fillText' ||
          prop === 'strokeText'
        ) {
          metrics.drawCalls++;
        }
      };
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, metrics };
}

describe('Chrono Relics, Commanders, Rifts, Elites/Bosses, Modes & Sanctuary Meta', () => {
  it('validates all 18 Chrono Relics, rollRelicChoices uniqueness, and in-run Relic mechanics (Prism Split, Thunder Core, Cryo Shard, Rewind Hourglass)', () => {
    expect(RELICS).toHaveLength(18);
    expect(RELIC_SYNERGY_LIST).toHaveLength(4);
    expect(DAILY_MUTATOR_LIST).toHaveLength(8);
    expect(SANCTUARY_UPGRADES).toHaveLength(8);
    expect(ACHIEVEMENTS).toHaveLength(30);

    let seed = 100;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const drafted = rollRelicChoices(['chrono_overclock'], rng, 3, 3);
    expect(drafted).toHaveLength(3);
    expect(new Set(drafted).size).toBe(3);
    expect(drafted).not.toContain('chrono_overclock');

    // Every relic modifies FactionCombatMods cleanly
    for (const relic of RELICS) {
      const mods = computeFactionCombatMods({
        commanderId: null,
        relics: [relic.id],
        isPlayer: true,
      });
      expect(mods).toBeDefined();
    }

    // Milestone evolution offers 3-card Relic Draft & selectRelic activates it
    const engine = new GameEngine();
    engine.startNewGame('normal', 2027, { mode: 'campaign', commanderId: 'vanguard' });
    engine.player.xp = ERAS[0].evolveXp;
    expect(engine.evolve('player')).toBe(true); // Era 1 -> Era 2 (index 1)
    expect(engine.pendingRelicDraft).toHaveLength(3);

    const pick = engine.pendingRelicDraft[0];
    expect(engine.selectRelic(pick, 'player')).toBe(true);
    expect(engine.pendingRelicDraft).toHaveLength(0);
    expect(engine.player.relics).toContain(pick);

    // Rewind Hourglass saves player base from a lethal hit when crossing <= 25% HP!
    const clutchEng = new GameEngine();
    clutchEng.startNewGame('normal', 777);
    expect(clutchEng.selectRelic('rewind_hourglass', 'player')).toBe(true);
    clutchEng.player.baseHp = 80; // <= 25% of 600
    const invader = clutchEng.spawnUnit('enemy', UNIT_BY_ID.omega_titan);
    invader.x = 240;
    invader.attackCooldown = 0;
    clutchEng.step(0.05);

    expect(clutchEng.player.rewindUsed).toBe(true);
    expect(clutchEng.status).toBe('playing');
    expect(clutchEng.player.baseHp).toBeGreaterThan(200);
    expect(clutchEng.player.feverTimer).toBeGreaterThan(0);

    // Cryo Shard slows enemy & Thunder Core chains lightning across nearby enemies
    const procEng = new GameEngine();
    procEng.startNewGame('normal', 404);
    procEng.selectRelic('cryo_shard', 'player');
    procEng.selectRelic('thunder_core', 'player');
    procEng.selectRelic('prism_split', 'player');
    const archer = procEng.spawnUnit('player', UNIT_BY_ID.repeating_crossbow);
    archer.x = 800;
    const e1 = procEng.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    const e2 = procEng.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    e1.x = 920;
    e2.x = 960;
    e1.attackCooldown = 20;
    e2.attackCooldown = 20;

    for (let t = 0; t < 40; t++) {
      archer.attackCooldown = 0;
      procEng.step(0.05);
    }
    expect((e1.slowTimer ?? 0) + (e2.slowTimer ?? 0)).toBeGreaterThan(0);
    expect(e2.hp).toBeLessThan(e2.maxHp);
  });

  it('executes all 4 Commander Active Tactical Skills (Vanguard, Ordnance, Archon, Aegis)', () => {
    expect(COMMANDER_LIST).toHaveLength(4);
    const ids: CommanderId[] = ['vanguard', 'ordnance', 'archon', 'aegis'];

    for (const id of ids) {
      const eng = new GameEngine();
      eng.startNewGame('normal', 99, { commanderId: id });
      const ally = eng.spawnUnit('player', UNIT_BY_ID.dino_rider);
      ally.x = 900;
      ally.hp = Math.round(ally.maxHp * 0.4);
      eng.player.baseHp = Math.round(eng.player.baseMaxHp * 0.6);
      eng.enqueueUnit('player', 'clubman');
      const foe = eng.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
      foe.x = 1150;

      const goldBefore = eng.player.gold;
      const baseBefore = eng.player.baseHp;
      expect(eng.canUseTacticalSkill('player')).toBe(true);
      expect(eng.triggerTacticalSkill('player')).toBe(true);
      expect(eng.player.tacticalCooldown).toBeGreaterThan(0);

      if (id === 'vanguard') {
        expect(eng.player.tacticalBuffTimer).toBeGreaterThan(5);
        expect(ally.shield).toBeGreaterThan(0);
      } else if (id === 'ordnance') {
        expect(eng.projectiles.length).toBeGreaterThanOrEqual(5);
      } else if (id === 'archon') {
        expect(eng.player.gold).toBeGreaterThan(goldBefore);
        expect(eng.supplyCrates.length).toBeGreaterThanOrEqual(1);
      } else if (id === 'aegis') {
        expect(ally.hp).toBeGreaterThan(Math.round(ally.maxHp * 0.4));
        expect(eng.player.baseHp).toBeGreaterThan(baseBefore);
        expect(eng.player.aegisProtectedTimer).toBeGreaterThan(4);
      }
    }
  });

  it('supports Chrono Rift zones, Elite/Boss spawns, Kill Combos, First Blood, 1x/2x/3x speed, Auto-Spawn, Endless Wave Break, and Daily Challenges', () => {
    const eng = new GameEngine();
    eng.startNewGame('normal', 515, { mode: 'endless', commanderId: 'vanguard' });

    // Speed 1x -> 2x -> 3x -> 1x
    expect(eng.toggleSpeed()).toBe(2);
    expect(eng.toggleSpeed()).toBe(3);
    eng.step(0.05);
    expect(eng.elapsed).toBeCloseTo(0.15, 4);
    expect(eng.toggleSpeed()).toBe(1);

    // Auto-Spawn queues affordable units automatically
    eng.player.gold = 300;
    expect(eng.toggleAutoSpawn()).toBe(true);
    for (let i = 0; i < 8; i++) eng.step(0.05);
    expect(eng.player.queue.length + eng.player.unitsSpawned).toBeGreaterThan(0);
    eng.setAutoSpawn(false);

    // Chrono Rift sanctuary heals wounded units inside radius
    const rift = eng.spawnChronoRift('sanctuary', 1000);
    expect(eng.activeRift).toBe(rift);
    const wounded = eng.spawnUnit('player', UNIT_BY_ID.dino_rider);
    wounded.x = 1000;
    wounded.hp = 50;
    const hp0 = wounded.hp;
    for (let i = 0; i < 10; i++) eng.step(0.05);
    expect(wounded.hp).toBeGreaterThan(hp0);

    // Boss spawn + Combo streak + First Blood
    const boss = eng.spawnSpecialUnit('enemy', 'boss');
    expect(boss.eliteKind).toBe('boss');
    expect(boss.maxHp).toBeGreaterThan(UNIT_BY_ID[boss.def.id].maxHp * 3.5);
    boss.x = 1230;
    boss.hp = 1;
    boss.shield = 0;
    boss.attackCooldown = 20;

    const fodder = eng.spawnUnit('enemy', UNIT_BY_ID.clubman);
    fodder.x = 1232;
    fodder.hp = 1;
    fodder.attackCooldown = 20;

    const slayer = eng.spawnUnit('player', UNIT_BY_ID.chrono_sovereign);
    slayer.x = 1160;
    slayer.attackCooldown = 0;
    eng.step(0.05);
    slayer.attackCooldown = 0;
    eng.step(0.05);

    expect(eng.player.bossKills).toBeGreaterThanOrEqual(1);
    expect(eng.player.comboCount).toBeGreaterThanOrEqual(2);
    expect(eng.player.maxCombo).toBeGreaterThanOrEqual(2);

    // Endless Wave Break: reducing enemy base HP <= 0 advances wave instead of ending match!
    expect(eng.wave).toBe(1);
    eng.enemy.baseHp = 5;
    eng.enemy.lastStandUsed = true;
    slayer.x = 2120;
    slayer.attackCooldown = 0;
    for (let i = 0; i < 20 && eng.wave === 1; i++) eng.step(0.05);
    expect(eng.status).toBe('playing');
    expect(eng.wave).toBeGreaterThanOrEqual(2);
    expect(eng.enemy.baseHp).toBeGreaterThan(100);

    // Daily Challenge Info is deterministic per dateKey and picks 2 distinct mutators
    const d1 = getDailyChallengeInfo('2026-11-22');
    const d2 = getDailyChallengeInfo('2026-11-22');
    expect(d1).toEqual(d2);
    expect(d1.mutators[0]).not.toBe(d1.mutators[1]);
  });

  it('persists Chrono Medals, Sanctuary upgrades & 100% refunds, Codex discoveries, and Achievements', () => {
    const storage = createMemoryStorage();
    const summary = recordMatchResult(
      {
        won: true,
        difficulty: 'hard',
        elapsedSec: 150,
        eraReached: 12,
        kills: 125,
        mode: 'daily',
        maxCombo: 28,
        bossKills: 2,
        baseHpRatio: 0.95,
        relicsCollected: ['prism_split', 'rewind_hourglass'],
        dailyDateKey: '2026-11-22',
      },
      storage,
    );

    expect(summary.medalsEarned).toBeGreaterThan(80);
    expect(summary.newlyUnlockedAchievements.map((a) => a.id)).toEqual(
      expect.arrayContaining([
        'first_win',
        'kills_100',
        'combo_10',
        'combo_25',
        'era_12',
        'boss_slayer_1',
        'win_hard',
        'speedrun_180',
        'untouched_fort',
        'daily_clear',
      ]),
    );

    const medalsBeforeBuy = summary.records.chronoMedals;
    const buy1 = buySanctuaryUpgrade('starting_gold', storage);
    const buy2 = buySanctuaryUpgrade('starter_relic', storage);
    expect(buy1.ok).toBe(true);
    expect(buy2.ok).toBe(true);
    expect(buy2.records.sanctuary.starting_gold).toBe(1);
    expect(buy2.records.sanctuary.starter_relic).toBe(1);
    expect(buy2.records.chronoMedals).toBeLessThan(medalsBeforeBuy);

    // Resetting Sanctuary refunds 100% of spent Chrono Medals!
    const reset = resetSanctuaryUpgrades(storage);
    expect(reset.refunded).toBeGreaterThan(0);
    expect(reset.records.chronoMedals).toBe(medalsBeforeBuy);
    expect(reset.records.sanctuary.starting_gold).toBe(0);

    // Unit & Relic Codex discoveries unlock collector achievements
    for (const r of RELICS.slice(0, 6)) {
      recordDiscoveredRelic(r.id, storage);
    }
    for (const era of ERAS) {
      for (const u of era.units) {
        recordDiscoveredUnit(u.id, storage);
      }
    }
    const finalRec = loadRecords(storage);
    expect(finalRec.discoveredUnits).toHaveLength(48);
    expect(finalRec.unlockedAchievements).toEqual(
      expect.arrayContaining(['relic_collector_6', 'codex_24', 'codex_48']),
    );
    saveRecords(finalRec, storage);
  });

  it('renders all 18 Relic icons, 4 Commander icons, 8 Sanctuary icons, Chrono Rifts, and Bosses with zero gradients and zero clips', () => {
    const spy = createSpyCanvasContext();

    for (const r of RELICS) {
      drawCartoonRelicIcon(spy.ctx, r.id as RelicId);
    }
    for (const c of COMMANDER_LIST) {
      drawCartoonCommanderIcon(spy.ctx, c.id);
    }
    for (const s of SANCTUARY_UPGRADES) {
      drawCartoonSanctuaryIcon(spy.ctx, s.id as SanctuaryUpgradeId);
    }

    const eng = new GameEngine();
    eng.startNewGame('normal', 123);
    const rift = eng.spawnChronoRift('fury', 1100);
    const boss = eng.spawnSpecialUnit('enemy', 'boss');
    boss.slowTimer = 1.5;

    resetUnitCacheFrameBudget();
    renderChronoRift(spy.ctx, rift, 2.5, 0, 2400);
    renderUnitEntity(spy.ctx, boss, true, 2.5);

    // Verify new Frontline Clash Beacon, Battle Spoils, Treasure Drone, Synergy Unit Auras & Fortress Spire render with 0 gradients & 0 clips
    eng.selectRelic('immortal_bastion', 'player');
    eng.selectRelic('iron_maiden', 'player');
    eng.selectRelic('cryo_shard', 'player');
    eng.player.upgrades.fortress = 2;
    eng.player.baseHp = eng.player.baseMaxHp - 40;

    const synUnit = eng.spawnUnit('player', UNIT_BY_ID.aegis_seraph);
    synUnit.berserkerAura = true;
    synUnit.bulwarkHex = true;
    synUnit.imperialHalo = true;
    synUnit.shield = 80;
    synUnit.maxShield = 100;

    const spoil1 = eng.spawnSpoil(920, 'gold', 50);
    spoil1.landed = true;
    const spoil2 = eng.spawnSpoil(950, 'xp', 80);
    spoil2.landed = true;
    const spoil3 = eng.spawnSpoil(980, 'medal', 2);
    spoil3.landed = true;
    const drone = eng.spawnTreasureDrone();

    renderFrontlineMomentum(spy.ctx, 1180, true, 2.5, 0, 2400);
    renderBattleSpoils(spy.ctx, eng.spoils, 2.5, 0, 2400);
    renderTreasureDrone(spy.ctx, drone, 2.5, 0, 2400);
    renderBase(spy.ctx, eng.player, 2.5, false);
    renderUnitEntity(spy.ctx, synUnit, false, 2.5);
    renderProjectiles(
      spy.ctx,
      [
        {
          uid: 1,
          team: 'player',
          style: 'plasma',
          x: 1000,
          y: 260,
          prevX: 980,
          prevY: 260,
          vx: 520,
          vy: 0,
          damage: 30,
          splashRadius: 0,
          armorPierce: false,
          isCrit: true,
          electrified: true,
          baseDamageMult: 1,
          knockback: 0,
          pierceRemaining: 1,
          hitUids: [],
          gravity: 0,
          life: 0.4,
          maxLife: 0.8,
        },
      ],
      0,
      2400,
    );

    expect(spy.metrics.gradientCalls).toBe(0);
    expect(spy.metrics.clipCalls).toBe(0);
    expect(spy.metrics.drawCalls).toBeGreaterThan(250);
  });

  it('activates all 4 Relic Set Synergies (2-Set & 3-Set), Relic Draft Reroll, Battle Spoils (+35% tap bonus), Treasure Drones, and Tactical Bounties', () => {
    const eng = new GameEngine();
    eng.startNewGame('normal', 2028, { mode: 'campaign', commanderId: 'vanguard' });

    // 1. Relic Draft Reroll swaps 3 choices cleanly
    eng.player.xp = ERAS[0].evolveXp;
    expect(eng.evolve('player')).toBe(true);
    const firstChoices = [...eng.pendingRelicDraft];
    expect(firstChoices).toHaveLength(3);
    expect(eng.player.relicRerolls).toBe(1);
    const rerolled = [...eng.rerollRelicDraft()];
    expect(rerolled).toHaveLength(3);
    expect(eng.player.relicRerolls).toBe(0);
    expect(rerolled).not.toEqual(firstChoices);
    expect(eng.rerollRelicDraft()).toEqual(rerolled); // 0 rerolls left -> unchanged
    eng.selectRelic(eng.pendingRelicDraft[0], 'player');

    // 2. Storm 3-Set: electrified shots + every 5th ranged shot calls Orbital Sky Lightning
    const stormEng = new GameEngine();
    stormEng.startNewGame('normal', 301, { mode: 'campaign', commanderId: 'ordnance' });
    stormEng.selectRelic('thunder_core', 'player');
    stormEng.selectRelic('prism_split', 'player');
    stormEng.selectRelic('chrono_overclock', 'player');
    expect(stormEng.player.mods.stormTier).toBe(3);

    const gunner = stormEng.spawnUnit('player', UNIT_BY_ID.rifleman);
    gunner.x = 900;
    const dummy = stormEng.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    dummy.x = 1040;
    dummy.hp = 5000;
    dummy.maxHp = 5000;
    dummy.attackCooldown = 30;
    let sawLightning = false;
    for (let i = 0; i < 12; i++) {
      gunner.attackCooldown = 0;
      stormEng.step(0.04);
      if (stormEng.beams.some((b) => b.style === 'lightning')) sawLightning = true;
    }
    expect(sawLightning).toBe(true);

    // 3. Berserker 3-Set: <75% HP rage aura + enemy kill erupts Molten Shockwave
    const berserkEng = new GameEngine();
    berserkEng.startNewGame('normal', 302, { mode: 'campaign', commanderId: 'vanguard' });
    berserkEng.selectRelic('blood_oath', 'player');
    berserkEng.selectRelic('guillotine_blade', 'player');
    berserkEng.selectRelic('berserker_horn', 'player');
    expect(berserkEng.player.mods.berserkerTier).toBe(3);
    const slayer = berserkEng.spawnUnit('player', UNIT_BY_ID.knight);
    slayer.x = 900;
    slayer.hp = Math.round(slayer.maxHp * 0.5);
    slayer.attackCooldown = 0;
    const victim = berserkEng.spawnUnit('enemy', UNIT_BY_ID.clubman);
    victim.x = 928;
    victim.hp = 5;
    const bystander = berserkEng.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    bystander.x = 960;
    const byHp0 = bystander.hp;
    berserkEng.step(0.05);
    expect(bystander.hp).toBeLessThan(byHp0);

    // 4. Bulwark 3-Set: Fortress fires automatic Astral Judgement Beam every 8s
    const bulwarkEng = new GameEngine();
    bulwarkEng.startNewGame('normal', 303, { mode: 'campaign', commanderId: 'aegis' });
    bulwarkEng.selectRelic('immortal_bastion', 'player');
    bulwarkEng.selectRelic('iron_maiden', 'player');
    bulwarkEng.selectRelic('cryo_shard', 'player');
    expect(bulwarkEng.player.mods.bulwarkTier).toBe(3);
    const invader = bulwarkEng.spawnUnit('enemy', UNIT_BY_ID.dino_rider);
    invader.x = 800;
    invader.attackCooldown = 20;
    bulwarkEng.player.bulwarkBeamTimer = 0.02;
    bulwarkEng.step(0.05);
    expect(bulwarkEng.beams.some((b) => b.style === 'chrono_beam')).toBe(true);

    // 5. Imperial 3-Set: every 6th trained unit deploys a Twin Escort!
    const impEng = new GameEngine();
    impEng.startNewGame('normal', 304, { mode: 'campaign', commanderId: 'archon' });
    impEng.selectRelic('golden_chalice', 'player');
    impEng.selectRelic('warlord_signet', 'player');
    impEng.selectRelic('starlight_bounty', 'player');
    expect(impEng.player.mods.imperialTier).toBe(3);
    impEng.player.gold = 5000;
    for (let i = 0; i < 6; i++) {
      impEng.enqueueUnit('player', 'clubman');
      for (let s = 0; s < 35; s++) impEng.step(0.05);
    }
    expect(impEng.player.unitsSpawned).toBeGreaterThanOrEqual(7);

    // 6. Interactive Battle Spoils (+35% manual tap bonus), Treasure Drone tap-shootdown, and Tactical Bounty clear
    const gold0 = impEng.player.gold;
    const sp = impEng.spawnSpoil(850, 'gold', 100, 0);
    sp.y = 335;
    sp.landed = true;
    expect(impEng.collectSpoilsNear(850, 330, true)).toBe(1);
    expect(impEng.player.gold - gold0).toBeGreaterThanOrEqual(135);
    expect(impEng.player.spoilsTapped).toBe(1);

    const drone = impEng.spawnTreasureDrone();
    drone.x = 1000;
    drone.y = 152;
    drone.hp = 10;
    expect(impEng.collectSpoilsNear(1000, 152, true)).toBeGreaterThanOrEqual(1);
    expect(impEng.treasureDrone).toBeNull();
    expect(impEng.player.dronesKilled).toBe(1);
    expect(impEng.spoils.length).toBeGreaterThanOrEqual(3);

    const bounty = impEng.spawnBattleBounty('kills');
    expect(impEng.activeBounty).toBe(bounty);
    const medalsBefore = impEng.player.liveMedalsEarned;
    for (let k = 0; k < bounty.target; k++) {
      const f = impEng.spawnUnit('enemy', UNIT_BY_ID.clubman);
      f.x = 700;
      f.hp = 1;
      const a = impEng.spawnUnit('player', UNIT_BY_ID.chrono_sovereign);
      a.x = 650;
      a.attackCooldown = 0;
      impEng.step(0.05);
    }
    expect(impEng.player.bountiesCleared).toBe(1);
    expect(impEng.player.liveMedalsEarned).toBeGreaterThan(medalsBefore);
    expect(impEng.activeBounty).toBeNull();

    // 7. Expanded Achievements unlock cleanly in recordMatchResult
    const mem = createMemoryStorage();
    for (const r of RELICS) {
      recordDiscoveredRelic(r.id, mem);
    }
    const res = recordMatchResult(
      {
        won: true,
        difficulty: 'normal',
        elapsedSec: 210,
        eraReached: 8,
        kills: 60,
        bountiesCleared: 6,
        dronesKilled: 4,
        spoilsTapped: 22,
        liveMedalsEarned: 8,
        relicsCollected: ['thunder_core', 'prism_split', 'chrono_overclock'],
      },
      mem,
    );
    expect(res.records.unlockedAchievements).toEqual(
      expect.arrayContaining([
        'synergy_2',
        'synergy_3',
        'bounty_hunter_5',
        'drone_hunter_3',
        'spoil_collector_20',
        'relic_collector_18',
      ]),
    );
  });
});
