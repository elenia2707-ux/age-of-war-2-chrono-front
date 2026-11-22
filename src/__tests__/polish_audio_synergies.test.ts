import { afterEach, describe, expect, it } from 'vitest';
import { SoundEngine } from '../audio/soundEngine';
import { DIFFICULTY_LIST } from '../data/difficulty';
import { ERAS, TURRET_BY_ID, UNIT_BY_ID } from '../data/eras';
import type { SoundCue, TurretVisualKind, UltimateKind } from '../data/types';
import { GameEngine } from '../game/engine';
import { clearBackgroundCache, renderBackground, renderForegroundParallax } from '../render/backgroundRenderer';
import { drawTurretArt, renderBase } from '../render/baseRenderer';
import { clearPrimitiveCaches } from '../render/cartoonPrimitives';
import {
  clearUnitSpriteCache,
  renderUnitEntity,
  resetUnitCacheFrameBudget,
} from '../render/unitRenderer';
import {
  renderActiveUltimates,
  renderBeams,
  renderParticles,
  renderPopups,
  renderProjectiles,
  renderScorchMarks,
  renderSlashes,
  renderSupplyCrates,
  renderUltimateAtmosphere,
} from '../render/vfxRenderer';

interface SpyCanvasMetrics {
  drawCalls: number;
  gradientCalls: number;
  clipCalls: number;
  opSeq: string[];
}

function createSpyCanvasContext(): { ctx: CanvasRenderingContext2D; metrics: SpyCanvasMetrics } {
  const metrics: SpyCanvasMetrics = { drawCalls: 0, gradientCalls: 0, clipCalls: 0, opSeq: [] };
  const dummyGradient = { addColorStop: () => undefined };
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop) {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => {
          metrics.gradientCalls++;
          return dummyGradient;
        };
      }
      if (prop === 'clip') {
        return () => {
          metrics.clipCalls++;
        };
      }
      if (prop in target) return target[prop as string];
      return (...args: unknown[]) => {
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
        if (prop === 'roundRect' || prop === 'ellipse' || prop === 'arc' || prop === 'lineTo' || prop === 'rect') {
          const rounded = args
            .slice(0, 4)
            .map((v) => (typeof v === 'number' ? Math.round(v) : String(v)))
            .join(',');
          metrics.opSeq.push(`${String(prop)}(${rounded})`);
        }
      };
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  };
  const ctx = new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D;
  return { ctx, metrics };
}

class MockAudioParam {
  public value = 0;
  public setValueAtTime(v: number): void {
    this.value = v;
  }
  public linearRampToValueAtTime(v: number): void {
    this.value = v;
  }
  public exponentialRampToValueAtTime(v: number): void {
    this.value = v;
  }
}

class MockAudioNode {
  public connectedTo: MockAudioNode[] = [];
  public connect(dest: MockAudioNode): MockAudioNode {
    this.connectedTo.push(dest);
    return dest;
  }
  public disconnect(): void {
    this.connectedTo = [];
  }
}

class MockOscillatorNode extends MockAudioNode {
  public type: OscillatorType = 'sine';
  public frequency = new MockAudioParam();
  public onended: (() => void) | null = null;
  public started = false;
  public start(): void {
    this.started = true;
  }
  public stop(): void {
    // trigger onended only if explicitly flushed
  }
}

class MockBufferSourceNode extends MockAudioNode {
  public buffer: AudioBuffer | null = null;
  public onended: (() => void) | null = null;
  public started = false;
  public start(): void {
    this.started = true;
  }
  public stop(): void {
    // no-op
  }
}

class MockGainNode extends MockAudioNode {
  public gain = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
  public type: BiquadFilterType = 'lowpass';
  public frequency = new MockAudioParam();
  public Q = new MockAudioParam();
}

class MockCompressorNode extends MockAudioNode {
  public threshold = new MockAudioParam();
  public knee = new MockAudioParam();
  public ratio = new MockAudioParam();
  public attack = new MockAudioParam();
  public release = new MockAudioParam();
}

class MockAudioContext {
  public state: AudioContextState = 'running';
  public currentTime = 1.0;
  public sampleRate = 44100;
  public destination = new MockAudioNode();
  public activeSources: Array<{ onended: (() => void) | null }> = [];
  public oscCount = 0;
  public noiseCount = 0;
  public compressorCreated = false;

  public flushEndedVoices(): void {
    const list = this.activeSources.splice(0);
    for (const s of list) {
      s.onended?.();
    }
  }

  public resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
  public createGain(): MockGainNode {
    return new MockGainNode();
  }
  public createDynamicsCompressor(): MockCompressorNode {
    this.compressorCreated = true;
    return new MockCompressorNode();
  }
  public createOscillator(): MockOscillatorNode {
    this.oscCount++;
    const osc = new MockOscillatorNode();
    this.activeSources.push(osc);
    return osc;
  }
  public createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode();
  }
  public createBuffer(_channels: number, length: number): AudioBuffer {
    const data = new Float32Array(length);
    return {
      getChannelData: () => data,
    } as unknown as AudioBuffer;
  }
  public createBufferSource(): MockBufferSourceNode {
    this.noiseCount++;
    const src = new MockBufferSourceNode();
    this.activeSources.push(src);
    return src;
  }
}

const originalWindow = (globalThis as { window?: unknown }).window;

afterEach(() => {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window?: unknown }).window = originalWindow;
  }
});

describe('Web Audio SoundEngine Quality & Master Bus', () => {
  it('wires master DynamicsCompressorNode, enforces voice cap, and synthesizes all 26 cues + 12 era ultimate soundscapes cleanly', () => {
    let createdCtx: MockAudioContext | null = null;
    class CapturingMockAudioContext extends MockAudioContext {
      constructor() {
        super();
        createdCtx = this;
      }
    }
    (globalThis as { window?: unknown }).window = {
      AudioContext: CapturingMockAudioContext,
    };

    const sound = new SoundEngine(false);
    sound.unlock();
    expect(createdCtx).not.toBeNull();
    expect(createdCtx!.compressorCreated).toBe(true);
    expect(sound.hasCompressor()).toBe(true);

    const allCues: SoundCue[] = [
      'melee_wood',
      'melee_metal',
      'melee_energy',
      'bow',
      'gun',
      'cannon',
      'flame',
      'rocket',
      'laser',
      'railgun',
      'explosion',
      'crit',
      'shield_break',
      'spawn',
      'turret_build',
      'upgrade',
      'sell',
      'evolve',
      'fever',
      'crate_open',
      'promote',
      'ultimate',
      'hit_base',
      'ui_tap',
      'victory',
      'defeat',
    ];
    expect(allCues).toHaveLength(26);

    for (const cue of allCues) {
      createdCtx!.flushEndedVoices();
      createdCtx!.currentTime += 0.5;
      const before = createdCtx!.oscCount + createdCtx!.noiseCount;
      sound.play(cue);
      const after = createdCtx!.oscCount + createdCtx!.noiseCount;
      expect(after, `SoundCue '${cue}' failed to schedule any Web Audio nodes`).toBeGreaterThan(before);
    }

    const allUltimates: UltimateKind[] = ERAS.map((e) => e.ultimate.kind);
    expect(allUltimates).toHaveLength(12);
    for (const kind of allUltimates) {
      createdCtx!.flushEndedVoices();
      createdCtx!.currentTime += 1.0;
      const before = createdCtx!.oscCount + createdCtx!.noiseCount;
      sound.playUltimate(kind);
      const after = createdCtx!.oscCount + createdCtx!.noiseCount;
      expect(after, `Ultimate soundscape '${kind}' failed to schedule nodes`).toBeGreaterThan(before);
    }

    // Voice limiter prevents runaway audio nodes during dense 2x battles while keeping high-priority cues audible
    createdCtx!.flushEndedVoices();
    for (let i = 0; i < 20; i++) {
      createdCtx!.currentTime += 0.1;
      sound.play('explosion');
    }
    const cappedBefore = createdCtx!.oscCount + createdCtx!.noiseCount;
    createdCtx!.currentTime += 0.5;
    sound.play('gun'); // low-priority combat cue throttled while voices are saturated
    expect(createdCtx!.oscCount + createdCtx!.noiseCount).toBe(cappedBefore);
    createdCtx!.currentTime += 0.5;
    sound.play('evolve'); // high-priority cue bypasses normal saturation cleanly
    expect(createdCtx!.oscCount + createdCtx!.noiseCount).toBeGreaterThan(cappedBefore);
    createdCtx!.flushEndedVoices();

    // Mute suppresses sound scheduling cleanly
    sound.setMuted(true);
    expect(sound.isMuted()).toBe(true);
    const mutedBefore = createdCtx!.oscCount + createdCtx!.noiseCount;
    createdCtx!.currentTime += 1.0;
    sound.play('explosion');
    sound.playUltimate('chrono_nova');
    expect(createdCtx!.oscCount + createdCtx!.noiseCount).toBe(mutedBefore);
  });
});

describe('24-Upgrade Synergies, Audio Cue Wiring & Balance Fixes', () => {
  it('preserves live Veteran HP bonus when buying armor and immediately buffs live Veterans on veteran_drill', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 1001);
    engine.player.gold = 500000;
    expect(engine.buyUpgrade('player', 'vanguard_shield')).toBe(true);
    expect(engine.buyUpgrade('player', 'vanguard_shield')).toBe(true);

    const vet = engine.spawnUnit('player', UNIT_BY_ID.dino_rider);
    vet.x = 1000;
    // Promote to ★★★ (5 kills)
    for (let k = 0; k < 5; k++) {
      const f = engine.spawnUnit('enemy', UNIT_BY_ID.clubman);
      f.x = 1028;
      f.hp = 1;
      f.attackCooldown = 10;
      vet.attackCooldown = 0;
      engine.step(0.05);
    }
    expect(vet.vetRank).toBe(3);
    const hpAfterVet = vet.maxHp;
    const shieldAfterVet = vet.maxShield;

    // Buying armor MUST increase (never reset/shrink) the live Veteran's maxHp & maxShield!
    expect(engine.buyUpgrade('player', 'armor')).toBe(true);
    expect(vet.maxHp).toBeGreaterThan(hpAfterVet);
    expect(vet.maxShield).toBeGreaterThanOrEqual(shieldAfterVet);

    const hpAfterArmor = vet.maxHp;
    // Buying veteran_drill MUST also immediately strengthen already-promoted live Veterans!
    expect(engine.buyUpgrade('player', 'veteran_drill')).toBe(true);
    expect(vet.maxHp).toBeGreaterThan(hpAfterArmor);
  });

  it('applies range_optics to ranged/siege units only and never extends melee sword reach', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 1002);
    engine.player.eraIndex = 11;
    engine.player.gold = 1000000;
    for (let i = 0; i < 8; i++) expect(engine.buyUpgrade('player', 'range_optics')).toBe(true);

    // Chrono Blade has melee reach 102 (no projectile); placing an enemy just outside edge-to-edge melee reach
    // (102 + half combined widths + 18px) MUST NOT trigger melee attack even with Lv.8 range_optics (+40% range)!
    const meleeBlade = engine.spawnUnit('player', UNIT_BY_ID.chrono_blade);
    meleeBlade.x = 800;
    meleeBlade.attackCooldown = 0;
    const target = engine.spawnUnit('enemy', UNIT_BY_ID.chrono_blade);
    const halfWidths = (meleeBlade.def.width + target.def.width) * 0.5;
    target.x = 800 + meleeBlade.def.range + halfWidths + 18;
    target.attackCooldown = 10;
    const hpBefore = target.hp;
    engine.step(0.05);
    expect(target.hp).toBe(hpBefore);
    expect(meleeBlade.state).toBe('walk');

    // Ranged Quantum Weaver at base range + 60px SHOULD fire its piercing beam immediately thanks to range_optics!
    const rangedWeaver = engine.spawnUnit('player', UNIT_BY_ID.quantum_weaver);
    rangedWeaver.x = 400;
    rangedWeaver.attackCooldown = 0;
    const farEnemy = engine.spawnUnit('enemy', UNIT_BY_ID.chrono_sovereign);
    farEnemy.x = 400 + UNIT_BY_ID.quantum_weaver.range + 60;
    farEnemy.attackCooldown = 10;
    const farHpBefore = farEnemy.hp;
    engine.step(0.05);
    expect(engine.beams.length).toBeGreaterThan(0);
    expect(farEnemy.hp).toBeLessThan(farHpBefore);
  });

  it('credits ground-impact siege splash kills to sourceUnit and wires dedicated combat sound callbacks', () => {
    const cues: SoundCue[] = [];
    const ults: UltimateKind[] = [];
    const engine = new GameEngine();
    engine.setCallbacks({
      onSound: (c) => cues.push(c),
      onUltimateSound: (k) => ults.push(k),
    });
    engine.startNewGame('normal', 1003);
    engine.player.eraIndex = 7;
    engine.player.gold = 500000;
    engine.player.xp = ERAS[7].ultimate.xpCost + 1000;
    engine.player.ultimateCooldown = 0;

    // Upgrade cue
    expect(engine.buyUpgrade('player', 'lifesteal')).toBe(true);
    expect(engine.buyUpgrade('player', 'lifesteal')).toBe(true);
    expect(engine.buyUpgrade('player', 'lifesteal')).toBe(true);
    expect(cues).toContain('upgrade');

    // Ground-impact splash from mortar_team credits kill & lifesteal to mortar
    const mortar = engine.spawnUnit('player', UNIT_BY_ID.mortar_team);
    mortar.x = 700;
    mortar.hp = mortar.maxHp * 0.6;
    mortar.attackCooldown = 0;
    const mortarHpBefore = mortar.hp;

    const enemy = engine.spawnUnit('enemy', UNIT_BY_ID.clubman);
    enemy.x = 960;
    enemy.hp = 1;
    enemy.attackCooldown = 10;

    for (let t = 0; t < 45; t++) engine.step(0.05);
    expect(mortar.kills).toBeGreaterThanOrEqual(1);
    expect(mortar.vetRank).toBeGreaterThanOrEqual(1);
    expect(mortar.hp).toBeGreaterThan(mortarHpBefore);
    expect(cues).toContain('promote');

    // Supply crate open cue
    const crate = engine.spawnSupplyCrate(1300);
    crate.y = 326;
    crate.landed = true;
    crate.hp = 1;
    const raider = engine.spawnUnit('player', UNIT_BY_ID.dino_rider);
    raider.x = 1265;
    raider.attackCooldown = 0;
    engine.step(0.05);
    expect(cues).toContain('crate_open');

    // Shield break cue
    engine.enemy.gold = 50000;
    engine.buyUpgrade('enemy', 'vanguard_shield');
    const shieldedEnemy = engine.spawnUnit('enemy', UNIT_BY_ID.clubman);
    shieldedEnemy.x = 1625;
    shieldedEnemy.shield = 5;
    shieldedEnemy.maxShield = 5;
    shieldedEnemy.attackCooldown = 10;
    const hitter = engine.spawnUnit('player', UNIT_BY_ID.dino_rider);
    hitter.x = 1600;
    hitter.attackCooldown = 0;
    engine.step(0.05);
    expect(cues).toContain('shield_break');

    // Bespoke ultimate sound callback
    expect(engine.triggerUltimate('player')).toBe(true);
    expect(ults).toContain(ERAS[7].ultimate.kind);
  });

  it('enforces Era 5 > Era 4 power progression, Era 8 mortar siege role, Era 12 base survivability, and bounded VFX caps across all 6 difficulties', () => {
    const era4 = ERAS[3];
    const era5 = ERAS[4];
    const era4AvgDps = era4.units.reduce((s, u) => s + u.damage * u.attackRate, 0) / 4;
    const era5AvgDps = era5.units.reduce((s, u) => s + u.damage * u.attackRate, 0) / 4;
    const era4AvgHp = era4.units.reduce((s, u) => s + u.maxHp, 0) / 4;
    const era5AvgHp = era5.units.reduce((s, u) => s + u.maxHp, 0) / 4;
    expect(era5AvgDps).toBeGreaterThan(era4AvgDps * 1.15);
    expect(era5AvgHp).toBeGreaterThan(era4AvgHp * 1.15);

    const mortar = UNIT_BY_ID.mortar_team;
    expect(mortar.splashRadius).toBeGreaterThanOrEqual(75);
    expect(mortar.baseDamageMult).toBeGreaterThanOrEqual(1.25);

    const era12 = ERAS[11];
    const boss = UNIT_BY_ID.chrono_sovereign;
    const bossBaseDps = boss.damage * boss.attackRate * boss.baseDamageMult;
    // Unupgraded Era 12 fortress survives >= 7.5s solo against Era 12 boss (and >= 15s at Fortress Lv.10)
    expect(era12.baseMaxHp / bossBaseDps).toBeGreaterThanOrEqual(7.5);

    // Run short headless 2x battle across all 6 difficulties and assert finite values & VFX caps
    for (const diff of DIFFICULTY_LIST) {
      const eng = new GameEngine();
      eng.startNewGame(diff.id, 777);
      eng.setSpeed(2);
      eng.player.gold = 2500;
      eng.enemy.gold = 2500;
      for (let i = 0; i < 6; i++) {
        eng.enqueueUnit('player', ERAS[0].units[i % 4].id);
      }
      for (let t = 0; t < 120 && eng.status === 'playing'; t++) {
        eng.step(0.05);
      }
      expect(Number.isFinite(eng.player.baseHp)).toBe(true);
      expect(Number.isFinite(eng.enemy.baseHp)).toBe(true);
      expect(eng.particles.length).toBeLessThanOrEqual(380);
      expect(eng.scorchMarks.length).toBeLessThanOrEqual(32);
      expect(eng.slashes.length).toBeLessThanOrEqual(28);
      expect(eng.popups.length).toBeLessThanOrEqual(42);
    }
  });
});

describe('60fps Zero-Gradient / Zero-Clip Rendering & 24-Turret Uniqueness', () => {
  it('gives all 24 turrets individually distinct vector silhouettes with zero gradients and zero clips', () => {
    const turretIds = Object.keys(TURRET_BY_ID) as TurretVisualKind[];
    expect(turretIds).toHaveLength(24);

    const signatures = new Set<string>();
    for (const id of turretIds) {
      const spy = createSpyCanvasContext();
      drawTurretArt(spy.ctx, id, 'player', -0.1, 0.3);
      expect(spy.metrics.gradientCalls, `Turret ${id} allocated gradients`).toBe(0);
      expect(spy.metrics.clipCalls, `Turret ${id} called ctx.clip()`).toBe(0);
      expect(spy.metrics.drawCalls, `Turret ${id} had too few draws`).toBeGreaterThan(5);
      signatures.add(spy.metrics.opSeq.join(';'));
    }
    expect(signatures.size).toBe(24);
  });

  it('adds Lv.10 Sovereign Bastion fortress detail and guarantees zero per-frame gradients/clips in combat rendering', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 2026);
    engine.player.eraIndex = 11;
    engine.enemy.eraIndex = 11;
    engine.player.gold = 5000000;
    engine.player.xp = ERAS[11].ultimate.xpCost + 5000;
    engine.player.ultimateCooldown = 0;

    // Compare fortress detail at Lv.0 vs Lv.10 Sovereign Bastion
    const spyLv0 = createSpyCanvasContext();
    renderBase(spyLv0.ctx, engine.player, 3.0, false);

    engine.player.upgrades.fortress = 10;
    const spyLv10 = createSpyCanvasContext();
    renderBase(spyLv10.ctx, engine.player, 3.0, false);
    expect(spyLv10.metrics.drawCalls).toBeGreaterThan(spyLv0.metrics.drawCalls);
    expect(spyLv10.metrics.gradientCalls).toBe(0);
    expect(spyLv10.metrics.clipCalls).toBe(0);

    // Spawn units, trigger ultimate + shield + crate, step combat, and verify ZERO gradients & ZERO clips across all live renderers!
    for (let i = 0; i < 4; i++) {
      const pu = engine.spawnUnit('player', ERAS[11].units[i]);
      pu.x = 1000 + i * 24;
      pu.maxShield = 1000;
      pu.shield = 800;
      const eu = engine.spawnUnit('enemy', ERAS[11].units[i]);
      eu.x = 1180 + i * 24;
    }
    engine.spawnSupplyCrate(1100);
    expect(engine.triggerUltimate('player')).toBe(true);
    for (let t = 0; t < 16; t++) engine.step(0.05);

    const snap = engine.getSnapshot();
    const combatSpy = createSpyCanvasContext();
    resetUnitCacheFrameBudget();
    renderUltimateAtmosphere(combatSpy.ctx, snap.ultimates, 932);
    renderScorchMarks(combatSpy.ctx, snap.scorchMarks, 0, 2400);
    renderBase(combatSpy.ctx, snap.player, 4.0, false);
    renderBase(combatSpy.ctx, snap.enemy, 4.0, false);
    renderSupplyCrates(combatSpy.ctx, snap.supplyCrates, 4.0);
    for (const u of snap.units) {
      renderUnitEntity(combatSpy.ctx, u, true, 4.0);
    }
    renderSlashes(combatSpy.ctx, snap.slashes, 0, 2400);
    renderActiveUltimates(combatSpy.ctx, snap.ultimates);
    renderProjectiles(combatSpy.ctx, snap.projectiles, 0, 2400);
    renderBeams(combatSpy.ctx, snap.beams, 0, 2400);
    renderParticles(combatSpy.ctx, snap.particles, 0, 2400);
    renderPopups(combatSpy.ctx, snap.popups, 0, 2400);
    renderForegroundParallax(combatSpy.ctx, 11, 400, 932, 4.0, false);

    expect(combatSpy.metrics.gradientCalls).toBe(0);
    expect(combatSpy.metrics.clipCalls).toBe(0);
    expect(combatSpy.metrics.drawCalls).toBeGreaterThan(200);

    // Background transition + adaptive lowDetail + cache clearing remain safe in Node
    const bgSpy = createSpyCanvasContext();
    renderBackground(bgSpy.ctx, 11, 400, 932, 4.0, { active: true, fromEra: 10, toEra: 11, progress: 0.5 }, true);
    expect(bgSpy.metrics.drawCalls).toBeGreaterThan(50);
    expect(() => {
      clearUnitSpriteCache();
      clearBackgroundCache();
      clearPrimitiveCaches();
    }).not.toThrow();
  });
});
