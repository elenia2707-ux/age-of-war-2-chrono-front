import { DIFFICULTIES } from '../data/difficulty';
import { getEra } from '../data/eras';
import { WORLD_WIDTH } from './constants';
import type { GameEngine } from './engine';

export class EnemyAI {
  private thinkTimer = 0.8;
  private evolveReadyTimer = 0;

  public reset(): void {
    this.thinkTimer = 0.9;
    this.evolveReadyTimer = 0;
  }

  public update(engine: GameEngine, dt: number): void {
    if (engine.status !== 'playing') return;

    const diff = DIFFICULTIES[engine.difficulty];
    const enemy = engine.enemy;
    const era = getEra(enemy.eraIndex);

    // 1. Era evolution check
    if (era.evolveXp > 0 && enemy.xp >= era.evolveXp) {
      this.evolveReadyTimer += dt;
      if (this.evolveReadyTimer >= diff.aiEvolveDelay) {
        engine.evolve('enemy');
        this.evolveReadyTimer = 0;
        return;
      }
    } else {
      this.evolveReadyTimer = 0;
    }

    this.thinkTimer -= dt;
    if (this.thinkTimer > 0) return;
    this.thinkTimer = diff.aiThinkInterval * (0.85 + engine.random() * 0.3);

    const playerUnits = engine.units.filter((u) => u.team === 'player' && u.state !== 'dead');
    const enemyUnits = engine.units.filter((u) => u.team === 'enemy' && u.state !== 'dead');

    const closestPlayerX = playerUnits.reduce((maxX, u) => Math.max(maxX, u.x), 0);
    const underThreat = closestPlayerX > WORLD_WIDTH * 0.56 || enemy.baseHp < enemy.baseMaxHp * 0.72;

    // 2. Ultimate usage (Normal / Hard) when player army pushes past midfield
    if (
      diff.aiUsesUltimate &&
      enemy.ultimateCooldown <= 0 &&
      playerUnits.length >= (engine.difficulty === 'hard' ? 3 : 4) &&
      closestPlayerX > WORLD_WIDTH * 0.45
    ) {
      engine.triggerUltimate('enemy');
      return;
    }

    // 3. Turret management: sell outdated turrets or build new era turret
    const installedTurrets = enemy.turrets.filter((t) => t !== null);
    const targetTurrets = Math.min(
      diff.aiMaxTurrets,
      Math.max(1, Math.floor((enemy.eraIndex + 2) / 2)),
    );

    // Replace very old turret (2+ eras behind) when affordable
    if (installedTurrets.length > 0 && enemy.eraIndex >= 2) {
      const outdated = installedTurrets.find((t) => t && enemy.eraIndex - t.eraIndex >= 2);
      const cheapestTurret = era.turrets[0];
      if (outdated && enemy.gold >= cheapestTurret.cost * 0.85) {
        engine.sellTurret('enemy', outdated.slotIndex);
      }
    }

    // Expand slot if all unlocked slots are full and below desired turret cap
    if (
      installedTurrets.length === enemy.turretSlots &&
      enemy.turretSlots < targetTurrets &&
      enemy.gold >= engine.getNextTurretSlotCost('enemy')! + era.turrets[0].cost * 0.5
    ) {
      engine.expandTurretSlot('enemy');
      return;
    }

    // Install a turret if an unlocked slot is empty and base is threatened or mid-match
    const hasEmptySlot = enemy.turrets.slice(0, enemy.turretSlots).some((t) => t === null);
    if (hasEmptySlot && (underThreat || engine.elapsed > 28)) {
      const heavyTurret = era.turrets[1];
      const lightTurret = era.turrets[0];
      if (heavyTurret && enemy.gold >= heavyTurret.cost && (engine.random() < 0.55 || enemy.eraIndex >= 2)) {
        engine.installTurret('enemy', heavyTurret.id);
        return;
      }
      if (lightTurret && enemy.gold >= lightTurret.cost) {
        engine.installTurret('enemy', lightTurret.id);
        return;
      }
    }

    // 4. Tactical unit composition training
    if (enemy.queue.length >= 3) return;

    const units = era.units;
    const meleeUnits = units.filter((u) => u.role === 'melee');
    const rangedUnits = units.filter((u) => u.role === 'ranged');
    const heavyUnits = units.filter((u) => u.role === 'heavy' || u.role === 'siege');

    const enemyFrontlineCount = enemyUnits.filter(
      (u) => u.def.role === 'melee' || u.def.role === 'heavy',
    ).length;
    const enemyRangedCount = enemyUnits.filter(
      (u) => u.def.role === 'ranged' || u.def.role === 'siege',
    ).length;

    // Emergency cheap defender when player is near enemy base
    if (closestPlayerX > WORLD_WIDTH * 0.72 && enemyUnits.length < 3) {
      const cheapest = units[0];
      if (cheapest && enemy.gold >= cheapest.cost) {
        engine.enqueueUnit('enemy', cheapest.id);
        return;
      }
    }

    // Save occasionally for heavy/siege units instead of spamming only tier-1 units
    const topUnit = heavyUnits[heavyUnits.length - 1] ?? units[units.length - 1];
    if (
      topUnit &&
      enemy.gold < topUnit.cost &&
      enemy.gold >= topUnit.cost * 0.62 &&
      enemyUnits.length >= 2 &&
      !underThreat &&
      engine.random() < 0.45
    ) {
      return;
    }

    // Choose unit based on squad composition balance
    const roll = engine.random();
    let candidate = units[0];

    if (topUnit && enemy.gold >= topUnit.cost && roll < (engine.difficulty === 'hard' ? 0.5 : 0.36)) {
      candidate = heavyUnits[Math.floor(engine.random() * heavyUnits.length)] ?? topUnit;
    } else if (
      rangedUnits.length > 0 &&
      enemyFrontlineCount > enemyRangedCount &&
      enemy.gold >= rangedUnits[0].cost &&
      roll < 0.78
    ) {
      candidate = rangedUnits[Math.floor(engine.random() * rangedUnits.length)];
    } else if (meleeUnits.length > 0 && enemy.gold >= meleeUnits[0].cost) {
      candidate = meleeUnits[0];
    } else {
      const affordable = units.filter((u) => enemy.gold >= u.cost);
      if (affordable.length === 0) return;
      candidate = affordable[affordable.length - 1];
    }

    if (candidate && enemy.gold >= candidate.cost) {
      engine.enqueueUnit('enemy', candidate.id);
    }
  }
}
