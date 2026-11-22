import { describe, expect, it } from 'vitest';
import { ERAS, TURRET_BY_ID, UNIT_BY_ID } from '../data/eras';
import type { TurretVisualKind, UnitVisualKind } from '../data/types';
import { UPGRADES } from '../data/upgrades';
import { BattleCamera } from '../game/camera';
import { GameEngine } from '../game/engine';
import { renderBackground, renderForegroundParallax } from '../render/backgroundRenderer';
import { drawTurretArt, renderBase } from '../render/baseRenderer';
import { drawCartoonUpgradeIcon } from '../render/iconRenderer';
import { renderUnitPose, selectUnitAnimFrame } from '../render/unitRenderer';

/** Lightweight CanvasRenderingContext2D recorder for headless Node/Vitest vector rendering verification */
function createMockCanvasContext(): { ctx: CanvasRenderingContext2D; drawCalls: number } {
  const state = { drawCalls: 0 };
  const dummyGradient = { addColorStop: () => undefined };
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop) {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => dummyGradient;
      }
      if (prop in target) return target[prop as string];
      return (..._args: unknown[]) => {
        if (
          prop === 'fill' ||
          prop === 'stroke' ||
          prop === 'fillRect' ||
          prop === 'strokeRect' ||
          prop === 'fillText' ||
          prop === 'strokeText'
        ) {
          state.drawCalls++;
        }
      };
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  };
  const ctx = new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D;
  return {
    ctx,
    get drawCalls() {
      return state.drawCalls;
    },
  };
}

describe('Flash-Cartoon Vector Renderer, Zero Camera Shake & Combat Popups', () => {
  it('renders all 40 cartoon units, 20 rotating turrets, 10 era fortresses, 10 backgrounds, and 20 upgrade icons cleanly', () => {
    const unitIds = Object.keys(UNIT_BY_ID) as UnitVisualKind[];
    const turretIds = Object.keys(TURRET_BY_ID) as TurretVisualKind[];
    expect(unitIds).toHaveLength(40);
    expect(turretIds).toHaveLength(20);
    expect(ERAS).toHaveLength(10);
    expect(UPGRADES).toHaveLength(20);

    // 1. Every single one of the 40 units renders across walk, attack, hurt, and death states for both teams
    for (const kind of unitIds) {
      for (const team of ['player', 'enemy'] as const) {
        const mock = createMockCanvasContext();
        renderUnitPose(mock.ctx, {
          kind,
          team,
          walkPhase: 1.2,
          attackAnim: 0.6,
          hitFlash: 0,
          deathProgress: 0,
          isWalking: true,
        });
        renderUnitPose(mock.ctx, {
          kind,
          team,
          walkPhase: 0,
          attackAnim: 0,
          hitFlash: 0.7,
          deathProgress: 0.45,
          isWalking: false,
        });
        expect(mock.drawCalls, `Unit ${kind}/${team} emitted no cartoon vector draw calls`).toBeGreaterThan(8);
      }
    }

    // 2. Every single one of the 20 turrets renders cleanly in idle and firing recoil states
    for (const turretId of turretIds) {
      const mock = createMockCanvasContext();
      drawTurretArt(mock.ctx, turretId, 'player', -0.15, 0);
      drawTurretArt(mock.ctx, turretId, 'enemy', Math.PI + 0.15, 0.8);
      expect(mock.drawCalls, `Turret ${turretId} emitted too few draw calls`).toBeGreaterThan(6);
    }

    // 3. All 10 era fortresses (intact & damaged) and all 10 parallax backgrounds render cleanly
    const engine = new GameEngine();
    engine.startNewGame('normal', 2026);
    for (let eraIdx = 0; eraIdx < ERAS.length; eraIdx++) {
      engine.player.eraIndex = eraIdx;
      engine.player.baseHp = engine.player.baseMaxHp * 0.2; // verify damaged_25 smoke/cracks too
      const mock = createMockCanvasContext();
      renderBackground(mock.ctx, eraIdx, 320, 852, 4.5);
      renderBase(mock.ctx, engine.player, 4.5, true);
      renderForegroundParallax(mock.ctx, eraIdx, 320, 852, 4.5);
      expect(mock.drawCalls, `Era ${eraIdx} scene emitted too few draw calls`).toBeGreaterThan(20);
    }

    // 4. All 20 Gold Upgrade cartoon icons render cleanly
    for (const upg of UPGRADES) {
      const mock = createMockCanvasContext();
      drawCartoonUpgradeIcon(mock.ctx, upg.id);
      expect(mock.drawCalls, `Upgrade icon ${upg.id} emitted too few draw calls`).toBeGreaterThan(2);
    }
  });

  it('keeps camera shake strictly disabled (0, 0) even after impacts and ultimates', () => {
    const camera = new BattleCamera();
    camera.setViewport(852, 315);
    camera.addShake(1.0);
    camera.update(0.05);
    expect(camera.shakeX).toBe(0);
    expect(camera.shakeY).toBe(0);

    camera.addShake(0.8);
    camera.update(0.1);
    expect(camera.shakeX).toBe(0);
    expect(camera.shakeY).toBe(0);
  });

  it('maps unit state cleanly across walk(4), attack(3), hurt(1), and death(1) frames', () => {
    const base = {
      kind: 'knight' as const,
      team: 'player' as const,
      walkPhase: 0,
      attackAnim: 0,
      hitFlash: 0,
      deathProgress: 0,
      isWalking: true,
    };

    expect(selectUnitAnimFrame({ ...base, walkPhase: 0.1 })).toBe('walk_0');
    expect(selectUnitAnimFrame({ ...base, walkPhase: Math.PI * 0.55 })).toBe('walk_1');
    expect(selectUnitAnimFrame({ ...base, walkPhase: Math.PI * 1.1 })).toBe('walk_2');
    expect(selectUnitAnimFrame({ ...base, walkPhase: Math.PI * 1.65 })).toBe('walk_3');

    expect(selectUnitAnimFrame({ ...base, isWalking: false, attackAnim: 0.9 })).toBe('attack_0');
    expect(selectUnitAnimFrame({ ...base, isWalking: false, attackAnim: 0.55 })).toBe('attack_1');
    expect(selectUnitAnimFrame({ ...base, isWalking: false, attackAnim: 0.15 })).toBe('attack_2');

    expect(selectUnitAnimFrame({ ...base, hitFlash: 0.8 })).toBe('hurt_0');
    expect(selectUnitAnimFrame({ ...base, deathProgress: 0.1 })).toBe('hurt_0');
    expect(selectUnitAnimFrame({ ...base, deathProgress: 0.5 })).toBe('death_0');
  });

  it('spawns hit-impact starbursts, directional sparks, delayed HP drain trails, and non-overlapping popups', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 2026);
    engine.player.eraIndex = 3;
    engine.enemy.eraIndex = 3;

    // Place a cluster of knights fighting in melee at the exact same frontline spot
    const victims = [];
    for (let i = 0; i < 4; i++) {
      const p = engine.spawnUnit('player', UNIT_BY_ID.knight);
      p.x = 1180 + i * 2;
      p.attackCooldown = 0;
      const e = engine.spawnUnit('enemy', UNIT_BY_ID.knight);
      e.x = 1212 + i * 2;
      e.attackCooldown = 0;
      victims.push(e);
    }

    // Step one tick so all 8 knights strike simultaneously at the same front line!
    engine.step(0.05);

    expect(engine.popups.length).toBeGreaterThanOrEqual(4);
    expect(engine.particles.some((p) => p.shape === 'flash_star')).toBe(true);
    expect(engine.particles.some((p) => p.shape === 'spark')).toBe(true);
    expect(victims.some((v) => v.hp < v.maxHp && v.displayHp > v.hp)).toBe(true);

    let overlappingPairs = 0;
    for (let i = 0; i < engine.popups.length; i++) {
      for (let j = i + 1; j < engine.popups.length; j++) {
        const a = engine.popups[i];
        const b = engine.popups[j];
        if (Math.abs(a.x - b.x) < 16 && Math.abs(a.y - b.y) < 12) {
          overlappingPairs++;
        }
      }
    }
    expect(overlappingPairs).toBe(0);

    const xs = engine.popups.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(20);
  });
});
