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

    // 1. Era evolution check (faster on Brutal / instant on Nightmare & Mythic)
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

    const playerHeavyCount = playerUnits.filter(
      (u) => u.def.role === 'heavy' || u.def.role === 'siege',
    ).length;
    const playerRangedCount = playerUnits.filter((u) => u.def.role === 'ranged').length;

    // 2. Ultimate usage respects XP cost & avoids delaying imminent evolution unless critical
    const nearEvolution = era.evolveXp > 0 && enemy.xp >= era.evolveXp * 0.78;
    const minUltTargets =
      diff.aiCounterSmartness >= 0.9
        ? playerHeavyCount >= 2
          ? 2
          : 3
        : diff.aiCounterSmartness >= 0.65
          ? 3
          : 4;
    if (
      diff.aiUsesUltimate &&
      engine.canUseUltimate('enemy') &&
      (!nearEvolution || criticalThreat) &&
      playerUnits.length >= minUltTargets &&
      closestPlayerX > WORLD_WIDTH * (diff.aiCounterSmartness >= 0.85 ? 0.38 : 0.45)
    ) {
      engine.triggerUltimate('enemy');
      return;
    }

    // 3. Difficulty-scaled Gold Spec Upgrades (all 20 upgrades)
    if (!criticalThreat && this.tryPurchaseUpgrade(engine, underThreat, enemyUnits.length)) {
      return;
    }

    // 4. Turret management: sell outdated turrets or build new era turret
    const installedTurrets = enemy.turrets.filter((t) => t !== null);
    const targetTurrets = Math.min(
      diff.aiMaxTurrets,
      Math.max(1, Math.floor((enemy.eraIndex + (diff.aiCounterSmartness >= 0.8 ? 3 : 2)) / 2)),
    );

    // Replace outdated turrets (1+ era behind on Brutal+, 2+ eras behind on Normal/Hard)
    const minOutdatedGap = diff.aiCounterSmartness >= 0.8 ? 1 : 2;
    if (installedTurrets.length > 0 && enemy.eraIndex >= minOutdatedGap) {
      const outdated = installedTurrets.find(
        (t) => t && enemy.eraIndex - t.eraIndex >= minOutdatedGap,
      );
      const cheapestTurret = era.turrets[0];
      if (outdated && enemy.gold >= cheapestTurret.cost * (minOutdatedGap === 1 ? 1.1 : 0.85)) {
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
    const earlyTurretTime = diff.aiCounterSmartness >= 0.8 ? 16 : 28;
    if (hasEmptySlot && (underThreat || engine.elapsed > earlyTurretTime)) {
      const heavyTurret = era.turrets[1];
      const lightTurret = era.turrets[0];
      if (
        heavyTurret &&
        enemy.gold >= heavyTurret.cost &&
        (engine.random() < 0.55 + diff.aiCounterSmartness * 0.25 || enemy.eraIndex >= 2)
      ) {
        engine.installTurret('enemy', heavyTurret.id);
        return;
      }
      if (lightTurret && enemy.gold >= lightTurret.cost) {
        engine.installTurret('enemy', lightTurret.id);
        return;
      }
    }

    // 5. Tactical unit composition & counter-picking training
    if (enemy.queue.length >= diff.aiMaxQueue) return;

    const units = era.units;
    const meleeUnits = units.filter((u) => u.role === 'melee');
    const rangedUnits = units.filter((u) => u.role === 'ranged');
    const heavyUnits = units.filter((u) => u.role === 'heavy' || u.role === 'siege');
    const armorPiercers = units.filter((u) => u.armorPierce && enemy.gold >= u.cost);
    const splashUnits = units.filter((u) => u.splashRadius > 0 && enemy.gold >= u.cost);

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
      enemy.gold >= topUnit.cost * (diff.aiCounterSmartness >= 0.8 ? 0.52 : 0.62) &&
      enemyUnits.length >= 2 &&
      !underThreat &&
      engine.random() < 0.45 + diff.aiCounterSmartness * 0.15
    ) {
      return;
    }

    // Active Counter-Picking on higher difficulties!
    const counterRoll = engine.random();
    if (counterRoll < diff.aiCounterSmartness * 0.55) {
      // Counter player heavy/armored units with armor-piercing specialists
      if (playerHeavyCount >= 2 && armorPiercers.length > 0 && enemyFrontlineCount >= 1) {
        const pick = armorPiercers[armorPiercers.length - 1];
        if (engine.enqueueUnit('enemy', pick.id)) return;
      }
      // Counter clustered player ranged stacks with splash siege/heavy breakers
      if (playerRangedCount >= 3 && splashUnits.length > 0) {
        const pick = splashUnits[splashUnits.length - 1];
        if (engine.enqueueUnit('enemy', pick.id)) return;
      }
    }

    // Choose unit based on squad composition balance across all 4 units per era
    const roll = engine.random();
    let candidate = units[0];
    const heavyRollThreshold = 0.34 + diff.aiCounterSmartness * 0.24;

    if (topUnit && enemy.gold >= topUnit.cost && roll < heavyRollThreshold) {
      const affordableHeavy = heavyUnits.filter((u) => enemy.gold >= u.cost);
      candidate =
        affordableHeavy[Math.floor(engine.random() * affordableHeavy.length)] ?? topUnit;
    } else if (
      rangedUnits.length > 0 &&
      enemyFrontlineCount >= enemyRangedCount &&
      rangedUnits.some((u) => enemy.gold >= u.cost) &&
      roll < 0.8
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
    const eraBonus = diff.aiCounterSmartness >= 0.9 ? 3 : diff.aiCounterSmartness >= 0.75 ? 2 : 1;
    const eraCap = Math.min(diff.aiMaxUpgradeLevel, Math.max(1, enemy.eraIndex + eraBonus));

    // Tactical priority order across all 20 upgrades based on live battlefield pressure
    let priority: UpgradeId[];
    if (enemy.baseHp < enemy.baseMaxHp * 0.65) {
      priority = [
        'fortress',
        'turret_rapid',
        'armor',
        'regeneration',
        'thorns',
        'weapons',
        'lifesteal',
        'executioner',
        'ultimate_power',
        'ult_efficiency',
        'attack_speed',
        'range_optics',
        'armor_pierce',
        'siege_craft',
        'mobility',
        'crit_mastery',
        'xp_mastery',
        'discount',
        'economy',
        'bounty',
      ];
    } else if (enemy.upgrades.economy < Math.min(eraCap, 3) && !underThreat) {
      priority = [
        'economy',
        'xp_mastery',
        'discount',
        'bounty',
        'weapons',
        'armor',
        'regeneration',
        'attack_speed',
        'range_optics',
        'executioner',
        'lifesteal',
        'armor_pierce',
        'mobility',
        'crit_mastery',
        'siege_craft',
        'turret_rapid',
        'ult_efficiency',
        'thorns',
        'ultimate_power',
        'fortress',
      ];
    } else if (activeAllies >= 3) {
      priority = [
        'weapons',
        'attack_speed',
        'executioner',
        'armor_pierce',
        'siege_craft',
        'crit_mastery',
        'lifesteal',
        'range_optics',
        'armor',
        'mobility',
        'xp_mastery',
        'ultimate_power',
        'ult_efficiency',
        'regeneration',
        'thorns',
        'turret_rapid',
        'discount',
        'bounty',
        'economy',
        'fortress',
      ];
    } else {
      priority = [
        'armor',
        'weapons',
        'xp_mastery',
        'regeneration',
        'attack_speed',
        'executioner',
        'range_optics',
        'thorns',
        'armor_pierce',
        'lifesteal',
        'turret_rapid',
        'mobility',
        'crit_mastery',
        'ult_efficiency',
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
