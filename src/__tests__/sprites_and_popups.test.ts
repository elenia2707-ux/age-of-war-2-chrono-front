import { describe, expect, it } from 'vitest';
import atlasRaw from '../../public/sprites/sprites_atlas.json';
import { ERAS, TURRET_BY_ID, UNIT_BY_ID } from '../data/eras';
import { GameEngine } from '../game/engine';
import type { SpriteAtlasData } from '../render/spriteAtlas';
import { selectUnitAnimFrame } from '../render/unitRenderer';

const atlas = atlasRaw as SpriteAtlasData;

const HEAVY_UNITS = new Set([
  'dino_rider',
  'sphinx_chariot',
  'chariot',
  'heavy_cavalry',
  'catapult',
  'field_cannon',
  'steam_walker',
  'early_tank',
  'mbt',
  'colossus_mech',
  'omega_titan',
]);

describe('Pixel-Art Sprite Sheet Atlas & Animation Integrity', () => {
  it('contains valid sprites_atlas.json covering all 10 eras, 31 units, 20 turrets, bases, projectiles, tiles, and upgrade icons', () => {
    expect(atlas.meta.image).toBe('sprites_sheet.png');
    expect(atlas.meta.width).toBeGreaterThan(0);
    expect(atlas.meta.height).toBeGreaterThan(0);
    expect(atlas.meta.frameCount).toBe(Object.keys(atlas.frames).length);

    const sheetW = atlas.meta.width;
    const sheetH = atlas.meta.height;
    const anims = ['walk_0', 'walk_1', 'walk_2', 'walk_3', 'attack_0', 'attack_1', 'attack_2', 'hurt_0', 'death_0'];
    const teams = ['player', 'enemy'];

    // 1. All 31 units x 2 teams x 9 frames + resolution criteria
    for (const unitId of Object.keys(UNIT_BY_ID)) {
      for (const team of teams) {
        for (const anim of anims) {
          const key = `unit/${unitId}/${team}/${anim}`;
          const f = atlas.frames[key];
          expect(f, `Missing unit frame ${key}`).toBeDefined();
          expect(f.x).toBeGreaterThanOrEqual(0);
          expect(f.y).toBeGreaterThanOrEqual(0);
          expect(f.x + f.w).toBeLessThanOrEqual(sheetW);
          expect(f.y + f.h).toBeLessThanOrEqual(sheetH);

          if (HEAVY_UNITS.has(unitId)) {
            expect(f.w).toBeGreaterThanOrEqual(48);
            expect(f.w).toBeLessThanOrEqual(72);
            expect(f.h).toBeGreaterThanOrEqual(48);
            expect(f.h).toBeLessThanOrEqual(72);
          } else {
            expect(f.w).toBeGreaterThanOrEqual(32);
            expect(f.w).toBeLessThanOrEqual(40);
            expect(f.h).toBeGreaterThanOrEqual(32);
            expect(f.h).toBeLessThanOrEqual(40);
          }
        }
      }
    }

    // 2. All 10 era bases x 2 teams x 3 damage states (>= 96x128px)
    for (let era = 0; era < ERAS.length; era++) {
      for (const team of teams) {
        for (const dmg of ['intact', 'damaged_50', 'damaged_25']) {
          const key = `base/era_${era}/${team}/${dmg}`;
          const f = atlas.frames[key];
          expect(f, `Missing base frame ${key}`).toBeDefined();
          expect(f.w).toBeGreaterThanOrEqual(96);
          expect(f.h).toBeGreaterThanOrEqual(128);
          expect(f.x + f.w).toBeLessThanOrEqual(sheetW);
          expect(f.y + f.h).toBeLessThanOrEqual(sheetH);
        }
      }
    }

    // 3. All 20 turrets x 2 teams x 2 states + platforms
    for (const team of teams) {
      expect(atlas.frames[`turret/platform/${team}`]).toBeDefined();
    }
    for (const turretId of Object.keys(TURRET_BY_ID)) {
      for (const team of teams) {
        expect(atlas.frames[`turret/${turretId}/${team}/idle`]).toBeDefined();
        expect(atlas.frames[`turret/${turretId}/${team}/fire`]).toBeDefined();
      }
    }

    // 4. All projectile, ultimate, ground tile, prop & upgrade icon sprites
    const requiredMisc = [
      'proj/stone',
      'proj/boulder',
      'proj/solar_orb',
      'proj/arrow',
      'proj/fire_arrow',
      'proj/bolt',
      'proj/bullet',
      'proj/cannonball',
      'proj/shell',
      'proj/rocket',
      'proj/plasma/player',
      'proj/plasma/enemy',
      'proj/antimatter/player',
      'proj/antimatter/enemy',
      'proj/meteor',
      'proj/bomb',
      'proj/cruise_missile',
      'ult/bomber/player',
      'ult/bomber/enemy',
      'ult/zeppelin/player',
      'ult/zeppelin/enemy',
      'icon/upg_weapons',
      'icon/upg_armor',
      'icon/upg_economy',
      'icon/upg_fortress',
      ...Array.from({ length: 10 }, (_, i) => `tile/ground_era_${i}`),
      ...Array.from({ length: 10 }, (_, i) => `prop/mid_${i}`),
      ...Array.from({ length: 10 }, (_, i) => `prop/fore_${i}`),
    ];
    for (const key of requiredMisc) {
      expect(atlas.frames[key], `Missing sprite ${key}`).toBeDefined();
    }
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

  it('spreads simultaneous combat damage popups horizontally and vertically so none overlap', () => {
    const engine = new GameEngine();
    engine.startNewGame('normal', 2026);
    engine.player.eraIndex = 2;
    engine.enemy.eraIndex = 2;

    // Place a cluster of knights fighting in melee at the exact same frontline spot
    for (let i = 0; i < 4; i++) {
      const p = engine.spawnUnit('player', UNIT_BY_ID.knight);
      p.x = 1180 + i * 2;
      p.attackCooldown = 0;
      const e = engine.spawnUnit('enemy', UNIT_BY_ID.knight);
      e.x = 1212 + i * 2;
      e.attackCooldown = 0;
    }

    // Step one tick so all 8 knights strike simultaneously at the same front line!
    engine.step(0.05);

    expect(engine.popups.length).toBeGreaterThanOrEqual(4);

    // Verify no two popups sit stacked on top of the exact same spot
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

    // Verify popups also have varied upward rise speeds and horizontal spread
    const xs = engine.popups.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(20);
  });
});
