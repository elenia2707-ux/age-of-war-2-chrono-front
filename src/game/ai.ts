import { DIFFICULTIES } from '../data/difficulty';
import { getEra } from '../data/eras';
import type { UpgradeId } from '../data/types';
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
    const criticalThreat = closestPlayerX > WORLD_WIDTH * 0.72 && enemyUnits.length < 3;
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

    // 3. Difficulty-scaled Gold Spec Upgrades (weapons, armor, economy, fortress)
    if (!criticalThreat && this.tryPurchaseUpgrade(engine, underThreat, enemyUnits.length)) {
      return;
    }

    // 4. Turret management: sell outdated turrets or build new era turret
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
    const nextSlotCost = engine.getNextTurretSlotCost('enemy');
    if (
      nextSlotCost !== null &&
      installedTurrets.length === enemy.turretSlots &&
      enemy.turretSlots < targetTurrets &&
      enemy.gold >= nextSlotCost + era.turrets[0].cost * 0.5
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

    // 5. Tactical unit composition training
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
    if (criticalThreat) {
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

    // Choose unit based on squad composition balance across all 4 units per era
    const roll = engine.random();
    let candidate = units[0];

    if (topUnit && enemy.gold >= topUnit.cost && roll < (engine.difficulty === 'hard' ? 0.48 : 0.36)) {
      const affordableHeavy = heavyUnits.filter((u) => enemy.gold >= u.cost);
      candidate =
        affordableHeavy[Math.floor(engine.random() * affordableHeavy.length)] ?? topUnit;
    } else if (
      rangedUnits.length > 0 &&
      enemyFrontlineCount >= enemyRangedCount &&
      rangedUnits.some((u) => enemy.gold >= u.cost) &&
      roll < 0.78
    ) {
      const affordableRanged = rangedUnits.filter((u) => enemy.gold >= u.cost);
      candidate = affordableRanged[Math.floor(engine.random() * affordableRanged.length)];
    } else if (meleeUnits.some((u) => enemy.gold >= u.cost)) {
      const affordableMelee = meleeUnits.filter((u) => enemy.gold >= u.cost);
      candidate = affordableMelee[Math.floor(engine.random() * affordableMelee.length)];
    } else {
      const affordable = units.filter((u) => enemy.gold >= u.cost);
      if (affordable.length === 0) return;
      candidate = affordable[affordable.length - 1];
    }

    if (candidate && enemy.gold >= candidate.cost) {
      engine.enqueueUnit('enemy', candidate.id);
    }
  }

  private tryPurchaseUpgrade(engine: GameEngine, underThreat: boolean, activeAllies: number): boolean {
    const diff = DIFFICULTIES[engine.difficulty];
    const enemy = engine.enemy;
    const era = getEra(enemy.eraIndex);

    // Keep a healthy reserve for at least one frontline defender before spending on upgrades
    const reserveGold = era.units[0].cost * (underThreat ? 1.5 : 0.9);
    if (engine.random() > diff.aiUpgradeChance) return false;

    // Cap target upgrade level gracefully by both difficulty ceiling and era progression
    const eraCap = Math.min(diff.aiMaxUpgradeLevel, Math.max(1, enemy.eraIndex + 1));

    // Tactical priority order across all 16 upgrades based on live battlefield pressure
    let priority: UpgradeId[];
    if (enemy.baseHp < enemy.baseMaxHp * 0.65) {
      // Base damaged -> prioritize fortress (instant 15% heal + stronger turrets), regen, thorns, armor
      priority = [
        'fortress',
        'armor',
        'regeneration',
        'thorns',
        'weapons',
        'lifesteal',
        'ultimate_power',
        'attack_speed',
        'range_optics',
        'armor_pierce',
        'siege_craft',
        'mobility',
        'crit_mastery',
        'discount',
        'economy',
        'bounty',
      ];
    } else if (enemy.upgrades.economy < Math.min(eraCap, 3) && !underThreat) {
      // Early/mid economic, discount & bounty snowballing
      priority = [
        'economy',
        'discount',
        'bounty',
        'weapons',
        'armor',
        'regeneration',
        'attack_speed',
        'range_optics',
        'lifesteal',
        'armor_pierce',
        'mobility',
        'crit_mastery',
        'siege_craft',
        'thorns',
        'ultimate_power',
        'fortress',
      ];
    } else if (activeAllies >= 3) {
      // Active push -> scale DPS, pierce, siege, lifesteal & march momentum
      priority = [
        'weapons',
        'attack_speed',
        'armor_pierce',
        'siege_craft',
        'crit_mastery',
        'lifesteal',
        'range_optics',
        'armor',
        'mobility',
        'ultimate_power',
        'regeneration',
        'thorns',
        'discount',
        'bounty',
        'economy',
        'fortress',
      ];
    } else {
      priority = [
        'armor',
        'weapons',
        'regeneration',
        'attack_speed',
        'range_optics',
        'thorns',
        'armor_pierce',
        'lifesteal',
        'mobility',
        'crit_mastery',
        'discount',
        'siege_craft',
        'economy',
        'bounty',
        'ultimate_power',
        'fortress',
      ];
    }

    for (const id of priority) {
      const level = enemy.upgrades[id];
      if (level >= eraCap) continue;
      const cost = engine.getUpgradeCost('enemy', id);
      if (cost !== null && enemy.gold >= cost + reserveGold) {
        return engine.buyUpgrade('enemy', id);
      }
    }

    return false;
  }
}
