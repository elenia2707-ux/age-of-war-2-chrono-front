import { DIFFICULTIES } from '../data/difficulty';
import { ERAS, TURRET_BY_ID, UNIT_BY_ID, getEra } from '../data/eras';
import {
  FORTRESS_UPGRADE_REPAIR_RATIO,
  UPGRADE_BY_ID,
  createInitialUpgrades,
  getArmorHpMult,
  getArmorMitigationBonus,
  getAttackSpeedMult,
  getBaseMaxHpMult,
  getCritChanceBonus,
  getCritDamageBonus,
  getGoldIncomeMult,
  getKillGoldMult,
  getKillXpMult,
  getKnockbackResistMult,
  getMoveSpeedMult,
  getNextUpgradeCost,
  getTrainSpeedMult,
  getTurretDamageMult,
  getUltimateCooldownMult,
  getWeaponDamageMult,
} from '../data/upgrades';
import type {
  ActiveUltimate,
  BeamEffect,
  DamagePopup,
  DifficultyId,
  EngineCallbacks,
  FactionState,
  GameSnapshot,
  GameStatus,
  ParticleEntity,
  ProjectileEntity,
  ScorchMark,
  SlashEffect,
  Team,
  TurretVisualKind,
  UnitDef,
  UnitEntity,
  UnitVisualKind,
  UpgradeId,
} from '../data/types';
import { EnemyAI } from './ai';
import {
  BASE_HIT_XP_PER_100_DMG,
  CRIT_MULTIPLIER,
  ENEMY_BASE_FRONT_X,
  ENEMY_BASE_X,
  ENEMY_SPAWN_X,
  GROUND_Y,
  LOSS_XP_RATIO,
  MAX_QUEUE_SIZE,
  MAX_TURRET_SLOTS,
  MAX_UNITS_PER_TEAM,
  PLAYER_BASE_FRONT_X,
  PLAYER_BASE_X,
  PLAYER_SPAWN_X,
  STARTING_GOLD,
  TURRET_MOUNT_OFFSETS,
  TURRET_SELL_REFUND_RATE,
  TURRET_SLOT_COSTS,
  UNIT_DEATH_DURATION,
  WORLD_WIDTH,
} from './constants';

export class GameEngine {
  public status: GameStatus = 'title';
  public difficulty: DifficultyId = 'normal';
  public speed: 1 | 2 = 1;
  public elapsed = 0;

  public player: FactionState;
  public enemy: FactionState;

  public units: UnitEntity[] = [];
  public projectiles: ProjectileEntity[] = [];
  public beams: BeamEffect[] = [];
  public particles: ParticleEntity[] = [];
  public slashes: SlashEffect[] = [];
  public scorchMarks: ScorchMark[] = [];
  public popups: DamagePopup[] = [];
  public ultimates: ActiveUltimate[] = [];

  public eraTransition = {
    active: false,
    fromEra: 0,
    toEra: 0,
    progress: 1,
  };

  private nextUid = 1;
  private rngState = 1337;
  private ai = new EnemyAI();
  private callbacks: EngineCallbacks;

  constructor(callbacks: EngineCallbacks = {}) {
    this.callbacks = callbacks;
    this.player = this.createFaction('player');
    this.enemy = this.createFaction('enemy');
  }

  public setCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks;
  }

  public startNewGame(difficulty: DifficultyId, seed?: number): void {
    this.difficulty = difficulty;
    this.status = 'playing';
    this.speed = 1;
    this.elapsed = 0;
    this.nextUid = 1;
    this.rngState = seed ?? ((Date.now() & 0x7fffffff) || 1337);

    this.player = this.createFaction('player');
    this.enemy = this.createFaction('enemy');
    this.units = [];
    this.projectiles = [];
    this.beams = [];
    this.particles = [];
    this.slashes = [];
    this.scorchMarks = [];
    this.popups = [];
    this.ultimates = [];
    this.eraTransition = {
      active: false,
      fromEra: 0,
      toEra: 0,
      progress: 1,
    };
    this.ai.reset();
  }

  public setSpeed(speed: 1 | 2): void {
    this.speed = speed;
  }

  public toggleSpeed(): 1 | 2 {
    this.speed = this.speed === 1 ? 2 : 1;
    return this.speed;
  }

  public setPaused(paused: boolean): void {
    if (this.status !== 'playing' && this.status !== 'paused') return;
    this.status = paused ? 'paused' : 'playing';
  }

  public togglePause(): boolean {
    if (this.status === 'playing') {
      this.status = 'paused';
      return true;
    }
    if (this.status === 'paused') {
      this.status = 'playing';
      return false;
    }
    return false;
  }

  public random(): number {
    // Mulberry32 deterministic PRNG
    let t = (this.rngState += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public getFaction(team: Team): FactionState {
    return team === 'player' ? this.player : this.enemy;
  }

  public getOpponent(team: Team): FactionState {
    return team === 'player' ? this.enemy : this.player;
  }

  public getActiveUnitCount(team: Team): number {
    let count = 0;
    for (const u of this.units) {
      if (u.team === team && u.state !== 'dead') count++;
    }
    return count;
  }

  public getNextTurretSlotCost(team: Team): number | null {
    const f = this.getFaction(team);
    if (f.turretSlots >= MAX_TURRET_SLOTS) return null;
    return TURRET_SLOT_COSTS[f.turretSlots - 1] ?? null;
  }

  public getTurretWorldPosition(team: Team, slotIndex: number): { x: number; y: number } {
    const offset = TURRET_MOUNT_OFFSETS[Math.max(0, Math.min(TURRET_MOUNT_OFFSETS.length - 1, slotIndex))];
    const baseX = team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
    const dir = team === 'player' ? 1 : -1;
    return {
      x: baseX + offset.dx * dir,
      y: GROUND_Y + offset.dy,
    };
  }

  public enqueueUnit(team: Team, unitId: UnitVisualKind): boolean {
    if (this.status !== 'playing') return false;
    const faction = this.getFaction(team);
    const era = getEra(faction.eraIndex);
    const def = era.units.find((u) => u.id === unitId);
    if (!def) return false;
    if (faction.queue.length >= MAX_QUEUE_SIZE) return false;
    if (faction.gold < def.cost) return false;

    const effectiveTrainTime = def.trainTime / getTrainSpeedMult(faction.upgrades);
    faction.gold -= def.cost;
    faction.queue.push({
      unitId: def.id,
      eraIndex: def.eraIndex,
      cost: def.cost,
      trainTime: effectiveTrainTime,
      remaining: effectiveTrainTime,
    });
    if (team === 'player') {
      this.callbacks.onSound?.('spawn');
    }
    return true;
  }

  public getUpgradeCost(team: Team, id: UpgradeId): number | null {
    const faction = this.getFaction(team);
    return getNextUpgradeCost(id, faction.upgrades[id]);
  }

  public canBuyUpgrade(team: Team, id: UpgradeId): boolean {
    if (this.status !== 'playing') return false;
    const faction = this.getFaction(team);
    const cost = this.getUpgradeCost(team, id);
    return cost !== null && faction.gold >= cost;
  }

  public buyUpgrade(team: Team, id: UpgradeId): boolean {
    if (!this.canBuyUpgrade(team, id)) return false;
    const faction = this.getFaction(team);
    const cost = this.getUpgradeCost(team, id)!;
    const prevArmorMult = getArmorHpMult(faction.upgrades);
    const prevBaseMaxHp = faction.baseMaxHp;

    faction.gold -= cost;
    faction.upgrades[id] += 1;
    faction.upgradeFlash = 1;
    const newLevel = faction.upgrades[id];

    const baseX = team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
    const def = UPGRADE_BY_ID[id];

    if (id === 'armor') {
      // Scale existing live allied units immediately so upgrading mid-battle feels punchy
      const newArmorMult = getArmorHpMult(faction.upgrades);
      const ratio = newArmorMult / prevArmorMult;
      for (const u of this.units) {
        if (u.team === team && u.state !== 'dead') {
          const oldMax = u.maxHp;
          u.maxHp = Math.round(u.def.maxHp * newArmorMult);
          u.hp = Math.min(u.maxHp, Math.round(u.hp * ratio + Math.max(0, u.maxHp - oldMax) * 0.5));
          u.displayHp = Math.max(u.displayHp, u.hp);
          u.upgradeFlash = 1;
        }
      }
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, '#60a5fa', 1.18, 'heal');
    } else if (id === 'fortress') {
      const era = getEra(faction.eraIndex);
      const nextBaseMaxHp = Math.round(era.baseMaxHp * getBaseMaxHpMult(faction.upgrades));
      const maxGain = Math.max(0, nextBaseMaxHp - prevBaseMaxHp);
      const repair = Math.round(nextBaseMaxHp * FORTRESS_UPGRADE_REPAIR_RATIO);
      faction.baseMaxHp = nextBaseMaxHp;
      const beforeHp = faction.baseHp;
      faction.baseHp = Math.min(faction.baseMaxHp, faction.baseHp + maxGain + repair);
      faction.displayBaseHp = Math.max(faction.displayBaseHp, faction.baseHp);
      const nextUltMax = Math.max(10, Math.round(era.ultimate.cooldown * getUltimateCooldownMult(faction.upgrades) * 10) / 10);
      if (faction.ultimateMaxCooldown > 0 && faction.ultimateCooldown > 0) {
        faction.ultimateCooldown = Math.min(
          nextUltMax,
          faction.ultimateCooldown * (nextUltMax / faction.ultimateMaxCooldown),
        );
      }
      faction.ultimateMaxCooldown = nextUltMax;
      const healed = Math.max(1, Math.round(faction.baseHp - beforeHp));
      this.addPopup(baseX, GROUND_Y - 148, `+${healed} HP`, '#4ade80', 1.26, 'heal');
    } else if (
      id === 'weapons' ||
      id === 'attack_speed' ||
      id === 'crit_mastery' ||
      id === 'mobility'
    ) {
      for (const u of this.units) {
        if (u.team === team && u.state !== 'dead') {
          u.upgradeFlash = 1;
        }
      }
      const col =
        id === 'weapons'
          ? '#fb923c'
          : id === 'attack_speed'
            ? '#38bdf8'
            : id === 'crit_mastery'
              ? '#fde047'
              : '#4ade80';
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, col, 1.18, 'crit');
    } else {
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, '#facc15', 1.18, 'gold');
    }

    this.spawnRing(baseX, GROUND_Y - 76, '#facc15', 85);
    this.spawnFlashStar(baseX, GROUND_Y - 82, '#fde047', 22);
    this.spawnBurst(baseX, GROUND_Y - 76, '#fef08a', 12, 160);
    if (team === 'player') {
      this.callbacks.onSound?.('turret_build');
    }
    return true;
  }

  public cancelQueuedUnit(team: Team, queueIndex: number): boolean {
    if (this.status !== 'playing' && this.status !== 'paused') return false;
    const faction = this.getFaction(team);
    if (queueIndex < 0 || queueIndex >= faction.queue.length) return false;
    const [removed] = faction.queue.splice(queueIndex, 1);
    faction.gold += removed.cost;
    if (team === 'player') {
      this.callbacks.onSound?.('sell');
    }
    return true;
  }

  public expandTurretSlot(team: Team): boolean {
    if (this.status !== 'playing') return false;
    const faction = this.getFaction(team);
    const cost = this.getNextTurretSlotCost(team);
    if (cost === null || faction.gold < cost) return false;
    faction.gold -= cost;
    faction.turretSlots += 1;
    if (team === 'player') {
      this.callbacks.onSound?.('turret_build');
    }
    return true;
  }

  public installTurret(team: Team, turretId: TurretVisualKind, preferredSlot?: number): boolean {
    if (this.status !== 'playing') return false;
    const faction = this.getFaction(team);
    const era = getEra(faction.eraIndex);
    const def = era.turrets.find((t) => t.id === turretId);
    if (!def || faction.gold < def.cost) return false;

    let slotIndex = -1;
    if (
      preferredSlot !== undefined &&
      preferredSlot >= 0 &&
      preferredSlot < faction.turretSlots &&
      faction.turrets[preferredSlot] === null
    ) {
      slotIndex = preferredSlot;
    } else {
      for (let i = 0; i < faction.turretSlots; i++) {
        if (faction.turrets[i] === null) {
          slotIndex = i;
          break;
        }
      }
    }
    if (slotIndex === -1) return false;

    faction.gold -= def.cost;
    faction.turrets[slotIndex] = {
      slotIndex,
      turretId: def.id,
      eraIndex: def.eraIndex,
      cost: def.cost,
      cooldown: 0.2,
      aimAngle: team === 'player' ? 0 : Math.PI,
      recoil: 0,
    };

    const pos = this.getTurretWorldPosition(team, slotIndex);
    this.spawnBurst(pos.x, pos.y, '#fcd34d', 10, 120);
    if (team === 'player') {
      this.callbacks.onSound?.('turret_build');
    }
    return true;
  }

  public sellTurret(team: Team, slotIndex?: number): boolean {
    if (this.status !== 'playing') return false;
    const faction = this.getFaction(team);

    let targetSlot = -1;
    if (slotIndex !== undefined) {
      if (slotIndex >= 0 && slotIndex < faction.turretSlots && faction.turrets[slotIndex] !== null) {
        targetSlot = slotIndex;
      }
    } else {
      // Sell oldest/lowest-era turret first for smooth one-tap mobile UX
      let lowestEra = Infinity;
      for (let i = 0; i < faction.turretSlots; i++) {
        const t = faction.turrets[i];
        if (t && t.eraIndex < lowestEra) {
          lowestEra = t.eraIndex;
          targetSlot = i;
        }
      }
    }

    if (targetSlot === -1) return false;
    const turret = faction.turrets[targetSlot]!;
    const refund = Math.round(turret.cost * TURRET_SELL_REFUND_RATE);
    faction.turrets[targetSlot] = null;
    faction.gold += refund;

    const pos = this.getTurretWorldPosition(team, targetSlot);
    this.addPopup(pos.x, pos.y - 12, `+${refund}G`, '#facc15', 1.0);
    if (team === 'player') {
      this.callbacks.onSound?.('sell');
    }
    return true;
  }

  public canEvolve(team: Team): boolean {
    const faction = this.getFaction(team);
    const era = getEra(faction.eraIndex);
    return era.evolveXp > 0 && faction.xp >= era.evolveXp && faction.eraIndex < ERAS.length - 1;
  }

  public evolve(team: Team): boolean {
    if (this.status !== 'playing') return false;
    if (!this.canEvolve(team)) return false;

    const faction = this.getFaction(team);
    const prevEra = getEra(faction.eraIndex);
    const nextEra = getEra(faction.eraIndex + 1);

    faction.xp -= prevEra.evolveXp;
    faction.eraIndex = nextEra.index;

    const baseMult = getBaseMaxHpMult(faction.upgrades);
    const prevScaledMax = Math.round(prevEra.baseMaxHp * baseMult);
    const nextScaledMax = Math.round(nextEra.baseMaxHp * baseMult);
    const hpBonus = nextScaledMax - prevScaledMax;
    faction.baseMaxHp = nextScaledMax;
    faction.baseHp = Math.min(faction.baseMaxHp, faction.baseHp + hpBonus);
    faction.displayBaseHp = faction.baseHp;
    faction.ultimateMaxCooldown = Math.max(
      10,
      Math.round(nextEra.ultimate.cooldown * getUltimateCooldownMult(faction.upgrades) * 10) / 10,
    );
    // Reset ultimate cooldown on evolution so the player can unleash the new era's power right away
    faction.ultimateCooldown = 0;
    faction.evolveFlash = 1;

    const baseX = team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
    this.addPopup(baseX, GROUND_Y - 140, `+${hpBonus} HP`, '#4ade80', 1.32, 'heal');
    this.spawnRing(baseX, GROUND_Y - 60, nextEra.palette.accent, 110);
    this.spawnFlashStar(baseX, GROUND_Y - 84, '#fef08a', 32);
    this.spawnBurst(baseX, GROUND_Y - 70, '#fde047', 26, 220);

    if (team === 'player') {
      this.eraTransition = {
        active: true,
        fromEra: prevEra.index,
        toEra: nextEra.index,
        progress: 0,
      };
      this.callbacks.onSound?.('evolve');
      this.callbacks.onBanner?.(
        `시대 ${nextEra.eraNumber}: ${nextEra.name}`,
        `신규 병력 · 포탑 · 필살기 [${nextEra.ultimate.name}] 해금`,
        nextEra.palette.accent,
      );
    }
    return true;
  }

  public canUseUltimate(team: Team): boolean {
    const faction = this.getFaction(team);
    return this.status === 'playing' && faction.ultimateCooldown <= 0;
  }

  public triggerUltimate(team: Team): boolean {
    if (!this.canUseUltimate(team)) return false;
    const faction = this.getFaction(team);
    const era = getEra(faction.eraIndex);
    const def = era.ultimate;

    const scaledCd = Math.max(
      10,
      Math.round(def.cooldown * getUltimateCooldownMult(faction.upgrades) * 10) / 10,
    );
    faction.ultimateCooldown = scaledCd;
    faction.ultimateMaxCooldown = scaledCd;

    const active: ActiveUltimate = {
      uid: this.nextUid++,
      team,
      def,
      elapsed: 0,
      duration: def.duration,
      strikesFired: 0,
      nextStrikeAt: 0.08,
      fallingOrdinance: [],
    };

    if (def.kind === 'carpet_bomb') {
      const dir: 1 | -1 = team === 'player' ? 1 : -1;
      const startX = dir === 1 ? -140 : WORLD_WIDTH + 140;
      active.planes = [
        { x: startX, y: 78, speed: 680, dir, kind: 'bomber' },
        { x: startX - dir * 110, y: 108, speed: 680, dir, kind: 'bomber' },
        { x: startX - dir * 215, y: 88, speed: 680, dir, kind: 'bomber' },
      ];
    } else if (def.kind === 'zeppelin_raid') {
      const dir: 1 | -1 = team === 'player' ? 1 : -1;
      const startX = dir === 1 ? -160 : WORLD_WIDTH + 160;
      active.planes = [
        { x: startX, y: 74, speed: 540, dir, kind: 'zeppelin' },
        { x: startX - dir * 170, y: 104, speed: 540, dir, kind: 'zeppelin' },
      ];
    }

    this.ultimates.push(active);
    this.callbacks.onSound?.('ultimate');
    if (team === 'player') {
      this.callbacks.onBanner?.(def.name, def.description, def.accentColor);
    }
    return true;
  }

  public step(rawDt: number): void {
    if (this.status !== 'playing') return;

    const clampedDt = Math.min(0.05, Math.max(0, rawDt));
    const totalDt = clampedDt * this.speed;
    // Sub-step when running at 2x to preserve crisp physics and hit detection
    const steps = this.speed === 2 ? 2 : 1;
    const dt = totalDt / steps;

    for (let i = 0; i < steps; i++) {
      this.stepInternal(dt);
      if (this.status !== 'playing') break;
    }
  }

  public getSnapshot(): GameSnapshot {
    return {
      status: this.status,
      difficulty: this.difficulty,
      speed: this.speed,
      elapsed: this.elapsed,
      player: this.player,
      enemy: this.enemy,
      units: this.units,
      projectiles: this.projectiles,
      beams: this.beams,
      particles: this.particles,
      slashes: this.slashes,
      scorchMarks: this.scorchMarks,
      popups: this.popups,
      ultimates: this.ultimates,
      eraTransition: this.eraTransition,
    };
  }

  private createFaction(team: Team): FactionState {
    const era = ERAS[0];
    return {
      team,
      eraIndex: 0,
      gold: STARTING_GOLD,
      xp: 0,
      totalXp: 0,
      baseHp: era.baseMaxHp,
      baseMaxHp: era.baseMaxHp,
      displayBaseHp: era.baseMaxHp,
      turretSlots: 1,
      turrets: [null, null, null, null],
      queue: [],
      upgrades: createInitialUpgrades(),
      ultimateCooldown: 8, // brief opening cooldown so ultimate isn't wasted at 0:00
      ultimateMaxCooldown: era.ultimate.cooldown,
      baseHitFlash: 0,
      evolveFlash: 0,
      upgradeFlash: 0,
      kills: 0,
      unitsSpawned: 0,
    };
  }

  private stepInternal(dt: number): void {
    this.elapsed += dt;

    // 1. Passive income (scaled by Economy upgrade), cooldowns, flash decay
    const diff = DIFFICULTIES[this.difficulty];
    const pEra = getEra(this.player.eraIndex);
    const eEra = getEra(this.enemy.eraIndex);

    this.player.gold += pEra.passiveGoldPerSec * getGoldIncomeMult(this.player.upgrades) * dt;
    this.enemy.gold +=
      eEra.passiveGoldPerSec * diff.aiGoldMultiplier * getGoldIncomeMult(this.enemy.upgrades) * dt;

    this.updateFactionTimers(this.player, dt);
    this.updateFactionTimers(this.enemy, dt);

    if (this.eraTransition.active) {
      this.eraTransition.progress = Math.min(1, this.eraTransition.progress + dt * 1.1);
      if (this.eraTransition.progress >= 1) {
        this.eraTransition.active = false;
      }
    }

    // 2. Production queues
    this.updateQueue(this.player, dt);
    this.updateQueue(this.enemy, dt);

    // 3. Enemy AI decision step
    this.ai.update(this, dt);

    // 4. Units movement & combat
    this.updateUnits(dt);

    // 5. Base turrets
    this.updateTurrets(this.player, dt);
    this.updateTurrets(this.enemy, dt);

    // 6. Projectiles, beams, ultimates
    this.updateProjectiles(dt);
    this.updateUltimates(dt);
    this.updateEffects(dt);

    // 7. Win / Loss resolution
    if (this.enemy.baseHp <= 0) {
      this.enemy.baseHp = 0;
      this.status = 'victory';
      this.spawnBaseDestruction(ENEMY_BASE_X);
      this.callbacks.onSound?.('victory');
    } else if (this.player.baseHp <= 0) {
      this.player.baseHp = 0;
      this.status = 'defeat';
      this.spawnBaseDestruction(PLAYER_BASE_X);
      this.callbacks.onSound?.('defeat');
    }
  }

  private updateFactionTimers(f: FactionState, dt: number): void {
    if (f.ultimateCooldown > 0) {
      f.ultimateCooldown = Math.max(0, f.ultimateCooldown - dt);
    }
    if (f.baseHitFlash > 0) {
      f.baseHitFlash = Math.max(0, f.baseHitFlash - dt * 5);
    }
    if (f.evolveFlash > 0) {
      f.evolveFlash = Math.max(0, f.evolveFlash - dt * 1.5);
    }
    if (f.upgradeFlash > 0) {
      f.upgradeFlash = Math.max(0, f.upgradeFlash - dt * 1.8);
    }
    // Smooth fighting-game trailing damage drain bar on fortresses
    if (f.displayBaseHp > f.baseHp) {
      const drainSpeed = Math.max(f.baseMaxHp * 0.28, (f.displayBaseHp - f.baseHp) * 4.5);
      f.displayBaseHp = Math.max(f.baseHp, f.displayBaseHp - drainSpeed * dt);
    } else if (f.displayBaseHp < f.baseHp) {
      f.displayBaseHp = f.baseHp;
    }
  }

  private updateQueue(f: FactionState, dt: number): void {
    if (f.queue.length === 0) return;
    const head = f.queue[0];
    head.remaining = Math.max(0, head.remaining - dt);
    if (head.remaining <= 0 && this.getActiveUnitCount(f.team) < MAX_UNITS_PER_TEAM) {
      f.queue.shift();
      this.spawnUnit(f.team, UNIT_BY_ID[head.unitId]);
    }
  }

  public spawnUnit(team: Team, def: UnitDef): UnitEntity {
    const faction = this.getFaction(team);
    const spawnX = team === 'player' ? PLAYER_SPAWN_X : ENEMY_SPAWN_X;
    const jitter = (this.random() - 0.5) * 6;
    const scaledMaxHp = Math.round(def.maxHp * getArmorHpMult(faction.upgrades));
    const unit: UnitEntity = {
      uid: this.nextUid++,
      team,
      def,
      x: spawnX + jitter,
      y: GROUND_Y,
      hp: scaledMaxHp,
      maxHp: scaledMaxHp,
      displayHp: scaledMaxHp,
      displayHpHold: 0,
      state: 'walk',
      attackCooldown: 0.15,
      attackAnim: 0,
      walkPhase: this.random() * Math.PI * 2,
      hitFlash: 0,
      lastHitCrit: false,
      upgradeFlash: 0,
      knockbackVel: 0,
      deathTimer: 0,
    };
    this.units.push(unit);
    faction.unitsSpawned += 1;
    return unit;
  }

  private updateUnits(dt: number): void {
    // Separate live units by team sorted from front to back for natural formation spacing
    const playerLive = this.units
      .filter((u) => u.team === 'player' && u.state !== 'dead')
      .sort((a, b) => b.x - a.x);
    const enemyLive = this.units
      .filter((u) => u.team === 'enemy' && u.state !== 'dead')
      .sort((a, b) => a.x - b.x);

    const stepTeam = (allies: UnitEntity[], enemies: UnitEntity[], team: Team): void => {
      const dir = team === 'player' ? 1 : -1;
      const enemyBaseFront = team === 'player' ? ENEMY_BASE_FRONT_X : PLAYER_BASE_FRONT_X;
      const teamFaction = this.getFaction(team);
      const atkSpdMult = getAttackSpeedMult(teamFaction.upgrades);
      const moveSpdMult = getMoveSpeedMult(teamFaction.upgrades);

      for (let i = 0; i < allies.length; i++) {
        const u = allies[i];
        if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt * 6.5);
        if (u.upgradeFlash > 0) u.upgradeFlash = Math.max(0, u.upgradeFlash - dt * 1.9);
        if (u.attackCooldown > 0) u.attackCooldown = Math.max(0, u.attackCooldown - dt);
        if (u.attackAnim > 0) u.attackAnim = Math.max(0, u.attackAnim - dt * 3.4);

        // Fighting-game delayed white/gold HP drain bar on units
        if (u.displayHpHold > 0) {
          u.displayHpHold = Math.max(0, u.displayHpHold - dt);
        } else if (u.displayHp > u.hp) {
          const drainRate = Math.max(u.maxHp * 0.45, (u.displayHp - u.hp) * 5.2);
          u.displayHp = Math.max(u.hp, u.displayHp - drainRate * dt);
        } else if (u.displayHp < u.hp) {
          u.displayHp = u.hp;
        }

        // Apply knockback decay
        if (Math.abs(u.knockbackVel) > 1) {
          u.x += u.knockbackVel * dt;
          u.knockbackVel *= Math.exp(-10 * dt);
        } else {
          u.knockbackVel = 0;
        }

        // Clamp within battlefield boundaries
        u.x = Math.max(PLAYER_BASE_FRONT_X + 6, Math.min(ENEMY_BASE_FRONT_X - 6, u.x));

        // Find closest enemy in front or inside reach
        let target: UnitEntity | null = null;
        let minEnemyDist = Infinity;
        for (const e of enemies) {
          const dist = (e.x - u.x) * dir - (e.def.width + u.def.width) * 0.45;
          if (dist >= -24 && dist < minEnemyDist) {
            minEnemyDist = dist;
            target = e;
          }
        }

        const distToEnemyBase = (enemyBaseFront - u.x) * dir - u.def.width * 0.5;
        const inRangeOfUnit = target !== null && minEnemyDist <= u.def.range;
        const inRangeOfBase = distToEnemyBase <= u.def.range;

        if (inRangeOfUnit || inRangeOfBase) {
          u.state = 'attack';
          if (u.attackCooldown <= 0) {
            this.performUnitAttack(u, inRangeOfUnit ? target : null);
            u.attackCooldown = 1 / (u.def.attackRate * atkSpdMult);
            u.attackAnim = 1;
          }
        } else {
          // Friendly spacing: same-role units queue cleanly behind engaged or waiting allies ahead
          let blockedByAlly = false;
          if (i > 0) {
            const ahead = allies[i - 1];
            const gap = (ahead.x - u.x) * dir;
            const desiredGap = (ahead.def.width + u.def.width) * 0.42;
            if (
              gap < desiredGap &&
              (ahead.state === 'attack' || ahead.state === 'idle') &&
              u.def.role === ahead.def.role
            ) {
              blockedByAlly = true;
            }
          }

          if (blockedByAlly) {
            u.state = 'idle';
          } else {
            u.state = 'walk';
            const effSpeed = u.def.speed * moveSpdMult;
            const moveDist = effSpeed * dt;
            let nextX = u.x + moveDist * dir;
            // Don't walk past closest enemy unit or enemy base
            if (target) {
              const stopX = target.x - dir * ((target.def.width + u.def.width) * 0.48);
              nextX = dir === 1 ? Math.min(nextX, stopX) : Math.max(nextX, stopX);
            }
            const baseStop = enemyBaseFront - dir * (u.def.width * 0.5 + 4);
            nextX = dir === 1 ? Math.min(nextX, baseStop) : Math.max(nextX, baseStop);
            u.x = nextX;
            const prevStep = Math.floor(u.walkPhase / Math.PI);
            u.walkPhase += dt * (effSpeed * 0.16);
            // Heavy war-machines & cavalry kick up subtle pixel road dust as they stride!
            if (
              !u.def.hoverHeight &&
              (u.def.role === 'heavy' || u.def.role === 'siege') &&
              Math.floor(u.walkPhase / Math.PI) !== prevStep
            ) {
              this.spawnDustWave(u.x - dir * 16, GROUND_Y, -dir * 38, 10, '#a8a29e');
            }
          }
        }
      }
    };

    stepTeam(playerLive, enemyLive, 'player');
    stepTeam(enemyLive, playerLive, 'enemy');

    // Update dead units fadeout & prune finished corpses
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      if (u.state === 'dead') {
        u.deathTimer += dt;
        if (u.deathTimer >= UNIT_DEATH_DURATION) {
          this.units.splice(i, 1);
        }
      }
    }
  }

  private performUnitAttack(attacker: UnitEntity, target: UnitEntity | null): void {
    const dir = attacker.team === 'player' ? 1 : -1;
    const def = attacker.def;
    const attackerFaction = this.getFaction(attacker.team);
    const critChance = Math.min(0.85, def.critChance + getCritChanceBonus(attackerFaction.upgrades));
    const critMult = CRIT_MULTIPLIER + getCritDamageBonus(attackerFaction.upgrades);
    const isCrit = this.random() < critChance;
    const rawDamage =
      def.damage * getWeaponDamageMult(attackerFaction.upgrades) * (isCrit ? critMult : 1);

    this.callbacks.onSound?.(def.attackSound);

    const hoverOff = def.hoverHeight ?? 0;
    const originX = attacker.x + dir * (def.width * 0.56);
    const originY = GROUND_Y - def.height * 0.88 - hoverOff;
    const targetX = target
      ? target.x
      : attacker.team === 'player'
        ? ENEMY_BASE_FRONT_X + 12
        : PLAYER_BASE_FRONT_X - 12;
    const targetY = target
      ? GROUND_Y - target.def.height * 0.72 - (target.def.hoverHeight ?? 0)
      : GROUND_Y - 70;

    // Instant Railgun, Interstellar Graviton, or Industrial Tesla Arc piercing beam
    if (def.projectile === 'railgun' || def.projectile === 'gravity_beam' || def.projectile === 'tesla_arc') {
      const isGrav = def.projectile === 'gravity_beam';
      const isTesla = def.projectile === 'tesla_arc';
      const endX = target && isTesla ? target.x : originX + dir * (def.range + 45);
      const endY = target && isTesla ? targetY : originY;
      this.beams.push({
        uid: this.nextUid++,
        team: attacker.team,
        style: isGrav ? 'gravity_beam' : isTesla ? 'tesla_arc' : 'railgun',
        x1: originX,
        y1: originY,
        x2: endX,
        y2: endY,
        width: isGrav ? 7 : isTesla ? 6 : 5,
        color: isGrav ? '#c084fc' : isTesla ? '#38bdf8' : attacker.team === 'player' ? '#38bdf8' : '#fb7185',
        life: isGrav ? 0.28 : isTesla ? 0.26 : 0.24,
        maxLife: isGrav ? 0.28 : isTesla ? 0.26 : 0.24,
        seed: this.random() * 100,
      });
      this.spawnBurst(originX, originY, isGrav ? '#e879f9' : '#7dd3fc', 6, 110);

      // Pierce up to def.pierceCount enemies along beam
      const hitCandidates = this.units
        .filter((u) => u.team !== attacker.team && u.state !== 'dead')
        .filter((u) => {
          const rel = (u.x - originX) * dir;
          return rel >= -10 && rel <= def.range + 45;
        })
        .sort((a, b) => (a.x - originX) * dir - (b.x - originX) * dir);

      let hits = 0;
      let prevArcX = originX;
      let prevArcY = originY;
      for (const victim of hitCandidates) {
        if (isTesla && hits > 0) {
          // Visible chaining lightning bolt jumping to the second shocked target!
          const vx = victim.x;
          const vy = GROUND_Y - victim.def.height * 0.72 - (victim.def.hoverHeight ?? 0);
          this.beams.push({
            uid: this.nextUid++,
            team: attacker.team,
            style: 'tesla_arc',
            x1: prevArcX,
            y1: prevArcY,
            x2: vx,
            y2: vy,
            width: 5,
            color: '#67e8f9',
            life: 0.24,
            maxLife: 0.24,
            seed: this.random() * 100,
          });
        }
        prevArcX = victim.x;
        prevArcY = GROUND_Y - victim.def.height * 0.72 - (victim.def.hoverHeight ?? 0);
        this.applyDamageToUnit(victim, rawDamage, def.armorPierce, isCrit, dir * def.knockback, attacker.team);
        hits++;
        if (hits >= def.pierceCount) break;
      }
      if (hits === 0 && !target) {
        this.applyDamageToBase(
          attacker.team === 'player' ? 'enemy' : 'player',
          rawDamage * def.baseDamageMult,
          isCrit,
          attacker.team,
        );
      }
      return;
    }

    // Flamethrower jet: cone blast hitting enemies in range
    if (def.projectile === 'flame') {
      const endX = originX + dir * (def.range + 15);
      this.beams.push({
        uid: this.nextUid++,
        team: attacker.team,
        style: 'flame_jet',
        x1: originX,
        y1: originY,
        x2: endX,
        y2: originY + (this.random() - 0.5) * 14,
        width: 18,
        color: '#f97316',
        life: 0.18,
        maxLife: 0.18,
        seed: this.random(),
      });
      for (let p = 0; p < 5; p++) {
        this.particles.push({
          x: originX + dir * (10 + this.random() * def.range * 0.7),
          y: originY + (this.random() - 0.5) * 18,
          vx: dir * (120 + this.random() * 140),
          vy: -30 - this.random() * 50,
          size: 5 + this.random() * 6,
          color: p % 2 === 0 ? '#fb923c' : '#fde047',
          alpha: 0.9,
          life: 0.25,
          maxLife: 0.25,
          gravity: -40,
          shape: 'circle',
        });
      }

      let hitAny = false;
      for (const victim of this.units) {
        if (victim.team === attacker.team || victim.state === 'dead') continue;
        const rel = (victim.x - originX) * dir;
        if (rel >= -10 && rel <= def.range + 28) {
          this.applyDamageToUnit(victim, rawDamage, def.armorPierce, isCrit, dir * def.knockback, attacker.team);
          hitAny = true;
        }
      }
      if (!hitAny && !target) {
        this.applyDamageToBase(
          attacker.team === 'player' ? 'enemy' : 'player',
          rawDamage * def.baseDamageMult,
          isCrit,
          attacker.team,
        );
      }
      return;
    }

    // Ranged Projectile
    if (def.projectile) {
      const speed = def.projectileSpeed ?? 420;
      const gravity = def.projectileArc ?? 200;
      const dx = targetX - originX;
      const dy = targetY - originY;
      const flightTime = Math.max(0.12, Math.abs(dx) / speed);
      const vx = dx / flightTime;
      const vy = (dy - 0.5 * gravity * flightTime * flightTime) / flightTime;

      this.projectiles.push({
        uid: this.nextUid++,
        team: attacker.team,
        style: def.projectile,
        x: originX,
        y: originY,
        prevX: originX,
        prevY: originY,
        vx,
        vy,
        gravity,
        damage: rawDamage,
        splashRadius: def.splashRadius,
        armorPierce: def.armorPierce,
        isCrit,
        baseDamageMult: def.baseDamageMult,
        knockback: def.knockback,
        pierceRemaining: def.pierceCount,
        hitUids: [],
        life: 0,
        maxLife: Math.min(3.5, flightTime + 0.8),
        targetX,
      });

      // Muzzle flash smoke for gunpowder/modern/tank/mortar weapons
      if (
        def.projectile === 'bullet' ||
        def.projectile === 'cannonball' ||
        def.projectile === 'shell' ||
        def.projectile === 'mortar_shell' ||
        def.projectile === 'rocket'
      ) {
        this.spawnBurst(originX, originY, '#fde68a', 5, 80);
        this.spawnSmoke(originX, originY, 3);
      }
      return;
    }

    // Direct Melee Hit (+ optional cleave splash for chariot/cyborg)
    const slashX = attacker.x + dir * (def.width * 0.62);
    const slashY = GROUND_Y - def.height * 0.76;
    this.spawnMeleeSlash(attacker, slashX, slashY, dir, isCrit);

    if (target) {
      if (def.splashRadius > 0) {
        this.applySplashDamage(
          target.x,
          attacker.team,
          rawDamage,
          def.splashRadius,
          def.armorPierce,
          isCrit,
          dir * def.knockback,
        );
      } else {
        this.applyDamageToUnit(target, rawDamage, def.armorPierce, isCrit, dir * def.knockback, attacker.team);
      }
      const impactY = GROUND_Y - target.def.height * 0.72;
      this.spawnBurst(
        target.x - dir * 10,
        impactY,
        isCrit ? '#fde047' : def.id === 'cyborg' ? '#38bdf8' : '#fff7ed',
        isCrit ? 12 : 7,
        isCrit ? 175 : 130,
      );
      if (isCrit) {
        this.spawnRing(target.x - dir * 8, impactY, '#fde047', 26);
      }
    } else {
      this.applyDamageToBase(
        attacker.team === 'player' ? 'enemy' : 'player',
        rawDamage * def.baseDamageMult,
        isCrit,
        attacker.team,
      );
      this.spawnBurst(targetX, targetY, '#fcd34d', 9, 135);
    }
  }

  private updateTurrets(faction: FactionState, dt: number): void {
    const enemyTeam: Team = faction.team === 'player' ? 'enemy' : 'player';
    const dir = faction.team === 'player' ? 1 : -1;

    for (let i = 0; i < faction.turretSlots; i++) {
      const turret = faction.turrets[i];
      if (!turret) continue;
      const def = TURRET_BY_ID[turret.turretId];

      if (turret.cooldown > 0) turret.cooldown = Math.max(0, turret.cooldown - dt);
      if (turret.recoil > 0) turret.recoil = Math.max(0, turret.recoil - dt * 5);

      const pos = this.getTurretWorldPosition(faction.team, i);

      // Acquire closest enemy unit within turret range
      let bestTarget: UnitEntity | null = null;
      let bestDist = Infinity;
      for (const u of this.units) {
        if (u.team !== enemyTeam || u.state === 'dead') continue;
        const dx = (u.x - pos.x) * dir;
        if (dx >= -20 && dx <= def.range && dx < bestDist) {
          bestDist = dx;
          bestTarget = u;
        }
      }

      if (!bestTarget) continue;

      const aimDx = bestTarget.x - pos.x;
      const aimDy = GROUND_Y - bestTarget.def.height * 0.55 - pos.y;
      turret.aimAngle = Math.atan2(aimDy, aimDx);

      if (turret.cooldown > 0) continue;

      turret.cooldown = 1 / def.attackRate;
      turret.recoil = 1;
      this.callbacks.onSound?.(def.fireSound);

      const muzzleX = pos.x + Math.cos(turret.aimAngle) * 18;
      const muzzleY = pos.y + Math.sin(turret.aimAngle) * 18;
      const scaledTurretDamage = def.damage * getTurretDamageMult(faction.upgrades);

      if (def.projectile === 'ion_beam' || def.projectile === 'gravity_beam') {
        const isGrav = def.projectile === 'gravity_beam';
        const tx = bestTarget.x;
        const ty = GROUND_Y - bestTarget.def.height * 0.5;
        this.beams.push({
          uid: this.nextUid++,
          team: faction.team,
          style: isGrav ? 'gravity_beam' : 'ion_beam',
          x1: muzzleX,
          y1: muzzleY,
          x2: tx,
          y2: ty,
          width: isGrav ? 9 : 7,
          color: isGrav ? '#c084fc' : '#22d3ee',
          life: 0.3,
          maxLife: 0.3,
          seed: this.random(),
        });
        this.applySplashDamage(
          tx,
          faction.team,
          scaledTurretDamage,
          def.splashRadius,
          def.armorPierce,
          false,
          dir * (isGrav ? 95 : 75),
        );
        this.spawnRing(tx, ty, isGrav ? '#c084fc' : '#38bdf8', def.splashRadius * 0.6);
      } else {
        const flightTime = Math.max(0.14, Math.hypot(aimDx, aimDy) / def.projectileSpeed);
        const vx = aimDx / flightTime;
        const vy = (aimDy - 0.5 * def.projectileArc * flightTime * flightTime) / flightTime;

        this.projectiles.push({
          uid: this.nextUid++,
          team: faction.team,
          style: def.projectile,
          x: muzzleX,
          y: muzzleY,
          prevX: muzzleX,
          prevY: muzzleY,
          vx,
          vy,
          gravity: def.projectileArc,
          damage: scaledTurretDamage,
          splashRadius: def.splashRadius,
          armorPierce: def.armorPierce,
          isCrit: false,
          baseDamageMult: 1,
          knockback: def.splashRadius > 0 ? 55 : 18,
          pierceRemaining: 1,
          hitUids: [],
          life: 0,
          maxLife: Math.min(3.5, flightTime + 0.7),
        });
        this.spawnBurst(muzzleX, muzzleY, '#fde68a', 4, 70);
      }
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.prevX = p.x;
      p.prevY = p.y;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;

      // Smoke & fire trail for rockets / cannonballs / shells / mortars / grenades / totem fire
      if (
        (p.style === 'rocket' ||
          p.style === 'cannonball' ||
          p.style === 'shell' ||
          p.style === 'mortar_shell' ||
          p.style === 'grenade' ||
          p.style === 'totem_fire') &&
        this.random() < 0.68
      ) {
        const isFiery = p.style === 'totem_fire' || p.style === 'grenade';
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: -p.vx * 0.08 + (this.random() - 0.5) * 16,
          vy: -10 - this.random() * 14,
          size: p.style === 'rocket' || p.style === 'mortar_shell' ? 4.5 : 3.5,
          color: isFiery ? '#fb923c' : p.style === 'rocket' ? '#e2e8f0' : '#94a3b8',
          alpha: isFiery ? 0.78 : 0.6,
          life: 0.28,
          maxLife: 0.28,
          gravity: -15,
          shape: isFiery ? 'circle' : 'smoke',
        });
      }

      const enemyTeam: Team = p.team === 'player' ? 'enemy' : 'player';
      const dir = p.team === 'player' ? 1 : -1;
      let impacted = false;
      const blastColor =
        p.style === 'plasma'
          ? '#22d3ee'
          : p.style === 'antimatter'
            ? '#c084fc'
            : p.style === 'solar_orb'
              ? '#fbbf24'
              : p.style === 'mortar_shell'
                ? '#ef4444'
                : '#f97316';

      // Check collision with enemy units
      for (const u of this.units) {
        if (u.team !== enemyTeam || u.state === 'dead') continue;
        if (p.hitUids.includes(u.uid)) continue;
        const halfW = u.def.width * 0.55 + 6;
        const hoverOff = u.def.hoverHeight ?? 0;
        const topY = GROUND_Y - u.def.height - 4 - hoverOff;
        if (p.x >= u.x - halfW && p.x <= u.x + halfW && p.y >= topY && p.y <= GROUND_Y + 6) {
          p.hitUids.push(u.uid);
          if (p.splashRadius > 0) {
            this.applySplashDamage(p.x, p.team, p.damage, p.splashRadius, p.armorPierce, p.isCrit, dir * p.knockback);
            this.spawnExplosion(p.x, Math.min(p.y, GROUND_Y - 6), p.splashRadius, blastColor);
            this.callbacks.onSound?.('explosion');
          } else {
            this.applyDamageToUnit(u, p.damage, p.armorPierce, p.isCrit, dir * p.knockback, p.team);
            this.spawnBurst(p.x, p.y, blastColor === '#f97316' ? '#fef08a' : blastColor, 5, 100);
          }
          p.pierceRemaining -= 1;
          if (p.pierceRemaining <= 0) {
            impacted = true;
            break;
          }
        }
      }

      // Check enemy base hit
      if (!impacted) {
        const hitEnemyBase =
          (p.team === 'player' && p.x >= ENEMY_BASE_FRONT_X) ||
          (p.team === 'enemy' && p.x <= PLAYER_BASE_FRONT_X);
        if (hitEnemyBase && p.y >= GROUND_Y - 170) {
          this.applyDamageToBase(enemyTeam, p.damage * p.baseDamageMult, p.isCrit, p.team);
          if (p.splashRadius > 0) {
            this.spawnExplosion(p.x, Math.min(p.y, GROUND_Y - 12), p.splashRadius * 0.8, blastColor);
            this.callbacks.onSound?.('explosion');
          } else {
            this.spawnBurst(p.x, p.y, '#fcd34d', 6, 90);
          }
          impacted = true;
        }
      }

      // Ground impact
      if (!impacted && p.y >= GROUND_Y) {
        if (p.splashRadius > 0) {
          this.applySplashDamage(p.x, p.team, p.damage, p.splashRadius, p.armorPierce, p.isCrit, dir * p.knockback);
          this.spawnExplosion(p.x, GROUND_Y - 4, p.splashRadius, blastColor);
          this.callbacks.onSound?.('explosion');
        } else {
          this.spawnBurst(p.x, GROUND_Y - 2, '#a8a29e', 4, 60);
        }
        impacted = true;
      }

      if (impacted || p.life >= p.maxLife || p.x < -50 || p.x > WORLD_WIDTH + 50) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateUltimates(dt: number): void {
    for (let i = this.ultimates.length - 1; i >= 0; i--) {
      const ult = this.ultimates[i];
      ult.elapsed += dt;
      const enemyTeam: Team = ult.team === 'player' ? 'enemy' : 'player';
      const dir = ult.team === 'player' ? 1 : -1;

      // Update aircraft / steampunk zeppelins
      if (ult.planes) {
        for (const plane of ult.planes) {
          plane.x += plane.speed * plane.dir * dt;
        }
      }

      // Schedule strikes evenly across the active window
      const interval = (ult.duration * 0.78) / Math.max(1, ult.def.strikeCount);
      while (ult.strikesFired < ult.def.strikeCount && ult.elapsed >= ult.nextStrikeAt) {
        ult.strikesFired += 1;
        ult.nextStrikeAt += interval;
        const targetX = this.pickUltimateTargetX(enemyTeam, ult.strikesFired, ult.def.strikeCount);
        this.launchUltimateStrike(ult, targetX, dir);
      }

      // Advance falling ordinance
      for (const ord of ult.fallingOrdinance) {
        if (ord.impacted) continue;
        ord.trail.push({ x: ord.x, y: ord.y });
        if (ord.trail.length > 10) ord.trail.shift();

        ord.x += ord.vx * dt;
        ord.y += ord.vy * dt;
        if (
          ord.kind === 'fire_arrows' ||
          ord.kind === 'carpet_bomb' ||
          ord.kind === 'zeppelin_raid' ||
          ord.kind === 'naval_barrage'
        ) {
          ord.vy += 320 * dt;
        }

        if (ord.y >= ord.targetY) {
          ord.impacted = true;
          this.applySplashDamage(
            ord.targetX,
            ult.team,
            ult.def.damagePerStrike,
            ult.def.radius,
            true,
            false,
            dir * 95,
          );
          this.spawnExplosion(ord.targetX, GROUND_Y - 4, ult.def.radius, ult.def.accentColor);
          this.callbacks.onSound?.('explosion');
        }
      }

      if (ult.elapsed >= ult.duration + 0.9 && ult.fallingOrdinance.every((o) => o.impacted)) {
        this.ultimates.splice(i, 1);
      }
    }
  }

  private pickUltimateTargetX(enemyTeam: Team, index: number, total: number): number {
    const enemies = this.units.filter((u) => u.team === enemyTeam && u.state !== 'dead');
    if (enemies.length > 0 && this.random() < 0.78) {
      const picked = enemies[Math.floor(this.random() * enemies.length)];
      return Math.max(
        PLAYER_BASE_FRONT_X + 60,
        Math.min(ENEMY_BASE_FRONT_X - 60, picked.x + (this.random() - 0.5) * 90),
      );
    }
    // Sweep across battlefield if few enemies alive
    const frac = index / Math.max(1, total);
    const start = enemyTeam === 'enemy' ? PLAYER_BASE_FRONT_X + 200 : ENEMY_BASE_FRONT_X - 200;
    const end = enemyTeam === 'enemy' ? ENEMY_BASE_FRONT_X - 100 : PLAYER_BASE_FRONT_X + 100;
    return start + (end - start) * frac + (this.random() - 0.5) * 120;
  }

  private launchUltimateStrike(ult: ActiveUltimate, targetX: number, dir: 1 | -1): void {
    const kind = ult.def.kind;
    if (kind === 'lightning') {
      this.beams.push({
        uid: this.nextUid++,
        team: ult.team,
        style: 'lightning',
        x1: targetX + (this.random() - 0.5) * 70,
        y1: -20,
        x2: targetX,
        y2: GROUND_Y,
        width: 11,
        color: '#7dd3fc',
        life: 0.44,
        maxLife: 0.44,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ult.def.damagePerStrike, ult.def.radius, true, true, dir * 80);
      this.spawnExplosion(targetX, GROUND_Y - 6, ult.def.radius * 0.9, '#38bdf8');
      this.callbacks.onSound?.('railgun');
      return;
    }

    if (kind === 'solar_wrath') {
      this.beams.push({
        uid: this.nextUid++,
        team: ult.team,
        style: 'solar_beam',
        x1: targetX,
        y1: -25,
        x2: targetX,
        y2: GROUND_Y + 4,
        width: 34,
        color: '#fbbf24',
        life: 0.65,
        maxLife: 0.65,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ult.def.damagePerStrike, ult.def.radius, true, true, dir * 75);
      this.spawnExplosion(targetX, GROUND_Y - 6, ult.def.radius * 0.95, '#fbbf24');
      this.callbacks.onSound?.('laser');
      return;
    }

    if (kind === 'orbital_laser') {
      this.beams.push({
        uid: this.nextUid++,
        team: ult.team,
        style: 'orbital_laser',
        x1: targetX,
        y1: -30,
        x2: targetX,
        y2: GROUND_Y + 4,
        width: 48,
        color: '#22d3ee',
        life: 0.85,
        maxLife: 0.85,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ult.def.damagePerStrike, ult.def.radius, true, true, dir * 110);
      this.spawnExplosion(targetX, GROUND_Y - 8, ult.def.radius * 1.15, '#22d3ee');
      this.callbacks.onSound?.('explosion');
      return;
    }

    if (kind === 'black_hole') {
      this.beams.push({
        uid: this.nextUid++,
        team: ult.team,
        style: 'black_hole_vortex',
        x1: targetX,
        y1: GROUND_Y - 68,
        x2: targetX,
        y2: GROUND_Y,
        width: 58,
        color: '#c084fc',
        life: 0.92,
        maxLife: 0.92,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ult.def.damagePerStrike, ult.def.radius, true, true, -dir * 40);
      this.spawnExplosion(targetX, GROUND_Y - 12, ult.def.radius * 1.2, '#c084fc');
      this.callbacks.onSound?.('explosion');
      return;
    }

    // Falling sky ordinance (meteor, fire_arrows, naval_barrage, zeppelin_raid, carpet_bomb, tactical_missiles)
    const startY = kind === 'carpet_bomb' || kind === 'zeppelin_raid' ? 92 : -40;
    const slant =
      kind === 'meteor'
        ? -dir * 220
        : kind === 'fire_arrows'
          ? -dir * 260
          : kind === 'naval_barrage'
            ? -dir * 160
            : kind === 'tactical_missiles'
              ? -dir * 90
              : -dir * 55;
    const fallTime = kind === 'fire_arrows' ? 0.52 : kind === 'tactical_missiles' ? 0.45 : 0.6;
    const startX = targetX + slant;
    const vx = (targetX - startX) / fallTime;
    const gravity =
      kind === 'fire_arrows' || kind === 'carpet_bomb' || kind === 'zeppelin_raid' || kind === 'naval_barrage'
        ? 320
        : 0;
    const vy = (GROUND_Y - startY - 0.5 * gravity * fallTime * fallTime) / fallTime;

    ult.fallingOrdinance.push({
      x: startX,
      y: startY,
      targetX,
      targetY: GROUND_Y,
      vx,
      vy,
      impacted: false,
      kind,
      trail: [],
    });
  }

  private applySplashDamage(
    centerX: number,
    attackerTeam: Team,
    damage: number,
    radius: number,
    armorPierce: boolean,
    isCrit: boolean,
    knockback: number,
  ): void {
    const enemyTeam: Team = attackerTeam === 'player' ? 'enemy' : 'player';
    for (const u of this.units) {
      if (u.team !== enemyTeam || u.state === 'dead') continue;
      const dist = Math.abs(u.x - centerX);
      if (dist <= radius + u.def.width * 0.4) {
        const falloff = Math.max(0.45, 1 - (dist / Math.max(1, radius + 24)) * 0.5);
        this.applyDamageToUnit(u, damage * falloff, armorPierce, isCrit, knockback * falloff, attackerTeam);
      }
    }
  }

  private applyDamageToUnit(
    victim: UnitEntity,
    rawDamage: number,
    armorPierce: boolean,
    isCrit: boolean,
    knockbackImpulse: number,
    attackerTeam: Team,
  ): void {
    if (victim.state === 'dead') return;
    const victimFaction = this.getFaction(victim.team);
    const totalArmor = Math.min(0.5, victim.def.armor + getArmorMitigationBonus(victimFaction.upgrades));
    const effectiveArmor = armorPierce ? totalArmor * 0.4 : totalArmor;
    const finalDamage = Math.max(1, Math.round(rawDamage * (1 - effectiveArmor)));
    victim.hp -= finalDamage;
    victim.hitFlash = 1;
    victim.lastHitCrit = isCrit;
    victim.displayHpHold = Math.max(victim.displayHpHold, isCrit ? 0.24 : 0.16);
    victim.knockbackVel +=
      knockbackImpulse * (victim.def.isMechanical ? 0.35 : 0.88) * getKnockbackResistMult(victimFaction.upgrades);

    const hitDir = attackerTeam === 'player' ? 1 : -1;
    const impactX = victim.x - hitDir * Math.min(14, victim.def.width * 0.3);
    const impactY = GROUND_Y - victim.def.height * 0.72 - (victim.def.hoverHeight ?? 0);

    // Instant arcade hit-impact starburst & directional sparks on EVERY hit!
    const sparkColor = isCrit
      ? '#fde047'
      : victim.def.isMechanical
        ? '#fef08a'
        : armorPierce
          ? '#67e8f9'
          : '#ffedd5';
    this.spawnFlashStar(impactX, impactY, sparkColor, isCrit ? 24 : 14);
    this.spawnDirectionalSparks(impactX, impactY, hitDir, sparkColor, isCrit ? 9 : 4, isCrit ? 220 : 145);

    if (isCrit) {
      this.spawnRing(impactX, impactY, '#fde047', 28);
    }

    // Distinct readable color-coded popup styling by hit type & victim team
    const popupKind: DamagePopup['kind'] = isCrit
      ? 'crit'
      : victim.team === 'player'
        ? 'player_hit'
        : armorPierce
          ? 'elemental'
          : 'normal';
    const popupColor =
      popupKind === 'crit'
        ? '#fde047'
        : popupKind === 'player_hit'
          ? '#fca5a5'
          : popupKind === 'elemental'
            ? '#67e8f9'
            : '#ffffff';

    this.addPopup(
      victim.x + (this.random() - 0.5) * 16,
      GROUND_Y - victim.def.height * 1.48 - 10 - (victim.def.hoverHeight ?? 0),
      isCrit ? `${finalDamage}!` : `${finalDamage}`,
      popupColor,
      isCrit ? 1.32 : 1.0,
      popupKind,
    );

    if (victim.hp <= 0) {
      victim.hp = 0;
      victim.state = 'dead';
      victim.deathTimer = 0;

      const killer = this.getFaction(attackerTeam);
      const loser = this.getFaction(victim.team);
      const diff = DIFFICULTIES[this.difficulty];

      const goldMult = (attackerTeam === 'enemy' ? diff.aiGoldMultiplier : 1) * getKillGoldMult(killer.upgrades);
      const xpMult = (attackerTeam === 'enemy' ? diff.aiXpMultiplier : 1) * getKillXpMult(killer.upgrades);

      const rewardGold = Math.round(victim.def.killGold * goldMult);
      const rewardXp = Math.round(victim.def.killXp * xpMult);

      killer.gold += rewardGold;
      killer.xp += rewardXp;
      killer.totalXp += rewardXp;
      killer.kills += 1;

      // Small consolation XP for loser so battles never stall
      const consolationXp = Math.round(victim.def.killXp * LOSS_XP_RATIO * (victim.team === 'enemy' ? diff.aiXpMultiplier : 1));
      loser.xp += consolationXp;
      loser.totalXp += consolationXp;

      if (attackerTeam === 'player') {
        this.addPopup(victim.x, GROUND_Y - victim.def.height * 1.48 - 30, `+${rewardGold}G`, '#facc15', 0.98, 'gold');
      }

      if (victim.def.isMechanical) {
        this.spawnExplosion(victim.x, GROUND_Y - victim.def.height * 0.65, 58, '#f97316');
        this.callbacks.onSound?.('explosion');
      } else {
        this.spawnFlashStar(victim.x, impactY, victim.team === 'player' ? '#93c5fd' : '#fca5a5', 18);
        this.spawnBurst(victim.x, GROUND_Y - victim.def.height * 0.6, victim.team === 'player' ? '#60a5fa' : '#f87171', 12, 165);
        this.spawnDebris(victim.x, GROUND_Y - victim.def.height * 0.45, '#52525b', 5, 145);
        this.spawnDustWave(victim.x, GROUND_Y, hitDir * 55, 14, '#78716c');
      }
    }
  }

  private applyDamageToBase(targetTeam: Team, rawDamage: number, isCrit: boolean, attackerTeam: Team): void {
    const defender = this.getFaction(targetTeam);
    const attacker = this.getFaction(attackerTeam);
    const dmg = Math.max(1, Math.round(rawDamage));
    defender.baseHp = Math.max(0, defender.baseHp - dmg);
    defender.baseHitFlash = 1;

    const xpGain = Math.max(1, Math.round((dmg / 100) * BASE_HIT_XP_PER_100_DMG));
    attacker.xp += xpGain;
    attacker.totalXp += xpGain;

    const baseX = targetTeam === 'player' ? PLAYER_BASE_X + 55 : ENEMY_BASE_X - 55;
    const bounceDir: 1 | -1 = attackerTeam === 'player' ? -1 : 1;
    this.addPopup(
      baseX + (this.random() - 0.5) * 24,
      GROUND_Y - 128,
      isCrit ? `-${dmg}!` : `-${dmg}`,
      isCrit ? '#fde047' : '#fb7185',
      isCrit ? 1.38 : 1.14,
      'base',
    );
    this.spawnFlashStar(baseX, GROUND_Y - 72, isCrit ? '#fde047' : '#fb923c', isCrit ? 28 : 18);
    this.spawnDirectionalSparks(baseX, GROUND_Y - 70, bounceDir, '#fde68a', isCrit ? 10 : 6, 175);
    this.spawnDebris(baseX, GROUND_Y - 64, '#78716c', isCrit ? 8 : 5, 170);
    this.spawnDustWave(baseX, GROUND_Y, bounceDir * 60, 18, '#a8a29e');
    this.callbacks.onSound?.('hit_base');
  }

  private updateEffects(dt: number): void {
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) this.beams.splice(i, 1);
    }

    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life -= dt;
      if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
    }

    for (let i = this.scorchMarks.length - 1; i >= 0; i--) {
      this.scorchMarks[i].life -= dt;
      if (this.scorchMarks[i].life <= 0) this.scorchMarks.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.shape === 'ring') {
        p.size += dt * 190;
      } else if (p.shape === 'debris') {
        p.rotation = (p.rotation ?? 0) + (p.vRot ?? 6) * dt;
        if (p.y > GROUND_Y) {
          p.y = GROUND_Y;
          p.vy = -Math.abs(p.vy) * 0.38;
          p.vx *= 0.65;
        }
      }
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.life -= dt;
      if (pop.vx) {
        pop.x += pop.vx * dt;
        pop.vx *= Math.exp(-3.6 * dt);
      }
      pop.y += pop.vy * dt;
      pop.vy *= Math.exp(-2.6 * dt);
      if (pop.life <= 0) this.popups.splice(i, 1);
    }

    // Cap VFX budgets for locked 60fps on iPhone Safari
    if (this.particles.length > 420) {
      this.particles.splice(0, this.particles.length - 420);
    }
    if (this.scorchMarks.length > 36) {
      this.scorchMarks.splice(0, this.scorchMarks.length - 36);
    }
    if (this.slashes.length > 28) {
      this.slashes.splice(0, this.slashes.length - 28);
    }
    if (this.popups.length > 48) {
      this.popups.splice(0, this.popups.length - 48);
    }
  }

  private addPopup(
    x: number,
    y: number,
    text: string,
    color: string,
    scale: number,
    kind: DamagePopup['kind'] = 'normal',
  ): void {
    // Spread simultaneous combat numbers horizontally and stagger vertically so none overlap
    let px = x + (this.random() - 0.5) * 40;
    let py = y + (this.random() - 0.5) * 10;
    const minSepY = 20;

    for (let attempt = 0; attempt < 9; attempt++) {
      let crowded: DamagePopup | null = null;
      let requiredX = 36;
      for (const existing of this.popups) {
        // Account for actual label width (e.g., 4-5 digit Future/Interstellar damage numbers & +G popups)
        const needX = Math.max(36, (text.length + existing.text.length) * 5.2 + 12);
        if (Math.abs(existing.x - px) < needX && Math.abs(existing.y - py) < minSepY) {
          crowded = existing;
          requiredX = needX;
          break;
        }
      }
      if (!crowded) break;
      // Push upward cleanly and fan left/right away from the crowded popup
      py -= minSepY + 2;
      const side = px >= crowded.x ? 1 : -1;
      const fanDir = attempt % 2 === 0 ? side : -side;
      px += fanDir * Math.min(46, Math.round(requiredX * 0.45) + attempt * 4);
    }

    // Keep popups legible within world bounds and safely below the top HUD strip
    px = Math.max(52, Math.min(WORLD_WIDTH - 52, px));
    py = Math.max(70, py);

    const driftDir = px >= x ? 1 : -1;
    const vx = driftDir * (12 + this.random() * 18);
    const vy = -(56 + this.random() * 20) * (scale > 1.1 ? 1.12 : 1);

    this.popups.push({
      x: px,
      y: py,
      vx,
      vy,
      text,
      color,
      scale,
      life: kind === 'crit' ? 0.96 : 0.84,
      maxLife: kind === 'crit' ? 0.96 : 0.84,
      kind,
    });
  }

  private spawnMeleeSlash(
    attacker: UnitEntity,
    x: number,
    y: number,
    dir: 1 | -1,
    isCrit: boolean,
  ): void {
    const id = attacker.def.id;
    let style: SlashEffect['style'] = 'blade';
    let color = attacker.team === 'player' ? '#93c5fd' : '#fca5a5';
    let coreColor = '#ffffff';
    let radius = 34;

    if (id === 'clubman' || id === 'dino_rider' || id === 'sphinx_chariot' || id === 'steam_trooper') {
      style = 'heavy';
      color = id === 'steam_trooper' ? '#fb923c' : '#fbbf24';
      coreColor = '#fef9c3';
      radius = id === 'dino_rider' || id === 'sphinx_chariot' ? 48 : 36;
    } else if (id === 'anubis_warrior' || id === 'scorpion_guard') {
      style = 'blade';
      color = id === 'scorpion_guard' ? '#4ade80' : '#facc15';
      coreColor = '#fef9c3';
      radius = id === 'scorpion_guard' ? 42 : 38;
    } else if (id === 'centurion') {
      style = 'blade';
      color = attacker.team === 'player' ? '#60a5fa' : '#f87171';
      coreColor = '#fef08a';
      radius = 40;
    } else if (id === 'spearman' || id === 'chariot' || id === 'heavy_cavalry' || id === 'pikeman') {
      style = 'thrust';
      color = attacker.team === 'player' ? '#60a5fa' : '#f87171';
      coreColor = '#f8fafc';
      radius = id === 'pikeman' || id === 'heavy_cavalry' ? 48 : 38;
    } else if (id === 'cyborg') {
      style = 'plasma';
      color = attacker.team === 'player' ? '#22d3ee' : '#fb7185';
      coreColor = '#ecfeff';
      radius = 48;
    } else if (id === 'void_templar') {
      style = 'plasma';
      color = '#c084fc';
      coreColor = '#fae8ff';
      radius = 52;
    }

    this.slashes.push({
      x,
      y,
      dir,
      radius: isCrit ? radius * 1.32 : radius * 1.12,
      color: isCrit ? '#facc15' : color,
      coreColor,
      life: 0.28,
      maxLife: 0.28,
      angleOffset: (this.random() - 0.5) * 0.28,
      style,
    });
  }

  private spawnFlashStar(x: number, y: number, color: string, size: number): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size,
      color,
      alpha: 1,
      life: 0.14,
      maxLife: 0.14,
      gravity: 0,
      shape: 'flash_star',
    });
  }

  private spawnDirectionalSparks(
    x: number,
    y: number,
    dir: 1 | -1,
    color: string,
    count: number,
    speed: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const spread = (this.random() - 0.5) * 1.45;
      const baseAngle = dir === 1 ? 0 : Math.PI;
      const angle = baseAngle + spread;
      const spd = speed * (0.45 + this.random() * 0.85);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 55,
        size: 3.0 + this.random() * 3.5,
        color,
        alpha: 1,
        life: 0.2 + this.random() * 0.2,
        maxLife: 0.4,
        gravity: 390,
        shape: 'spark',
      });
    }
  }

  private spawnDustWave(x: number, y: number, vx: number, size: number, color: string): void {
    this.particles.push({
      x,
      y,
      vx,
      vy: -8,
      size,
      color,
      alpha: 0.65,
      life: 0.34,
      maxLife: 0.34,
      gravity: 0,
      shape: 'dust_wave',
    });
  }

  private spawnBurst(x: number, y: number, color: string, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = this.random() * Math.PI * 2;
      const spd = speed * (0.35 + this.random() * 0.75);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 45,
        size: 2.8 + this.random() * 3.8,
        color,
        alpha: 1,
        life: 0.26 + this.random() * 0.26,
        maxLife: 0.52,
        gravity: 360,
        shape: 'spark',
      });
    }
  }

  private spawnDebris(x: number, y: number, color: string, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * (0.15 + this.random() * 0.7);
      const spd = speed * (0.45 + this.random() * 0.85);
      this.particles.push({
        x: x + (this.random() - 0.5) * 14,
        y: y + (this.random() - 0.5) * 10,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 40,
        size: 3.5 + this.random() * 4.5,
        color,
        alpha: 1,
        life: 0.65 + this.random() * 0.45,
        maxLife: 1.1,
        gravity: 540,
        shape: 'debris',
        rotation: this.random() * Math.PI * 2,
        vRot: (this.random() - 0.5) * 16,
      });
    }
  }

  private spawnSmoke(x: number, y: number, count: number, dark = false): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (this.random() - 0.5) * 18,
        y: y + (this.random() - 0.5) * 12,
        vx: (this.random() - 0.5) * 38,
        vy: -28 - this.random() * 40,
        size: 8 + this.random() * 10,
        color: dark ? '#334155' : '#cbd5e1',
        alpha: dark ? 0.62 : 0.52,
        life: 0.55 + this.random() * 0.35,
        maxLife: 0.9,
        gravity: -18,
        shape: 'smoke',
      });
    }
  }

  private spawnRing(x: number, y: number, color: string, initialRadius: number): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: Math.max(10, initialRadius * 0.22),
      color,
      alpha: 0.95,
      life: 0.38,
      maxLife: 0.38,
      gravity: 0,
      shape: 'ring',
    });
  }

  private spawnScorch(x: number, radius: number, glowColor: string): void {
    this.scorchMarks.push({
      x,
      radius: Math.max(18, Math.min(82, radius * 0.72)),
      glowColor,
      life: 9.5,
      maxLife: 9.5,
    });
  }

  private spawnExplosion(x: number, y: number, radius: number, accentColor: string): void {
    // 1. Instant blinding arcade flash starburst at blast core
    this.spawnFlashStar(x, y, accentColor, Math.min(46, Math.max(20, radius * 0.62)));

    // 2. Layered Metal-Slug stepped pixel fireballs blooming outward!
    const fireballCount = radius >= 64 ? 5 : 3;
    for (let f = 0; f < fireballCount; f++) {
      const ox = f === 0 ? 0 : (this.random() - 0.5) * radius * 0.65;
      const oy = f === 0 ? -4 : -this.random() * radius * 0.45;
      const sz = Math.max(12, Math.min(28, radius * (f === 0 ? 0.34 : 0.24)));
      this.particles.push({
        x: x + ox,
        y: y + oy,
        vx: ox * 1.4,
        vy: -28 - this.random() * 44,
        size: sz,
        color: accentColor,
        alpha: 0.96,
        life: 0.3 + this.random() * 0.16,
        maxLife: 0.46,
        gravity: -25,
        shape: 'fireball',
      });
    }

    // 3. Dual expanding shockwave rings + skimming ground blast dust waves
    this.spawnRing(x, y, accentColor, radius);
    this.spawnRing(x, y, '#fef9c3', radius * 0.45);
    if (y >= GROUND_Y - 80) {
      this.spawnDustWave(x - 10, GROUND_Y, -120, Math.min(30, radius * 0.38), '#d6d3d1');
      this.spawnDustWave(x + 10, GROUND_Y, 120, Math.min(30, radius * 0.38), '#d6d3d1');
      this.spawnScorch(x, radius, accentColor);
    }

    // 4. Streaking velocity sparks, flying outlined debris & billowing smoke clouds
    this.spawnBurst(x, y, accentColor, 14, Math.min(300, radius * 3.6));
    this.spawnBurst(x, y, '#fef08a', 10, Math.min(240, radius * 2.7));
    this.spawnDebris(
      x,
      y,
      accentColor === '#22d3ee' ? '#334155' : '#44403c',
      Math.min(10, Math.max(5, Math.round(radius / 11))),
      Math.min(290, radius * 3.2),
    );
    this.spawnSmoke(x, y - 10, 5, true);
    this.spawnSmoke(x, y - 18, 3, false);
  }

  private spawnBaseDestruction(baseX: number): void {
    for (let k = 0; k < 6; k++) {
      this.spawnExplosion(
        baseX + (this.random() - 0.5) * 120,
        GROUND_Y - 20 - this.random() * 115,
        78,
        k % 2 === 0 ? '#f97316' : '#ef4444',
      );
    }
  }
}
