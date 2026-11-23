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

    let playerCount = 0;
    let enemyCount = 0;
    let closestPlayerX = 0;
    let playerHeavyCount = 0;
    let playerRangedCount = 0;
    let enemyFrontlineCount = 0;
    let enemyRangedCount = 0;

    for (let i = 0; i < engine.units.length; i++) {
      const u = engine.units[i];
      if (u.state === 'dead') continue;
      if (u.team === 'player') {
        playerCount++;
        if (u.x > closestPlayerX) closestPlayerX = u.x;
        if (u.def.role === 'heavy' || u.def.role === 'siege') playerHeavyCount++;
        else if (u.def.role === 'ranged') playerRangedCount++;
      } else {
        enemyCount++;
        if (u.def.role === 'melee' || u.def.role === 'heavy') enemyFrontlineCount++;
        else enemyRangedCount++;
      }
    }

    const criticalThreat = closestPlayerX > WORLD_WIDTH * 0.72 && enemyCount < 3;
    const underThreat = closestPlayerX > WORLD_WIDTH * 0.56 || enemy.baseHp < enemy.baseMaxHp * 0.72;

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
      playerCount >= minUltTargets &&
      closestPlayerX > WORLD_WIDTH * (diff.aiCounterSmartness >= 0.85 ? 0.38 : 0.45)
    ) {
      engine.triggerUltimate('enemy');
      return;
    }

    // 2b. AI Commander Tactical Skill (Hard+ when enemy has an assigned commander)
    if (
      enemy.commanderId !== null &&
      engine.elapsed > 12 &&
      engine.canUseTacticalSkill('enemy') &&
      (underThreat || (enemyCount >= 2 && playerCount >= 2))
    ) {
      engine.triggerTacticalSkill('enemy');
      return;
    }

    // 3. Difficulty-scaled Gold Spec Upgrades (all 24 upgrades)
    if (!criticalThreat && this.tryPurchaseUpgrade(engine, underThreat, enemyCount)) {
      return;
    }

    // 4. Turret management: sell outdated turrets or build new era turret (discount-aware!)
    let installedCount = 0;
    let outdatedSlot = -1;
    let hasEmptySlot = false;
    const minOutdatedGap = diff.aiCounterSmartness >= 0.8 ? 1 : 2;
    for (let i = 0; i < enemy.turretSlots; i++) {
      const t = enemy.turrets[i];
      if (t) {
        installedCount++;
        if (outdatedSlot === -1 && enemy.eraIndex >= minOutdatedGap && enemy.eraIndex - t.eraIndex >= minOutdatedGap) {
          outdatedSlot = t.slotIndex;
        }
      } else {
        hasEmptySlot = true;
      }
    }

    const targetTurrets = Math.min(
      diff.aiMaxTurrets,
      Math.max(1, Math.floor((enemy.eraIndex + (diff.aiCounterSmartness >= 0.8 ? 3 : 2)) / 2)),
    );

    const lightTurret = era.turrets[0];
    const heavyTurret = era.turrets[1];
    const lightTurretCost = engine.getEffectiveTurretCost('enemy', lightTurret.cost);
    const heavyTurretCost = heavyTurret ? engine.getEffectiveTurretCost('enemy', heavyTurret.cost) : Infinity;

    if (outdatedSlot !== -1 && enemy.gold >= lightTurretCost * (minOutdatedGap === 1 ? 1.1 : 0.85)) {
      engine.sellTurret('enemy', outdatedSlot);
      hasEmptySlot = true;
      installedCount--;
    }

    // Expand slot if all unlocked slots are full and below desired turret cap
    const nextSlotCost = engine.getNextTurretSlotCost('enemy');
    if (
      nextSlotCost !== null &&
      installedCount === enemy.turretSlots &&
      enemy.turretSlots < targetTurrets &&
      enemy.gold >= nextSlotCost + lightTurretCost * 0.5
    ) {
      engine.expandTurretSlot('enemy');
      return;
    }

    // Install a turret if an unlocked slot is empty and base is threatened or mid-match
    const earlyTurretTime = diff.aiCounterSmartness >= 0.8 ? 16 : 28;
    if (hasEmptySlot && (underThreat || engine.elapsed > earlyTurretTime)) {
      if (
        heavyTurret &&
        enemy.gold >= heavyTurretCost &&
        (engine.random() < 0.55 + diff.aiCounterSmartness * 0.25 || enemy.eraIndex >= 2)
      ) {
        engine.installTurret('enemy', heavyTurret.id);
        return;
      }
      if (lightTurret && enemy.gold >= lightTurretCost) {
        engine.installTurret('enemy', lightTurret.id);
        return;
      }
    }

    // 5. Tactical unit composition & counter-picking training (discount-aware!)
    if (enemy.queue.length >= diff.aiMaxQueue) return;

    const units = era.units;
    const unitCost = (cost: number) => engine.getEffectiveUnitCost('enemy', cost);

    // Emergency cheap defender when player is near enemy base
    if (criticalThreat) {
      const cheapest = units[0];
      if (cheapest && enemy.gold >= unitCost(cheapest.cost)) {
        engine.enqueueUnit('enemy', cheapest.id);
        return;
      }
    }

    const heavyUnits = units.filter((u) => u.role === 'heavy' || u.role === 'siege');
    const topUnit = heavyUnits[heavyUnits.length - 1] ?? units[units.length - 1];
    const topCost = topUnit ? unitCost(topUnit.cost) : Infinity;

    // Save occasionally for heavy/siege units instead of spamming only tier-1 units
    if (
      topUnit &&
      enemy.gold < topCost &&
      enemy.gold >= topCost * (diff.aiCounterSmartness >= 0.8 ? 0.52 : 0.62) &&
      enemyCount >= 2 &&
      !underThreat &&
      engine.random() < 0.45 + diff.aiCounterSmartness * 0.15
    ) {
      return;
    }

    // Active Counter-Picking on higher difficulties!
    const counterRoll = engine.random();
    if (counterRoll < diff.aiCounterSmartness * 0.55) {
      // Counter player heavy/armored units with armor-piercing specialists
      if (playerHeavyCount >= 2 && enemyFrontlineCount >= 1) {
        for (let i = units.length - 1; i >= 0; i--) {
          const u = units[i];
          if (u.armorPierce && enemy.gold >= unitCost(u.cost)) {
            if (engine.enqueueUnit('enemy', u.id)) return;
          }
        }
      }
      // Counter clustered player ranged stacks with splash siege/heavy breakers
      if (playerRangedCount >= 3) {
        for (let i = units.length - 1; i >= 0; i--) {
          const u = units[i];
          if (u.splashRadius > 0 && enemy.gold >= unitCost(u.cost)) {
            if (engine.enqueueUnit('enemy', u.id)) return;
          }
        }
      }
    }

    // Choose unit based on squad composition balance across all 4 units per era
    const roll = engine.random();
    let candidate = units[0];
    const heavyRollThreshold = 0.34 + diff.aiCounterSmartness * 0.24;

    const affordableHeavy = heavyUnits.filter((u) => enemy.gold >= unitCost(u.cost));
    const affordableRanged = units.filter((u) => u.role === 'ranged' && enemy.gold >= unitCost(u.cost));
    const affordableMelee = units.filter((u) => u.role === 'melee' && enemy.gold >= unitCost(u.cost));

    if (affordableHeavy.length > 0 && roll < heavyRollThreshold) {
      candidate = affordableHeavy[Math.floor(engine.random() * affordableHeavy.length)];
    } else if (affordableRanged.length > 0 && enemyFrontlineCount >= enemyRangedCount && roll < 0.8) {
      candidate = affordableRanged[Math.floor(engine.random() * affordableRanged.length)];
    } else if (affordableMelee.length > 0) {
      candidate = affordableMelee[Math.floor(engine.random() * affordableMelee.length)];
    } else {
      let bestAffordable: (typeof units)[number] | null = null;
      for (let i = units.length - 1; i >= 0; i--) {
        if (enemy.gold >= unitCost(units[i].cost)) {
          bestAffordable = units[i];
          break;
        }
      }
      if (!bestAffordable) return;
      candidate = bestAffordable;
    }

    if (candidate && enemy.gold >= unitCost(candidate.cost)) {
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

    // Tactical priority order across all 24 upgrades based on live battlefield pressure
    let priority: UpgradeId[];
    if (enemy.baseHp < enemy.baseMaxHp * 0.65) {
      priority = [
        'fortress',
        'turret_rapid',
        'vanguard_shield',
        'armor',
        'regeneration',
        'thorns',
        'berserk_fury',
        'weapons',
        'lifesteal',
        'executioner',
        'veteran_drill',
        'ultimate_power',
        'ult_efficiency',
        'attack_speed',
        'range_optics',
        'armor_pierce',
        'siege_craft',
        'mobility',
        'crit_mastery',
        'chrono_fever',
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
        'chrono_fever',
        'weapons',
        'armor',
        'vanguard_shield',
        'veteran_drill',
        'regeneration',
        'attack_speed',
        'range_optics',
        'berserk_fury',
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
        'berserk_fury',
        'veteran_drill',
        'executioner',
        'vanguard_shield',
        'armor_pierce',
        'siege_craft',
        'crit_mastery',
        'chrono_fever',
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
        'vanguard_shield',
        'weapons',
        'xp_mastery',
        'veteran_drill',
        'regeneration',
        'attack_speed',
        'berserk_fury',
        'executioner',
        'range_optics',
        'chrono_fever',
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
