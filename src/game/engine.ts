import { DIFFICULTIES } from '../data/difficulty';
import { ERAS, TURRET_BY_ID, UNIT_BY_ID, getEra } from '../data/eras';
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

    faction.gold -= def.cost;
    faction.queue.push({
      unitId: def.id,
      eraIndex: def.eraIndex,
      cost: def.cost,
      trainTime: def.trainTime,
      remaining: def.trainTime,
    });
    if (team === 'player') {
      this.callbacks.onSound?.('spawn');
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

    const hpBonus = nextEra.baseMaxHp - prevEra.baseMaxHp;
    faction.baseMaxHp = nextEra.baseMaxHp;
    faction.baseHp = Math.min(faction.baseMaxHp, faction.baseHp + hpBonus);
    faction.ultimateMaxCooldown = nextEra.ultimate.cooldown;
    // Reset ultimate cooldown on evolution so the player can unleash the new era's power right away
    faction.ultimateCooldown = 0;
    faction.evolveFlash = 1;

    const baseX = team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
    this.addPopup(baseX, GROUND_Y - 140, `+${hpBonus} HP`, '#4ade80', 1.3);
    this.spawnRing(baseX, GROUND_Y - 60, nextEra.palette.accent, 110);
    this.spawnBurst(baseX, GROUND_Y - 70, '#fde047', 26, 220);

    if (team === 'player') {
      this.eraTransition = {
        active: true,
        fromEra: prevEra.index,
        toEra: nextEra.index,
        progress: 0,
      };
      this.callbacks.onSound?.('evolve');
      this.callbacks.onShake?.(0.45);
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

    faction.ultimateCooldown = def.cooldown;
    faction.ultimateMaxCooldown = def.cooldown;

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
        { x: startX, y: 78, speed: 680, dir },
        { x: startX - dir * 110, y: 108, speed: 680, dir },
        { x: startX - dir * 215, y: 88, speed: 680, dir },
      ];
    }

    this.ultimates.push(active);
    this.callbacks.onSound?.('ultimate');
    this.callbacks.onShake?.(0.55);
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
      turretSlots: 1,
      turrets: [null, null, null, null],
      queue: [],
      ultimateCooldown: 8, // brief opening cooldown so ultimate isn't wasted at 0:00
      ultimateMaxCooldown: era.ultimate.cooldown,
      baseHitFlash: 0,
      evolveFlash: 0,
      kills: 0,
      unitsSpawned: 0,
    };
  }

  private stepInternal(dt: number): void {
    this.elapsed += dt;

    // 1. Passive income, cooldowns, flash decay
    const diff = DIFFICULTIES[this.difficulty];
    const pEra = getEra(this.player.eraIndex);
    const eEra = getEra(this.enemy.eraIndex);

    this.player.gold += pEra.passiveGoldPerSec * dt;
    this.enemy.gold += eEra.passiveGoldPerSec * diff.aiGoldMultiplier * dt;

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
      this.callbacks.onShake?.(0.95);
    } else if (this.player.baseHp <= 0) {
      this.player.baseHp = 0;
      this.status = 'defeat';
      this.spawnBaseDestruction(PLAYER_BASE_X);
      this.callbacks.onSound?.('defeat');
      this.callbacks.onShake?.(0.95);
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
    const unit: UnitEntity = {
      uid: this.nextUid++,
      team,
      def,
      x: spawnX + jitter,
      y: GROUND_Y,
      hp: def.maxHp,
      maxHp: def.maxHp,
      state: 'walk',
      attackCooldown: 0.15,
      attackAnim: 0,
      walkPhase: this.random() * Math.PI * 2,
      hitFlash: 0,
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

      for (let i = 0; i < allies.length; i++) {
        const u = allies[i];
        if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt * 7);
        if (u.attackCooldown > 0) u.attackCooldown = Math.max(0, u.attackCooldown - dt);
        if (u.attackAnim > 0) u.attackAnim = Math.max(0, u.attackAnim - dt * 3.4);

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
            u.attackCooldown = 1 / u.def.attackRate;
            u.attackAnim = 1;
          }
        } else {
          // Friendly spacing: melee units avoid stacking directly on top of an engaged melee ally directly ahead
          let blockedByAlly = false;
          if (i > 0) {
            const ahead = allies[i - 1];
            const gap = (ahead.x - u.x) * dir;
            const desiredGap = (ahead.def.width + u.def.width) * 0.42;
            if (gap < desiredGap && ahead.state === 'attack' && u.def.role === ahead.def.role) {
              blockedByAlly = true;
            }
          }

          if (blockedByAlly) {
            u.state = 'idle';
          } else {
            u.state = 'walk';
            const moveDist = u.def.speed * dt;
            let nextX = u.x + moveDist * dir;
            // Don't walk past closest enemy unit or enemy base
            if (target) {
              const stopX = target.x - dir * ((target.def.width + u.def.width) * 0.48);
              nextX = dir === 1 ? Math.min(nextX, stopX) : Math.max(nextX, stopX);
            }
            const baseStop = enemyBaseFront - dir * (u.def.width * 0.5 + 4);
            nextX = dir === 1 ? Math.min(nextX, baseStop) : Math.max(nextX, baseStop);
            u.x = nextX;
            u.walkPhase += dt * (u.def.speed * 0.16);
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
    const isCrit = this.random() < def.critChance;
    const rawDamage = def.damage * (isCrit ? CRIT_MULTIPLIER : 1);

    this.callbacks.onSound?.(def.attackSound);

    const originX = attacker.x + dir * (def.width * 0.56);
    const originY = GROUND_Y - def.height * 0.88;
    const targetX = target
      ? target.x
      : attacker.team === 'player'
        ? ENEMY_BASE_FRONT_X + 12
        : PLAYER_BASE_FRONT_X - 12;
    const targetY = target ? GROUND_Y - target.def.height * 0.72 : GROUND_Y - 70;

    // Instant Railgun piercing beam
    if (def.projectile === 'railgun') {
      const endX = originX + dir * (def.range + 45);
      this.beams.push({
        uid: this.nextUid++,
        team: attacker.team,
        style: 'railgun',
        x1: originX,
        y1: originY,
        x2: endX,
        y2: originY,
        width: 5,
        color: attacker.team === 'player' ? '#38bdf8' : '#fb7185',
        life: 0.24,
        maxLife: 0.24,
        seed: this.random(),
      });
      this.spawnBurst(originX, originY, '#7dd3fc', 6, 110);

      // Pierce up to def.pierceCount enemies along beam
      const hitCandidates = this.units
        .filter((u) => u.team !== attacker.team && u.state !== 'dead')
        .filter((u) => {
          const rel = (u.x - originX) * dir;
          return rel >= -10 && rel <= def.range + 45;
        })
        .sort((a, b) => (a.x - originX) * dir - (b.x - originX) * dir);

      let hits = 0;
      for (const victim of hitCandidates) {
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
      if (isCrit) this.callbacks.onShake?.(0.2);
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

      // Muzzle flash smoke for gunpowder/modern/tank weapons
      if (def.projectile === 'bullet' || def.projectile === 'cannonball' || def.projectile === 'shell' || def.projectile === 'rocket') {
        this.spawnBurst(originX, originY, '#fde68a', 5, 80);
        this.spawnSmoke(originX, originY, 3);
      }
      if (def.projectile === 'cannonball' || def.projectile === 'shell') {
        this.callbacks.onShake?.(0.14);
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
        this.callbacks.onShake?.(0.18);
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

      if (def.projectile === 'ion_beam') {
        const tx = bestTarget.x;
        const ty = GROUND_Y - bestTarget.def.height * 0.5;
        this.beams.push({
          uid: this.nextUid++,
          team: faction.team,
          style: 'ion_beam',
          x1: muzzleX,
          y1: muzzleY,
          x2: tx,
          y2: ty,
          width: 7,
          color: '#22d3ee',
          life: 0.28,
          maxLife: 0.28,
          seed: this.random(),
        });
        this.applySplashDamage(
          tx,
          faction.team,
          def.damage,
          def.splashRadius,
          def.armorPierce,
          false,
          dir * 75,
        );
        this.spawnRing(tx, ty, '#38bdf8', def.splashRadius * 0.6);
        this.callbacks.onShake?.(0.2);
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
          damage: def.damage,
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

      // Smoke trail for rockets / cannonballs / shells
      if ((p.style === 'rocket' || p.style === 'cannonball' || p.style === 'shell') && this.random() < 0.65) {
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: -p.vx * 0.08 + (this.random() - 0.5) * 16,
          vy: -10 - this.random() * 14,
          size: p.style === 'rocket' ? 4.5 : 3.5,
          color: p.style === 'rocket' ? '#e2e8f0' : '#94a3b8',
          alpha: 0.6,
          life: 0.3,
          maxLife: 0.3,
          gravity: -15,
          shape: 'smoke',
        });
      }

      const enemyTeam: Team = p.team === 'player' ? 'enemy' : 'player';
      const dir = p.team === 'player' ? 1 : -1;
      let impacted = false;

      // Check collision with enemy units
      for (const u of this.units) {
        if (u.team !== enemyTeam || u.state === 'dead') continue;
        if (p.hitUids.includes(u.uid)) continue;
        const halfW = u.def.width * 0.55 + 6;
        const topY = GROUND_Y - u.def.height - 4;
        if (p.x >= u.x - halfW && p.x <= u.x + halfW && p.y >= topY && p.y <= GROUND_Y + 6) {
          p.hitUids.push(u.uid);
          if (p.splashRadius > 0) {
            this.applySplashDamage(p.x, p.team, p.damage, p.splashRadius, p.armorPierce, p.isCrit, dir * p.knockback);
            this.spawnExplosion(p.x, Math.min(p.y, GROUND_Y - 6), p.splashRadius, p.style === 'plasma' ? '#22d3ee' : '#f97316');
            this.callbacks.onSound?.('explosion');
            if (p.splashRadius >= 60) this.callbacks.onShake?.(0.22);
          } else {
            this.applyDamageToUnit(u, p.damage, p.armorPierce, p.isCrit, dir * p.knockback, p.team);
            this.spawnBurst(p.x, p.y, p.style === 'plasma' ? '#38bdf8' : '#fef08a', 5, 100);
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
            this.spawnExplosion(p.x, Math.min(p.y, GROUND_Y - 12), p.splashRadius * 0.8, '#fb923c');
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
          this.spawnExplosion(p.x, GROUND_Y - 4, p.splashRadius, p.style === 'plasma' ? '#22d3ee' : '#f97316');
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

      // Update planes for carpet bombing
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
        if (ord.kind === 'fire_arrows' || ord.kind === 'carpet_bomb' || ord.kind === 'naval_barrage') {
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
          this.callbacks.onShake?.(0.28);
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
      this.callbacks.onShake?.(0.35);
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
      this.callbacks.onShake?.(0.45);
      return;
    }

    // Falling sky ordinance (meteor, fire_arrows, naval_barrage, carpet_bomb, tactical_missiles)
    const startY = kind === 'carpet_bomb' ? 92 : -40;
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
    const gravity = kind === 'fire_arrows' || kind === 'carpet_bomb' || kind === 'naval_barrage' ? 320 : 0;
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
    const effectiveArmor = armorPierce ? victim.def.armor * 0.4 : victim.def.armor;
    const finalDamage = Math.max(1, Math.round(rawDamage * (1 - effectiveArmor)));
    victim.hp -= finalDamage;
    victim.hitFlash = 1;
    victim.knockbackVel += knockbackImpulse * (victim.def.isMechanical ? 0.35 : 0.85);

    this.addPopup(
      victim.x + (this.random() - 0.5) * 16,
      GROUND_Y - victim.def.height * 1.48 - 10,
      isCrit ? `${finalDamage}!` : `${finalDamage}`,
      isCrit ? '#fde047' : '#ffffff',
      isCrit ? 1.28 : 0.98,
    );

    if (victim.hp <= 0) {
      victim.hp = 0;
      victim.state = 'dead';
      victim.deathTimer = 0;

      const killer = this.getFaction(attackerTeam);
      const loser = this.getFaction(victim.team);
      const diff = DIFFICULTIES[this.difficulty];

      const goldMult = attackerTeam === 'enemy' ? diff.aiGoldMultiplier : 1;
      const xpMult = attackerTeam === 'enemy' ? diff.aiXpMultiplier : 1;

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
        this.addPopup(victim.x, GROUND_Y - victim.def.height * 1.48 - 28, `+${rewardGold}G`, '#facc15', 0.96);
      }

      if (victim.def.isMechanical) {
        this.spawnExplosion(victim.x, GROUND_Y - victim.def.height * 0.65, 52, '#f97316');
        this.callbacks.onSound?.('explosion');
      } else {
        this.spawnBurst(victim.x, GROUND_Y - victim.def.height * 0.6, victim.team === 'player' ? '#60a5fa' : '#f87171', 10, 145);
        this.spawnDebris(victim.x, GROUND_Y - victim.def.height * 0.45, '#52525b', 4, 130);
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
    this.addPopup(baseX + (this.random() - 0.5) * 24, GROUND_Y - 125, `-${dmg}`, isCrit ? '#fbbf24' : '#f87171', isCrit ? 1.3 : 1.08);
    this.spawnDebris(baseX, GROUND_Y - 64, '#78716c', 4, 150);
    this.callbacks.onSound?.('hit_base');
    this.callbacks.onShake?.(isCrit ? 0.25 : 0.12);
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
    if (this.particles.length > 340) {
      this.particles.splice(0, this.particles.length - 340);
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

  private addPopup(x: number, y: number, text: string, color: string, scale: number): void {
    // Spread simultaneous combat numbers horizontally and stagger vertically so none overlap
    let px = x + (this.random() - 0.5) * 40;
    let py = y + (this.random() - 0.5) * 10;
    const minSepY = 20;

    for (let attempt = 0; attempt < 9; attempt++) {
      let crowded: DamagePopup | null = null;
      let requiredX = 36;
      for (const existing of this.popups) {
        // Account for actual label width (e.g., 4-5 digit Future era damage numbers & +G popups)
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
    const vy = -(54 + this.random() * 20) * (scale > 1.1 ? 1.1 : 1);

    this.popups.push({
      x: px,
      y: py,
      vx,
      vy,
      text,
      color,
      scale,
      life: 0.84,
      maxLife: 0.84,
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

    if (id === 'clubman' || id === 'dino_rider') {
      style = 'heavy';
      color = '#fbbf24';
      coreColor = '#fef9c3';
      radius = id === 'dino_rider' ? 46 : 32;
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
    // Dual shockwave rings (outer colored + inner hot core)
    this.spawnRing(x, y, accentColor, radius);
    this.spawnRing(x, y, '#fef9c3', radius * 0.45);
    // Sparks + fiery core + flying debris shards + billowing dark & light smoke
    this.spawnBurst(x, y, accentColor, 14, Math.min(290, radius * 3.5));
    this.spawnBurst(x, y, '#fef08a', 9, Math.min(220, radius * 2.5));
    this.spawnDebris(x, y, accentColor === '#22d3ee' ? '#334155' : '#44403c', Math.min(10, Math.max(5, Math.round(radius / 11))), Math.min(280, radius * 3.1));
    this.spawnSmoke(x, y - 8, 5, true);
    this.spawnSmoke(x, y - 14, 3, false);
    // Ground scorch crater mark when impact is close to the ground
    if (y >= GROUND_Y - 75) {
      this.spawnScorch(x, radius, accentColor);
    }
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
