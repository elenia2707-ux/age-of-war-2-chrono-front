import { COMMANDERS, COMMANDER_LIST } from '../data/commanders';
import { DIFFICULTIES } from '../data/difficulty';
import { ERAS, TURRET_BY_ID, UNIT_BY_ID, getEra } from '../data/eras';
import {
  RELIC_BY_ID,
  RELIC_SYNERGIES,
  computeFactionCombatMods,
  rollRelicChoices,
} from '../data/relics';
import {
  FORTRESS_UPGRADE_REPAIR_RATIO,
  UPGRADE_BY_ID,
  createInitialUpgrades,
  getArmorHpMult,
  getArmorMitigationBonus,
  getArmorPierceFraction,
  getAttackSpeedMult,
  getBaseMaxHpMult,
  getBerserkAttackSpeedMult,
  getBerserkDamageMult,
  getCostDiscountMult,
  getCritChanceBonus,
  getCritDamageBonus,
  getExecutionerDamageMult,
  getFeverDurationSec,
  getFeverPowerBonus,
  getGoldIncomeMult,
  getKillGoldMult,
  getKillXpMult,
  getKnockbackResistMult,
  getLifestealRatio,
  getMoveSpeedMult,
  getNextUpgradeCost,
  getProjectileSpeedMult,
  getRangeMult,
  getRegenRatePerSec,
  getSiegeDamageMult,
  getSplashRadiusMult,
  getSupplyCrateCooldownMult,
  getSupplyCrateRewardMult,
  getThornsReflectRatio,
  getTrainSpeedMult,
  getTurretAttackSpeedMult,
  getTurretDamageMult,
  getTurretRapidRangeMult,
  getUltimateCooldownMult,
  getUltimateDamageMult,
  getUltimateXpCostMult,
  getVanguardShieldRatio,
  getVeteranRankForKills,
  getVeteranSpawnChance,
  getVeteranStatMult,
  getWeaponDamageMult,
  getXpMasteryMult,
} from '../data/upgrades';
import type {
  ActiveUltimate,
  BattleBounty,
  BattleSpoil,
  BeamEffect,
  BountyKind,
  ChronoRiftKind,
  ChronoRiftZone,
  CommanderId,
  DailyMutatorId,
  DamagePopup,
  DifficultyId,
  EngineCallbacks,
  FactionState,
  GameMode,
  GameSnapshot,
  GameStatus,
  ParticleEntity,
  ProjectileEntity,
  RelicId,
  SanctuaryLevels,
  ScorchMark,
  SlashEffect,
  SpoilKind,
  StartGameOptions,
  SupplyCrateEntity,
  Team,
  TreasureDrone,
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

const FEVER_DURATION_SEC = 10;

export class GameEngine {
  public status: GameStatus = 'title';
  public mode: GameMode = 'campaign';
  public difficulty: DifficultyId = 'normal';
  public speed: 1 | 2 | 3 = 1;
  public autoSpawn = false;
  public elapsed = 0;
  public wave = 1;
  public frontlineX = WORLD_WIDTH * 0.5;
  public frontlineActive = false;
  public mutators: DailyMutatorId[] = [];
  public dailyDateKey: string | undefined;
  public pendingRelicDraft: RelicId[] = [];
  public activeRift: ChronoRiftZone | null = null;
  public activeBounty: BattleBounty | null = null;
  public treasureDrone: TreasureDrone | null = null;
  public spoils: BattleSpoil[] = [];

  public player: FactionState;
  public enemy: FactionState;

  public units: UnitEntity[] = [];
  public supplyCrates: SupplyCrateEntity[] = [];
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
  private dynamicEventsEnabled = false;
  private nextSupplyCrateAt = 24;
  private nextRiftAt = 28;
  private nextEliteAt = 42;
  private nextBountyAt = 18;
  private nextDroneAt = 34;
  private endlessWaveTimer = 0;
  private autoSpawnThinkTimer = 0;
  private firstBloodClaimed = false;
  private enemyHalfBaseBossSpawned = false;
  private playerSanctuary: Partial<SanctuaryLevels> | undefined;
  private ai = new EnemyAI();
  private callbacks: EngineCallbacks;
  private scratchPlayerLive: UnitEntity[] = [];
  private scratchEnemyLive: UnitEntity[] = [];
  private scratchHitCandidates: UnitEntity[] = [];

  constructor(callbacks: EngineCallbacks = {}) {
    this.callbacks = callbacks;
    this.player = this.createFaction('player', null);
    this.enemy = this.createFaction('enemy', null);
  }

  public setCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks;
  }

  public startNewGame(difficulty: DifficultyId, seed?: number, options?: StartGameOptions): void {
    this.difficulty = difficulty;
    this.mode = options?.mode ?? 'campaign';
    this.mutators = options?.mutators ? [...options.mutators] : [];
    this.dailyDateKey = options?.dailyDateKey;
    this.playerSanctuary = options?.sanctuary;
    this.dynamicEventsEnabled = options !== undefined;
    this.status = 'playing';
    this.speed = 1;
    this.autoSpawn = false;
    this.elapsed = 0;
    this.wave = 1;
    this.frontlineX = WORLD_WIDTH * 0.5;
    this.frontlineActive = false;
    this.endlessWaveTimer = 0;
    this.autoSpawnThinkTimer = 0;
    this.firstBloodClaimed = false;
    this.enemyHalfBaseBossSpawned = false;
    this.pendingRelicDraft = [];
    this.activeRift = null;
    this.activeBounty = null;
    this.treasureDrone = null;
    this.spoils = [];
    this.nextUid = 1;
    this.rngState = seed ?? ((Date.now() & 0x7fffffff) || 1337);
    this.nextSupplyCrateAt = 24;
    this.nextRiftAt = this.mutators.includes('rift_overdrive') ? 14 : 28;
    this.nextEliteAt = this.mode === 'endless' ? 24 : 42;
    this.nextBountyAt = 16;
    this.nextDroneAt = 32;

    const playerCommander = options?.commanderId ?? null;
    let enemyCommander: CommanderId | null = null;
    if (playerCommander !== null && DIFFICULTIES[difficulty].aiCounterSmartness >= 0.65) {
      enemyCommander = COMMANDER_LIST[Math.floor(this.random() * COMMANDER_LIST.length)].id;
    }

    this.player = this.createFaction('player', playerCommander);
    this.enemy = this.createFaction('enemy', enemyCommander);
    this.units = [];
    this.supplyCrates = [];
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

    if ((this.playerSanctuary?.starter_relic ?? 0) >= 1 || this.mutators.includes('relic_rush')) {
      this.offerRelicDraft();
    }
  }

  public setSpeed(speed: 1 | 2 | 3): void {
    this.speed = speed;
  }

  public toggleSpeed(): 1 | 2 | 3 {
    this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 3 : 1;
    return this.speed;
  }

  public setAutoSpawn(enabled: boolean): void {
    this.autoSpawn = enabled;
  }

  public toggleAutoSpawn(): boolean {
    this.autoSpawn = !this.autoSpawn;
    return this.autoSpawn;
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

  public getMaxUnitCap(team: Team): number {
    return MAX_UNITS_PER_TEAM + this.getFaction(team).mods.maxUnitsBonus;
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

  public getEffectiveUnitCost(team: Team, baseCost: number): number {
    const faction = this.getFaction(team);
    return Math.max(
      1,
      Math.round(baseCost * getCostDiscountMult(faction.upgrades) * faction.mods.unitCostMult),
    );
  }

  public getEffectiveTurretCost(team: Team, baseCost: number): number {
    const faction = this.getFaction(team);
    return Math.max(
      1,
      Math.round(baseCost * getCostDiscountMult(faction.upgrades) * faction.mods.turretCostMult),
    );
  }

  public offerRelicDraft(): RelicId[] {
    if (this.pendingRelicDraft.length > 0) return this.pendingRelicDraft;
    const luck = this.playerSanctuary?.starter_relic ?? 0;
    const choices = rollRelicChoices(this.player.relics, () => this.random(), luck, 3);
    if (choices.length > 0) {
      this.pendingRelicDraft = choices;
      this.callbacks.onRelicDraft?.(choices);
    }
    return choices;
  }

  public rerollRelicDraft(): RelicId[] {
    if (this.pendingRelicDraft.length === 0 || this.player.relicRerolls <= 0) {
      return this.pendingRelicDraft;
    }
    const luck = this.playerSanctuary?.starter_relic ?? 0;
    const nextChoices = rollRelicChoices(
      this.player.relics,
      () => this.random(),
      luck + 1,
      3,
      this.pendingRelicDraft,
    );
    if (nextChoices.length > 0) {
      this.player.relicRerolls -= 1;
      this.pendingRelicDraft = nextChoices;
      this.callbacks.onSound?.('ui_tap');
      this.callbacks.onRelicDraft?.(nextChoices);
    }
    return this.pendingRelicDraft;
  }

  public selectRelic(relicId: RelicId, team: Team = 'player'): boolean {
    const def = RELIC_BY_ID[relicId];
    if (!def) return false;
    const faction = this.getFaction(team);
    if (faction.relics.includes(relicId)) return false;

    if (team === 'player') {
      this.pendingRelicDraft = [];
    }

    const prevMods = faction.mods;
    faction.relics.push(relicId);
    faction.mods = computeFactionCombatMods({
      commanderId: faction.commanderId,
      relics: faction.relics,
      sanctuary: team === 'player' ? this.playerSanctuary : undefined,
      mutators: this.mutators,
      isPlayer: team === 'player',
    });

    const era = getEra(faction.eraIndex);
    const nextMods = faction.mods;

    // Immediately sync base max HP if relic increases baseMaxHpMult
    if (nextMods.baseMaxHpMult > prevMods.baseMaxHpMult) {
      const prevMax = faction.baseMaxHp;
      const nextMax = Math.round(
        era.baseMaxHp * getBaseMaxHpMult(faction.upgrades) * nextMods.baseMaxHpMult,
      );
      const gain = Math.max(0, nextMax - prevMax);
      faction.baseMaxHp = nextMax;
      faction.baseHp = Math.min(nextMax, faction.baseHp + gain);
      faction.displayBaseHp = Math.max(faction.displayBaseHp, faction.baseHp);
    }

    // Sync ultimate cooldown cap if chrono_overclock was picked
    const nextUltMax = Math.max(
      10,
      Math.round(
        era.ultimate.cooldown *
          getUltimateCooldownMult(faction.upgrades) *
          nextMods.ultCooldownMult *
          10,
      ) / 10,
    );
    if (faction.ultimateMaxCooldown > 0 && faction.ultimateCooldown > 0) {
      faction.ultimateCooldown = Math.min(
        nextUltMax,
        faction.ultimateCooldown * (nextUltMax / faction.ultimateMaxCooldown),
      );
    }
    faction.ultimateMaxCooldown = nextUltMax;

    // Update live allied units' maxHp, shields & Synergy visual flags!
    const armorMult = getArmorHpMult(faction.upgrades);
    const shieldRatio = getVanguardShieldRatio(faction.upgrades) + nextMods.shieldBonusRatio;
    const statMult = team === 'enemy' ? DIFFICULTIES[this.difficulty].aiUnitStatMult : 1;
    for (const u of this.units) {
      if (u.team === team && u.state !== 'dead') {
        const oldMax = u.maxHp;
        const baseVet = getVeteranStatMult(u.vetRank, faction.upgrades);
        const vetMult = 1 + (baseVet - 1) * nextMods.vetStatBonusMult;
        const eliteHpMult = u.eliteKind === 'boss' ? 4.2 : u.eliteKind === 'elite' ? 2.2 : 1;
        u.maxHp = Math.round(
          u.def.maxHp * armorMult * nextMods.maxHpMult * vetMult * statMult * eliteHpMult,
        );
        if (u.maxHp > oldMax) {
          u.hp = Math.min(u.maxHp, u.hp + (u.maxHp - oldMax));
          u.displayHp = Math.max(u.displayHp, u.hp);
        }
        if (shieldRatio > 0) {
          const nextMaxShield = Math.round(u.maxHp * shieldRatio);
          const sGain = Math.max(0, nextMaxShield - u.maxShield);
          u.maxShield = Math.max(u.maxShield, nextMaxShield);
          u.shield = Math.min(u.maxShield, u.shield + sGain);
        }
        u.imperialHalo = nextMods.imperialTier >= 2 && u.vetRank >= 1;
        u.bulwarkHex = nextMods.bulwarkTier >= 2 && u.shield > 0.5;
        u.berserkerAura = nextMods.berserkerTier >= 2 && u.hp / Math.max(1, u.maxHp) <= 0.75;
        u.upgradeFlash = 1;
      }
    }

    const baseX = team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
    faction.upgradeFlash = 1;
    this.spawnRing(baseX, GROUND_Y - 78, def.accentColor, 96);
    this.spawnFlashStar(baseX, GROUND_Y - 86, '#fef08a', 28);

    // Check if picking this relic awakened a new 2-Set or 3-Set Relic Synergy!
    const synDef = RELIC_SYNERGIES[def.synergy];
    const prevSynCount = prevMods.synergyCounts[def.synergy] ?? 0;
    const nextSynCount = nextMods.synergyCounts[def.synergy] ?? 0;
    const unlockedTier =
      nextSynCount >= 3 && prevSynCount < 3
        ? 3
        : nextSynCount >= 2 && prevSynCount < 2
          ? 2
          : 0;

    if (team === 'player') {
      if (unlockedTier > 0 && synDef) {
        this.callbacks.onSound?.('synergy_unlock');
        this.spawnRing(baseX, GROUND_Y - 64, synDef.accentColor, 126);
        this.spawnGroundShockwave(baseX + 32, GROUND_Y + 2, synDef.accentColor, 118);
        const tierDesc = unlockedTier === 3 ? synDef.threeSetDesc : synDef.twoSetDesc;
        this.addPopup(
          baseX + 28,
          GROUND_Y - 166,
          `${synDef.glyph} ${synDef.name} ${unlockedTier}세트!`,
          synDef.accentColor,
          1.32,
          'crit',
        );
        this.callbacks.onBanner?.(
          `${synDef.glyph} ${synDef.name} ${unlockedTier}세트 각성!`,
          tierDesc,
          synDef.accentColor,
        );
      } else {
        this.callbacks.onSound?.('relic_pick');
        this.addPopup(baseX + 20, GROUND_Y - 152, `유물: ${def.shortName}!`, def.accentColor, 1.24, 'crit');
        this.callbacks.onBanner?.(`크로노 유물 공명: ${def.name}`, def.effectText, def.accentColor);
      }
    }
    return true;
  }

  public canUseTacticalSkill(team: Team): boolean {
    const faction = this.getFaction(team);
    return (
      this.status === 'playing' &&
      faction.commanderId !== null &&
      faction.tacticalCooldown <= 0
    );
  }

  public triggerTacticalSkill(team: Team): boolean {
    if (!this.canUseTacticalSkill(team)) return false;
    const faction = this.getFaction(team);
    const cmd = COMMANDERS[faction.commanderId!];
    const era = getEra(faction.eraIndex);
    const dir: 1 | -1 = team === 'player' ? 1 : -1;
    const baseX = team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;

    faction.tacticalCooldown = faction.tacticalMaxCooldown;
    faction.upgradeFlash = 1;

    if (cmd.id === 'vanguard') {
      faction.tacticalBuffTimer = 6.0;
      for (const u of this.units) {
        if (u.team === team && u.state !== 'dead') {
          const bonusShield = Math.max(8, Math.round(u.maxHp * 0.15));
          u.maxShield = Math.max(u.maxShield, u.shield + bonusShield);
          u.shield = Math.min(u.maxShield, u.shield + bonusShield);
          u.upgradeFlash = 1;
          this.spawnRing(u.x, GROUND_Y - u.def.height * 0.6, '#38bdf8', 32);
        }
      }
      this.spawnRing(baseX + dir * 40, GROUND_Y - 64, '#38bdf8', 95);
    } else if (cmd.id === 'ordnance') {
      const enemyTeam: Team = team === 'player' ? 'enemy' : 'player';
      let centerTargetX = team === 'player' ? WORLD_WIDTH * 0.62 : WORLD_WIDTH * 0.38;
      let bestFrontX = team === 'player' ? WORLD_WIDTH : 0;
      let foundEnemy = false;
      for (const u of this.units) {
        if (u.team === enemyTeam && u.state !== 'dead') {
          if (!foundEnemy || (team === 'player' ? u.x < bestFrontX : u.x > bestFrontX)) {
            bestFrontX = u.x;
            foundEnemy = true;
          }
        }
      }
      if (foundEnemy) centerTargetX = bestFrontX + dir * 35;
      centerTargetX = Math.max(PLAYER_BASE_FRONT_X + 70, Math.min(ENEMY_BASE_FRONT_X - 70, centerTargetX));

      const shellDmg = Math.max(
        26,
        Math.round(era.ultimate.damagePerStrike * 0.44 * faction.mods.turretDamageMult),
      );
      const projStyle =
        faction.eraIndex >= 9 ? 'plasma' : faction.eraIndex >= 5 ? 'mortar_shell' : 'boulder';
      for (let s = 0; s < 5; s++) {
        const tx = Math.max(
          PLAYER_BASE_FRONT_X + 55,
          Math.min(ENEMY_BASE_FRONT_X - 55, centerTargetX + (s - 2) * 52 + (this.random() - 0.5) * 20),
        );
        const startX = baseX + dir * 45;
        const startY = GROUND_Y - 125;
        const flightTime = 0.42 + s * 0.07;
        const gravity = 460;
        const vx = (tx - startX) / flightTime;
        const vy = (GROUND_Y - startY - 0.5 * gravity * flightTime * flightTime) / flightTime;
        this.projectiles.push({
          uid: this.nextUid++,
          team,
          style: projStyle,
          x: startX,
          y: startY,
          prevX: startX,
          prevY: startY,
          vx,
          vy,
          gravity,
          damage: shellDmg,
          splashRadius: 84 + faction.mods.splashBonusPx,
          armorPierce: true,
          isCrit: false,
          baseDamageMult: 0.75,
          knockback: 88,
          pierceRemaining: 1,
          hitUids: [],
          life: 0,
          maxLife: flightTime + 0.6,
        });
      }
      this.spawnMuzzleFlash(baseX + dir * 45, GROUND_Y - 125, dir === 1 ? -0.35 : Math.PI + 0.35, '#fb923c', 24);
    } else if (cmd.id === 'archon') {
      const bonusGold = Math.max(45, Math.round((era.units[2]?.cost ?? 45) * 1.45));
      faction.gold += bonusGold;
      let speedUp = 3.0;
      for (const q of faction.queue) {
        const cut = Math.min(q.remaining, speedUp);
        q.remaining -= cut;
        speedUp -= cut;
        if (speedUp <= 0) break;
      }
      if (this.supplyCrates.length < 2) {
        this.spawnSupplyCrate();
      }
      this.addPopup(baseX + dir * 24, GROUND_Y - 150, `+${bonusGold.toLocaleString()}G`, '#facc15', 1.28, 'gold');
      this.spawnRing(baseX, GROUND_Y - 72, '#facc15', 92);
    } else if (cmd.id === 'aegis') {
      faction.aegisProtectedTimer = 5.0;
      const fortRepair = Math.max(20, Math.round(faction.baseMaxHp * 0.08));
      faction.baseHp = Math.min(faction.baseMaxHp, faction.baseHp + fortRepair);
      faction.displayBaseHp = Math.max(faction.displayBaseHp, faction.baseHp);
      this.addPopup(baseX, GROUND_Y - 150, `+${fortRepair} HP`, '#4ade80', 1.24, 'heal');

      for (const u of this.units) {
        if (u.team === team && u.state !== 'dead') {
          const missing = Math.max(0, u.maxHp - u.hp);
          const heal = Math.round(missing * 0.42 + u.maxHp * 0.08);
          if (heal > 0) {
            u.hp = Math.min(u.maxHp, u.hp + heal);
            u.displayHp = Math.max(u.displayHp, u.hp);
          }
          u.upgradeFlash = 1;
          this.spawnRing(u.x, GROUND_Y - u.def.height * 0.55, '#4ade80', 30);
        }
      }
      this.spawnRing(baseX, GROUND_Y - 70, '#4ade80', 96);
    }

    if (team === 'player') {
      this.callbacks.onSound?.('tactical');
      this.callbacks.onBanner?.(`전술 발동: ${cmd.skillName}`, cmd.skillDesc, cmd.accentColor);
    }
    return true;
  }

  public spawnChronoRift(customKind?: ChronoRiftKind, customX?: number): ChronoRiftZone {
    const kinds: ChronoRiftKind[] = ['haste', 'fury', 'sanctuary'];
    const kind = customKind ?? kinds[Math.floor(this.random() * kinds.length)];
    const meta =
      kind === 'haste'
        ? { name: '시공 가속 균열', sub: '구역 내 양군 공속·이속 대폭 상승!', color: '#38bdf8' }
        : kind === 'fury'
          ? { name: '광전 화력 균열', sub: '구역 내 양군 공격력 +28% · 치명타율 급증!', color: '#fb923c' }
          : { name: '성운 치유 균열', sub: '구역 점령군 초당 5.5% 치유 · 추가 군자금 획득!', color: '#4ade80' };

    const x = customX ?? Math.round(WORLD_WIDTH * (0.4 + this.random() * 0.2));
    const rift: ChronoRiftZone = {
      uid: this.nextUid++,
      kind,
      name: meta.name,
      x,
      radius: 135,
      life: 18,
      maxLife: 18,
      accentColor: meta.color,
    };
    this.activeRift = rift;
    this.spawnRing(x, GROUND_Y - 12, meta.color, 95);
    this.spawnGroundShockwave(x, GROUND_Y + 2, meta.color, 110);
    this.callbacks.onSound?.('rift_open');
    this.callbacks.onBanner?.(`${meta.name} 개방!`, meta.sub, meta.color);
    return rift;
  }

  public spawnSpecialUnit(team: Team, kind: 'elite' | 'boss'): UnitEntity {
    const faction = this.getFaction(team);
    const era = getEra(faction.eraIndex);
    const unitDef =
      kind === 'boss'
        ? era.units[era.units.length - 1]
        : era.units[this.random() < 0.5 ? Math.max(0, era.units.length - 2) : era.units.length - 1];
    const unit = this.spawnUnit(team, unitDef, kind);
    const spawnX = unit.x;
    const accent = kind === 'boss' ? '#f43f5e' : '#facc15';
    this.spawnRing(spawnX, GROUND_Y - 50, accent, kind === 'boss' ? 85 : 54);
    this.spawnGroundShockwave(spawnX, GROUND_Y + 1, accent, kind === 'boss' ? 88 : 52);

    if (kind === 'boss' && team === 'enemy') {
      this.callbacks.onSound?.('boss_spawn');
      this.callbacks.onBanner?.(
        `경고: ${unit.eliteTitle ?? '시대 수호군주'} 강림!`,
        `강력한 적 보스 [${unitDef.name}] 처치 시 대량의 골드·XP·메달 획득!`,
        '#f43f5e',
      );
    }
    return unit;
  }

  public enqueueUnit(team: Team, unitId: UnitVisualKind): boolean {
    if (this.status !== 'playing') return false;
    const faction = this.getFaction(team);
    const era = getEra(faction.eraIndex);
    const def = era.units.find((u) => u.id === unitId);
    if (!def) return false;
    if (faction.queue.length >= MAX_QUEUE_SIZE) return false;
    const effCost = this.getEffectiveUnitCost(team, def.cost);
    if (faction.gold < effCost) return false;

    const effectiveTrainTime =
      def.trainTime / (getTrainSpeedMult(faction.upgrades) * faction.mods.trainSpeedMult);
    faction.gold -= effCost;
    faction.queue.push({
      unitId: def.id,
      eraIndex: def.eraIndex,
      cost: effCost,
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
    const era = getEra(faction.eraIndex);

    const syncUltCooldown = () => {
      const nextUltMax = Math.max(
        10,
        Math.round(
          era.ultimate.cooldown *
            getUltimateCooldownMult(faction.upgrades) *
            faction.mods.ultCooldownMult *
            10,
        ) / 10,
      );
      if (faction.ultimateMaxCooldown > 0 && faction.ultimateCooldown > 0) {
        faction.ultimateCooldown = Math.min(
          nextUltMax,
          faction.ultimateCooldown * (nextUltMax / faction.ultimateMaxCooldown),
        );
      }
      faction.ultimateMaxCooldown = nextUltMax;
    };

    if (id === 'armor') {
      // Scale existing live allied units immediately while preserving Veteran/Relic/Elite HP multipliers!
      const newArmorMult = getArmorHpMult(faction.upgrades);
      const statMult = team === 'enemy' ? DIFFICULTIES[this.difficulty].aiUnitStatMult : 1;
      const ratio = newArmorMult / prevArmorMult;
      const shieldRatio = getVanguardShieldRatio(faction.upgrades) + faction.mods.shieldBonusRatio;
      for (const u of this.units) {
        if (u.team === team && u.state !== 'dead') {
          const oldMax = u.maxHp;
          const baseVet = getVeteranStatMult(u.vetRank, faction.upgrades);
          const vetMult = 1 + (baseVet - 1) * faction.mods.vetStatBonusMult;
          const eliteHpMult = u.eliteKind === 'boss' ? 4.2 : u.eliteKind === 'elite' ? 2.2 : 1;
          u.maxHp = Math.round(
            u.def.maxHp * newArmorMult * faction.mods.maxHpMult * vetMult * statMult * eliteHpMult,
          );
          u.hp = Math.min(u.maxHp, Math.round(u.hp * ratio + Math.max(0, u.maxHp - oldMax) * 0.5));
          u.displayHp = Math.max(u.displayHp, u.hp);
          if (u.maxShield > 0 || shieldRatio > 0) {
            const nextMaxShield = Math.round(u.maxHp * shieldRatio);
            u.shield = Math.min(
              Math.max(u.maxShield, nextMaxShield),
              u.shield + Math.max(0, nextMaxShield - u.maxShield),
            );
            u.maxShield = Math.max(u.maxShield, nextMaxShield);
          }
          u.upgradeFlash = 1;
        }
      }
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, '#60a5fa', 1.18, 'heal');
    } else if (id === 'veteran_drill') {
      // Immediately amplify live promoted veterans' max HP & shield ceiling to match the new drill level!
      const armorMult = getArmorHpMult(faction.upgrades);
      const shieldRatio = getVanguardShieldRatio(faction.upgrades) + faction.mods.shieldBonusRatio;
      const statMult = team === 'enemy' ? DIFFICULTIES[this.difficulty].aiUnitStatMult : 1;
      for (const u of this.units) {
        if (u.team === team && u.state !== 'dead') {
          if (u.vetRank > 0) {
            const oldMax = u.maxHp;
            const baseVet = getVeteranStatMult(u.vetRank, faction.upgrades);
            const vetMult = 1 + (baseVet - 1) * faction.mods.vetStatBonusMult;
            const eliteHpMult = u.eliteKind === 'boss' ? 4.2 : u.eliteKind === 'elite' ? 2.2 : 1;
            u.maxHp = Math.round(
              u.def.maxHp * armorMult * faction.mods.maxHpMult * vetMult * statMult * eliteHpMult,
            );
            const gain = Math.max(0, u.maxHp - oldMax);
            u.hp = Math.min(u.maxHp, u.hp + gain);
            u.displayHp = Math.max(u.displayHp, u.hp);
            if (shieldRatio > 0) {
              const nextMaxShield = Math.round(u.maxHp * shieldRatio);
              u.shield = Math.min(
                Math.max(u.maxShield, nextMaxShield),
                u.shield + Math.max(0, nextMaxShield - u.maxShield),
              );
              u.maxShield = Math.max(u.maxShield, nextMaxShield);
            }
          }
          u.upgradeFlash = 1;
        }
      }
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, '#f43f5e', 1.2, 'crit');
    } else if (id === 'fortress') {
      const nextBaseMaxHp = Math.round(
        era.baseMaxHp * getBaseMaxHpMult(faction.upgrades) * faction.mods.baseMaxHpMult,
      );
      const maxGain = Math.max(0, nextBaseMaxHp - prevBaseMaxHp);
      const repair = Math.round(nextBaseMaxHp * FORTRESS_UPGRADE_REPAIR_RATIO);
      faction.baseMaxHp = nextBaseMaxHp;
      const beforeHp = faction.baseHp;
      faction.baseHp = Math.min(faction.baseMaxHp, faction.baseHp + maxGain + repair);
      faction.displayBaseHp = Math.max(faction.displayBaseHp, faction.baseHp);
      syncUltCooldown();
      const healed = Math.max(1, Math.round(faction.baseHp - beforeHp));
      this.addPopup(baseX, GROUND_Y - 148, `+${healed} HP`, '#4ade80', 1.26, 'heal');
    } else if (id === 'vanguard_shield') {
      const shieldRatio = getVanguardShieldRatio(faction.upgrades) + faction.mods.shieldBonusRatio;
      for (const u of this.units) {
        if (u.team === team && u.state !== 'dead') {
          const nextMaxShield = Math.round(u.maxHp * shieldRatio);
          const gain = Math.max(0, nextMaxShield - u.maxShield);
          u.maxShield = Math.max(u.maxShield, nextMaxShield);
          u.shield = Math.min(u.maxShield, u.shield + gain);
          u.upgradeFlash = 1;
        }
      }
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, '#38bdf8', 1.2, 'elemental');
    } else if (id === 'ultimate_power') {
      syncUltCooldown();
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, '#f472b6', 1.22, 'crit');
    } else if (
      def.category === 'offense' ||
      def.category === 'defense' ||
      def.category === 'tactics' ||
      def.category === 'special' ||
      def.category === 'command'
    ) {
      for (const u of this.units) {
        if (u.team === team && u.state !== 'dead') {
          u.upgradeFlash = 1;
        }
      }
      const col =
        def.category === 'offense'
          ? '#fb923c'
          : def.category === 'defense'
            ? '#4ade80'
            : def.category === 'special'
              ? '#22d3ee'
              : def.category === 'command'
                ? '#f43f5e'
                : '#c084fc';
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, col, 1.18, 'crit');
    } else {
      this.addPopup(baseX, GROUND_Y - 146, `${def.shortName} Lv.${newLevel}`, '#facc15', 1.18, 'gold');
    }

    this.spawnRing(baseX, GROUND_Y - 76, '#facc15', 85);
    this.spawnFlashStar(baseX, GROUND_Y - 82, '#fde047', 22);
    this.spawnBurst(baseX, GROUND_Y - 76, '#fef08a', 12, 160);
    if (team === 'player') {
      this.callbacks.onSound?.('upgrade');
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
    if (!def) return false;
    const effCost = this.getEffectiveTurretCost(team, def.cost);
    if (faction.gold < effCost) return false;

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

    faction.gold -= effCost;
    faction.turrets[slotIndex] = {
      slotIndex,
      turretId: def.id,
      eraIndex: def.eraIndex,
      cost: effCost,
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

    const baseMult = getBaseMaxHpMult(faction.upgrades) * faction.mods.baseMaxHpMult;
    const prevScaledMax = Math.round(prevEra.baseMaxHp * baseMult);
    const nextScaledMax = Math.round(nextEra.baseMaxHp * baseMult);
    const hpBonus = nextScaledMax - prevScaledMax;
    faction.baseMaxHp = nextScaledMax;
    faction.baseHp = Math.min(faction.baseMaxHp, faction.baseHp + hpBonus);
    faction.displayBaseHp = faction.baseHp;
    faction.ultimateMaxCooldown = Math.max(
      10,
      Math.round(
        nextEra.ultimate.cooldown *
          getUltimateCooldownMult(faction.upgrades) *
          faction.mods.ultCooldownMult *
          10,
      ) / 10,
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
      if (
        nextEra.index === 1 ||
        nextEra.index === 4 ||
        nextEra.index === 7 ||
        nextEra.index === 10
      ) {
        this.offerRelicDraft();
      }
    } else {
      if (
        DIFFICULTIES[this.difficulty].aiCounterSmartness >= 0.65 &&
        (nextEra.index === 2 || nextEra.index === 5 || nextEra.index === 8 || nextEra.index === 11)
      ) {
        const aiPick = rollRelicChoices(faction.relics, () => this.random(), 0, 1);
        if (aiPick.length > 0) {
          this.selectRelic(aiPick[0], 'enemy');
        }
      }
      if (
        nextEra.index === 3 ||
        nextEra.index === 6 ||
        nextEra.index === 9 ||
        nextEra.index === 11
      ) {
        this.spawnSpecialUnit('enemy', 'boss');
      }
    }
    return true;
  }

  public getUltimateXpCost(team: Team): number {
    const faction = this.getFaction(team);
    const era = getEra(faction.eraIndex);
    return Math.max(
      50,
      Math.round(
        era.ultimate.xpCost * getUltimateXpCostMult(faction.upgrades) * faction.mods.ultXpCostMult,
      ),
    );
  }

  public canUseUltimate(team: Team): boolean {
    const faction = this.getFaction(team);
    return (
      this.status === 'playing' &&
      faction.ultimateCooldown <= 0 &&
      faction.xp >= this.getUltimateXpCost(team)
    );
  }

  public triggerUltimate(team: Team): boolean {
    if (!this.canUseUltimate(team)) return false;
    const faction = this.getFaction(team);
    const era = getEra(faction.eraIndex);
    const def = era.ultimate;

    // Deduct ultimate XP cost (risk-reward trade-off vs saving XP for era evolution!)
    const xpCost = this.getUltimateXpCost(team);
    faction.xp = Math.max(0, faction.xp - xpCost);
    const baseX = team === 'player' ? PLAYER_BASE_X + 36 : ENEMY_BASE_X - 36;
    this.addPopup(baseX, GROUND_Y - 148, `-${xpCost.toLocaleString()} XP`, '#c084fc', 1.14, 'elemental');

    const scaledCd = Math.max(
      10,
      Math.round(
        def.cooldown *
          getUltimateCooldownMult(faction.upgrades) *
          faction.mods.ultCooldownMult *
          10,
      ) / 10,
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
        { x: startX, y: 98, speed: 680, dir, kind: 'bomber' },
        { x: startX - dir * 110, y: 126, speed: 680, dir, kind: 'bomber' },
        { x: startX - dir * 215, y: 108, speed: 680, dir, kind: 'bomber' },
      ];
    } else if (def.kind === 'zeppelin_raid') {
      const dir: 1 | -1 = team === 'player' ? 1 : -1;
      const startX = dir === 1 ? -160 : WORLD_WIDTH + 160;
      active.planes = [
        { x: startX, y: 104, speed: 540, dir, kind: 'zeppelin' },
        { x: startX - dir * 175, y: 134, speed: 540, dir, kind: 'zeppelin' },
      ];
    }

    this.ultimates.push(active);
    if (this.callbacks.onUltimateSound) {
      this.callbacks.onUltimateSound(def.kind);
    } else {
      this.callbacks.onSound?.('ultimate');
    }
    if (team === 'player') {
      this.callbacks.onBanner?.(def.name, def.description, def.accentColor);
    }
    return true;
  }

  public step(rawDt: number): void {
    if (this.status !== 'playing') return;

    const clampedDt = Math.min(0.05, Math.max(0, rawDt));
    const totalDt = clampedDt * this.speed;
    // Sub-step when running at 2x or 3x to preserve crisp physics and hit detection
    const steps = this.speed;
    const dt = totalDt / steps;

    for (let i = 0; i < steps; i++) {
      this.stepInternal(dt);
      if (this.status !== 'playing') break;
    }
  }

  public getSnapshot(): GameSnapshot {
    return {
      status: this.status,
      mode: this.mode,
      difficulty: this.difficulty,
      speed: this.speed,
      autoSpawn: this.autoSpawn,
      elapsed: this.elapsed,
      wave: this.wave,
      frontlineX: this.frontlineX,
      frontlineActive: this.frontlineActive,
      mutators: this.mutators,
      pendingRelicDraft: this.pendingRelicDraft,
      activeRift: this.activeRift,
      activeBounty: this.activeBounty,
      treasureDrone: this.treasureDrone,
      spoils: this.spoils,
      player: this.player,
      enemy: this.enemy,
      units: this.units,
      supplyCrates: this.supplyCrates,
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

  public spawnSpoil(x: number, kind: SpoilKind, value: number, vy = -110): BattleSpoil {
    if (this.spoils.length >= 16) {
      // Auto-claim oldest spoil so battlefield never drops rewards or bloats array
      this.claimSpoil(this.spoils[0], false);
      this.spoils.shift();
    }
    const clampedX = Math.max(PLAYER_BASE_X + 60, Math.min(ENEMY_BASE_X - 60, x));
    const spoil: BattleSpoil = {
      uid: this.nextUid++,
      kind,
      x: clampedX,
      y: GROUND_Y - 18,
      vx: (this.random() - 0.5) * 95,
      vy,
      value: Math.max(1, Math.round(value)),
      life: 9.0,
      maxLife: 9.0,
      landed: false,
    };
    this.spoils.push(spoil);
    return spoil;
  }

  private claimSpoil(spoil: BattleSpoil, manualTap: boolean): void {
    const mult = manualTap ? 1.35 : 1.0;
    const val = Math.max(1, Math.round(spoil.value * mult));
    if (spoil.kind === 'gold') {
      this.player.gold += val;
      this.addPopup(
        spoil.x,
        spoil.y - 18,
        manualTap ? `터치! +${val.toLocaleString()}G` : `+${val.toLocaleString()}G`,
        '#fde047',
        manualTap ? 1.18 : 0.96,
        'gold',
      );
      this.spawnBurst(spoil.x, spoil.y - 6, '#fde047', manualTap ? 8 : 4, 115);
    } else if (spoil.kind === 'xp') {
      this.player.xp += val;
      this.player.totalXp += val;
      this.addPopup(
        spoil.x,
        spoil.y - 20,
        manualTap ? `터치! +${val.toLocaleString()}XP` : `+${val.toLocaleString()}XP`,
        '#38bdf8',
        manualTap ? 1.16 : 0.95,
        'elemental',
      );
      this.spawnBurst(spoil.x, spoil.y - 6, '#38bdf8', manualTap ? 8 : 4, 115);
    } else {
      this.player.liveMedalsEarned += val;
      this.addPopup(spoil.x, spoil.y - 24, `+🏅${val} 메달!`, '#facc15', 1.28, 'crit');
      this.spawnRing(spoil.x, spoil.y - 8, '#fde047', 36);
    }
    if (manualTap) {
      this.player.spoilsTapped += 1;
      this.callbacks.onSound?.('spoil_pickup');
    }
  }

  /**
   * Collects battlefield spoils near (worldX, worldY) on finger/mouse tap (+35% manual bonus!),
   * and also strikes an active Golden Treasure Drone if tapped directly!
   */
  public collectSpoilsNear(worldX: number, worldY: number, manualTap = true): number {
    if (this.status !== 'playing') return 0;
    let count = 0;
    for (let i = this.spoils.length - 1; i >= 0; i--) {
      const s = this.spoils[i];
      if (Math.abs(s.x - worldX) <= 68 && Math.abs(s.y - worldY) <= 78) {
        this.claimSpoil(s, manualTap);
        this.spoils.splice(i, 1);
        count++;
      }
    }
    if (
      manualTap &&
      this.treasureDrone &&
      Math.abs(this.treasureDrone.x - worldX) <= 62 &&
      Math.abs(this.treasureDrone.y - worldY) <= 62
    ) {
      const tapDmg = Math.max(18, Math.round(this.treasureDrone.maxHp * 0.28));
      this.damageTreasureDrone(tapDmg);
      count++;
    }
    return count;
  }

  public spawnTreasureDrone(): TreasureDrone {
    const era = getEra(this.player.eraIndex);
    const fromLeft = this.random() < 0.5;
    const maxHp = Math.round(70 + this.player.eraIndex * 110 + this.player.eraIndex * this.player.eraIndex * 38);
    const goldReward = Math.round((era.units[2]?.cost ?? 45) * 2.1 * this.player.mods.crateRewardMult);
    const xpReward = Math.round((era.evolveXp > 0 ? era.evolveXp * 0.16 : 5200) * this.player.mods.xpMult);
    const drone: TreasureDrone = {
      uid: this.nextUid++,
      x: fromLeft ? PLAYER_BASE_X + 120 : ENEMY_BASE_X - 120,
      y: GROUND_Y - 142,
      vx: fromLeft ? 96 : -96,
      hp: maxHp,
      maxHp,
      goldReward,
      xpReward,
      medalReward: 2,
      hitFlash: 0,
    };
    this.treasureDrone = drone;
    this.callbacks.onBanner?.(
      '💰 황금 차원 수송기 출현!',
      '사격·필살기 또는 직접 터치로 격추해 대량의 전리품과 메달을 회수하세요!',
      '#fde047',
    );
    return drone;
  }

  public damageTreasureDrone(dmg: number): void {
    const d = this.treasureDrone;
    if (!d || d.hp <= 0) return;
    const applied = Math.max(1, Math.round(dmg));
    d.hp = Math.max(0, d.hp - applied);
    d.hitFlash = 1;
    this.spawnBurst(d.x, d.y, '#fde047', 6, 130);
    this.addPopup(d.x, d.y - 26, `-${applied}`, '#fef08a', 1.05, 'crit');
    this.callbacks.onSound?.('melee_metal');

    if (d.hp <= 0) {
      const dx = d.x;
      const dy = d.y;
      this.treasureDrone = null;
      this.player.dronesKilled += 1;
      this.spawnExplosion(dx, dy, 54, '#facc15');
      this.spawnRing(dx, dy, '#fef08a', 76);
      this.callbacks.onSound?.('crate_open');

      // Shower glittering Gold, XP & Chrono Medal spoils onto the road!
      const coinEach = Math.max(10, Math.round(d.goldReward / 3));
      for (let i = 0; i < 3; i++) {
        this.spawnSpoil(dx + (i - 1) * 26, 'gold', coinEach, -135 - i * 18);
      }
      this.spawnSpoil(dx - 14, 'xp', d.xpReward, -155);
      this.spawnSpoil(dx + 14, 'medal', d.medalReward, -165);

      if (this.activeBounty && this.activeBounty.kind === 'special_hunt') {
        this.advanceBountyProgress(1);
      }
      this.callbacks.onBanner?.(
        '💰 황금 수송기 격추 대박!',
        `전리품 코인·크리스탈·크로노 메달(+🏅${d.medalReward}) 드롭! 터치 시 +35% 보너스!`,
        '#fde047',
      );
    }
  }

  public spawnBattleBounty(customKind?: BountyKind): BattleBounty {
    const kinds: BountyKind[] = this.activeRift
      ? ['kills', 'combo', 'rift_hold', 'special_hunt']
      : ['kills', 'combo', 'special_hunt'];
    const kind = customKind ?? kinds[Math.floor(this.random() * kinds.length)];
    const era = getEra(this.player.eraIndex);
    const goldReward = Math.round((era.units[2]?.cost ?? 45) * 1.9);
    const xpReward = Math.round(era.evolveXp > 0 ? era.evolveXp * 0.14 : 4600);

    let title = '적 병력 섬멸';
    let target = 7;
    let durationSec = 26;
    if (kind === 'combo') {
      target = Math.max(6, Math.min(14, 6 + Math.floor(this.player.eraIndex * 0.6)));
      title = `${target} 콤보 달성`;
      durationSec = 26;
    } else if (kind === 'rift_hold') {
      target = 7;
      title = '시공 균열 점령 7초';
      durationSec = 22;
    } else if (kind === 'special_hunt') {
      target = 1;
      title = '정예·보스·수송기 격파';
      durationSec = 32;
      if (!this.treasureDrone && !this.units.some((u) => u.team === 'enemy' && u.state !== 'dead' && u.eliteKind)) {
        this.spawnTreasureDrone();
      }
    } else {
      target = 7 + Math.min(5, Math.floor(this.player.eraIndex * 0.4));
      title = `적 ${target}기 처치`;
      durationSec = 26;
    }

    const bounty: BattleBounty = {
      uid: this.nextUid++,
      kind,
      title,
      progress: kind === 'combo' ? Math.min(target, this.player.comboCount) : 0,
      target,
      remainingSec: durationSec,
      durationSec,
      goldReward,
      xpReward,
      medalReward: 2,
    };
    this.activeBounty = bounty;
    return bounty;
  }

  private advanceBountyProgress(amount: number): void {
    const b = this.activeBounty;
    if (!b) return;
    b.progress = Math.min(b.target, b.progress + amount);
    if (b.progress >= b.target) {
      this.completeBattleBounty();
    }
  }

  private completeBattleBounty(): void {
    const b = this.activeBounty;
    if (!b) return;
    this.activeBounty = null;
    this.nextBountyAt = this.elapsed + 36;

    const gold = Math.round(b.goldReward * this.player.mods.killGoldMult);
    const xp = Math.round(b.xpReward * this.player.mods.xpMult);
    this.player.gold += gold;
    this.player.xp += xp;
    this.player.totalXp += xp;
    this.player.liveMedalsEarned += b.medalReward;
    this.player.bountiesCleared += 1;
    // Grant a crisp 3.5s Mini-Fever surge on directive clear!
    this.player.feverTimer = Math.max(this.player.feverTimer, 3.5);

    this.spawnRing(this.frontlineX, GROUND_Y - 36, '#4ade80', 86);
    this.callbacks.onSound?.('bounty_clear');
    this.addPopup(
      PLAYER_BASE_X + 42,
      GROUND_Y - 156,
      `🎯 지령 완수! +${gold.toLocaleString()}G · +🏅${b.medalReward}`,
      '#4ade80',
      1.26,
      'heal',
    );
    this.callbacks.onBanner?.(
      `🎯 긴급 지령 완수: ${b.title}!`,
      `보상 +${gold.toLocaleString()}G · +${xp.toLocaleString()} XP · +🏅${b.medalReward} 메달 · 미니 피버 발동!`,
      '#4ade80',
    );
  }

  private updateDynamicBattleEvents(dt: number): void {
    // 1. Live Tug-of-War Frontline Clash coordinate
    let maxPlayerX = -Infinity;
    let minEnemyX = Infinity;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.state === 'dead') continue;
      if (u.team === 'player' && u.x > maxPlayerX) maxPlayerX = u.x;
      if (u.team === 'enemy' && u.x < minEnemyX) minEnemyX = u.x;
    }
    if (maxPlayerX > -Infinity && minEnemyX < Infinity) {
      const targetFront = (maxPlayerX + minEnemyX) * 0.5;
      this.frontlineX += (targetFront - this.frontlineX) * Math.min(1, dt * 8);
      this.frontlineActive = Math.abs(minEnemyX - maxPlayerX) <= 220;
    } else if (maxPlayerX > -Infinity) {
      this.frontlineX += (maxPlayerX - this.frontlineX) * Math.min(1, dt * 5);
      this.frontlineActive = false;
    } else if (minEnemyX < Infinity) {
      this.frontlineX += (minEnemyX - this.frontlineX) * Math.min(1, dt * 5);
      this.frontlineActive = false;
    } else {
      this.frontlineX += (WORLD_WIDTH * 0.5 - this.frontlineX) * Math.min(1, dt * 3);
      this.frontlineActive = false;
    }

    // 2. Update physics & auto-collection of Battlefield Spoils (never lost if untapped!)
    for (let i = this.spoils.length - 1; i >= 0; i--) {
      const s = this.spoils[i];
      s.life -= dt;
      if (!s.landed) {
        s.x = Math.max(PLAYER_BASE_X + 50, Math.min(ENEMY_BASE_X - 50, s.x + s.vx * dt));
        s.vy += 380 * dt;
        s.y += s.vy * dt;
        if (s.y >= GROUND_Y - 6) {
          s.y = GROUND_Y - 6;
          s.vx = 0;
          s.vy = 0;
          s.landed = true;
        }
      } else {
        // Allied unit walking past or timer <= 4.5s auto-claims at 1.0x so AFK play loses nothing!
        let pickedByAlly = s.life <= 4.5;
        if (!pickedByAlly) {
          for (let uIdx = 0; uIdx < this.units.length; uIdx++) {
            const u = this.units[uIdx];
            if (u.team === 'player' && u.state !== 'dead' && Math.abs(u.x - s.x) <= 28) {
              pickedByAlly = true;
              break;
            }
          }
        }
        if (pickedByAlly || s.life <= 0) {
          this.claimSpoil(s, false);
          this.spoils.splice(i, 1);
        }
      }
    }

    // 3. Golden Treasure Drone movement & projectile hit check
    if (this.dynamicEventsEnabled && !this.treasureDrone && this.elapsed >= this.nextDroneAt) {
      this.spawnTreasureDrone();
      this.nextDroneAt = this.elapsed + 48 + this.random() * 10;
    }
    if (this.treasureDrone) {
      const d = this.treasureDrone;
      if (d.hitFlash > 0) d.hitFlash = Math.max(0, d.hitFlash - dt * 6);
      d.x += d.vx * dt;
      d.y = GROUND_Y - 142 + Math.sin(this.elapsed * 4.2) * 7;
      for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
        const proj = this.projectiles[pIdx];
        if (proj.team !== 'player') continue;
        if (Math.abs(proj.x - d.x) <= 32 && Math.abs(proj.y - d.y) <= 68) {
          this.projectiles.splice(pIdx, 1);
          this.damageTreasureDrone(proj.damage);
          if (!this.treasureDrone) break;
        }
      }
      if (this.treasureDrone && (d.x < PLAYER_BASE_X + 40 || d.x > ENEMY_BASE_X - 40)) {
        this.treasureDrone = null;
      }
    }

    // 4. Live Tactical Bounty Directive progression
    if (this.dynamicEventsEnabled && !this.activeBounty && this.elapsed >= this.nextBountyAt) {
      this.spawnBattleBounty();
      this.nextBountyAt = this.elapsed + 44;
    }
    if (this.activeBounty) {
      const b = this.activeBounty;
      b.remainingSec = Math.max(0, b.remainingSec - dt);
      if (b.kind === 'combo') {
        if (this.player.comboCount > b.progress) {
          b.progress = Math.min(b.target, this.player.comboCount);
        }
        if (b.progress >= b.target) {
          this.completeBattleBounty();
          return;
        }
      } else if (b.kind === 'rift_hold' && this.activeRift) {
        let hasAllyInRift = false;
        for (let i = 0; i < this.units.length; i++) {
          const u = this.units[i];
          if (
            u.team === 'player' &&
            u.state !== 'dead' &&
            Math.abs(u.x - this.activeRift.x) <= this.activeRift.radius
          ) {
            hasAllyInRift = true;
            break;
          }
        }
        if (hasAllyInRift) {
          this.advanceBountyProgress(dt);
          if (!this.activeBounty) return;
        }
      }
      if (this.activeBounty && b.remainingSec <= 0) {
        this.activeBounty = null;
        this.nextBountyAt = this.elapsed + 26;
      }
    }
  }

  public spawnSupplyCrate(customX?: number): SupplyCrateEntity {
    const avgEra = Math.floor((this.player.eraIndex + this.enemy.eraIndex) * 0.5);
    const era = getEra(Math.max(this.player.eraIndex, avgEra));
    const maxHp = Math.round(95 + avgEra * 155 + avgEra * avgEra * 58);
    const goldReward = Math.round((era.units[2]?.cost ?? 45) * 1.65);
    const xpReward = Math.round(era.evolveXp > 0 ? era.evolveXp * 0.12 : 4200);
    const x =
      customX ??
      Math.round(WORLD_WIDTH * (0.42 + this.random() * 0.16));
    const crate: SupplyCrateEntity = {
      uid: this.nextUid++,
      x,
      y: 42,
      vy: 68,
      landed: false,
      hp: maxHp,
      maxHp,
      goldReward,
      xpReward,
      hitFlash: 0,
      life: 32,
      maxLife: 32,
    };
    this.supplyCrates.push(crate);
    this.callbacks.onBanner?.(
      '크로노 보급상자 투하!',
      `중앙 보급상자를 먼저 파괴해 +${goldReward.toLocaleString()}G & +${xpReward.toLocaleString()} XP 획득!`,
      '#facc15',
    );
    return crate;
  }

  private damageSupplyCrate(crate: SupplyCrateEntity, dmg: number, attackerTeam: Team): void {
    if (crate.hp <= 0) return;
    crate.hp = Math.max(0, crate.hp - Math.max(1, Math.round(dmg)));
    crate.hitFlash = 1;
    this.spawnBurst(crate.x, crate.y - 16, '#fde047', 6, 120);
    this.callbacks.onSound?.('melee_wood');

    if (crate.hp <= 0) {
      const winner = this.getFaction(attackerTeam);
      const crateRewardMult =
        getSupplyCrateRewardMult(winner.upgrades) * winner.mods.crateRewardMult;
      const feverGoldBonus = winner.feverTimer > 0 ? 1.25 + getFeverPowerBonus(winner.upgrades) : 1;
      const rewardGold = Math.round(crate.goldReward * crateRewardMult * feverGoldBonus);
      const rewardXp = Math.round(
        crate.xpReward *
          crateRewardMult *
          getXpMasteryMult(winner.upgrades) *
          winner.mods.xpMult,
      );
      winner.gold += rewardGold;
      winner.xp += rewardXp;
      winner.totalXp += rewardXp;

      this.spawnExplosion(crate.x, GROUND_Y - 14, 52, '#facc15');
      this.spawnRing(crate.x, GROUND_Y - 16, '#fef08a', 68);
      this.callbacks.onSound?.('crate_open');
      this.addPopup(
        crate.x,
        GROUND_Y - 56,
        `+${rewardGold.toLocaleString()}G`,
        '#facc15',
        1.28,
        'gold',
      );
      this.addPopup(
        crate.x + 18,
        GROUND_Y - 82,
        `+${rewardXp.toLocaleString()} XP`,
        '#38bdf8',
        1.16,
        'elemental',
      );
      if (attackerTeam === 'player') {
        this.callbacks.onBanner?.(
          '보급상자 확보!',
          `+${rewardGold.toLocaleString()}G · +${rewardXp.toLocaleString()} XP 획득`,
          '#facc15',
        );
      }
      const idx = this.supplyCrates.indexOf(crate);
      if (idx >= 0) this.supplyCrates.splice(idx, 1);
    }
  }

  private updateSupplyCrates(dt: number): void {
    if (this.elapsed >= this.nextSupplyCrateAt && this.supplyCrates.length === 0) {
      this.spawnSupplyCrate();
      const cdMult = getSupplyCrateCooldownMult(this.player.upgrades);
      this.nextSupplyCrateAt = this.elapsed + (36 + this.random() * 10) * cdMult;
    }

    for (let i = this.supplyCrates.length - 1; i >= 0; i--) {
      const c = this.supplyCrates[i];
      if (c.hitFlash > 0) c.hitFlash = Math.max(0, c.hitFlash - dt * 6);
      if (!c.landed) {
        c.y += c.vy * dt;
        if (c.y >= GROUND_Y) {
          c.y = GROUND_Y;
          c.vy = 0;
          c.landed = true;
          this.spawnDustWave(c.x, GROUND_Y, 0, 18, '#fef08a');
          this.spawnRing(c.x, GROUND_Y - 8, '#facc15', 38);
        }
      } else {
        c.life -= dt;
        if (c.life <= 0) {
          this.spawnSmoke(c.x, GROUND_Y - 12, 4);
          this.supplyCrates.splice(i, 1);
        }
      }
    }
  }

  private createFaction(team: Team, commanderId: CommanderId | null): FactionState {
    const era = ERAS[0];
    const isPlayer = team === 'player';
    const mods = computeFactionCombatMods({
      commanderId,
      relics: [],
      sanctuary: isPlayer ? this.playerSanctuary : undefined,
      mutators: this.mutators,
      isPlayer,
    });
    const aiStartBonus = team === 'enemy' ? DIFFICULTIES[this.difficulty].aiStartingGoldBonus : 0;
    const sanctuaryGoldBonus = isPlayer ? (this.playerSanctuary?.starting_gold ?? 0) * 30 : 0;
    const turretLegacyLv = isPlayer ? (this.playerSanctuary?.turret_legacy ?? 0) : 0;
    const starterRelicLv = isPlayer ? (this.playerSanctuary?.starter_relic ?? 0) : 0;
    const cmdMasteryLv = isPlayer ? (this.playerSanctuary?.command_mastery ?? 0) : 0;
    const cmdCdMult = Math.max(0.5, 1 - cmdMasteryLv * 0.035);
    const tacticalMax = commanderId
      ? Math.max(8, Math.round(COMMANDERS[commanderId].cooldown * cmdCdMult * 10) / 10)
      : 18;
    const scaledBaseHp = Math.round(era.baseMaxHp * mods.baseMaxHpMult);

    return {
      team,
      commanderId,
      relics: [],
      relicRerolls: isPlayer ? (starterRelicLv >= 3 ? 2 : 1) : 0,
      mods,
      rewindUsed: false,
      lastStandUsed: false,
      stormShotCounter: 0,
      bulwarkBeamTimer: 4.0,
      eraIndex: 0,
      gold: STARTING_GOLD + aiStartBonus + sanctuaryGoldBonus,
      xp: 0,
      totalXp: 0,
      baseHp: scaledBaseHp,
      baseMaxHp: scaledBaseHp,
      displayBaseHp: scaledBaseHp,
      turretSlots: turretLegacyLv >= 3 ? 2 : 1,
      turrets: [null, null, null, null],
      queue: [],
      upgrades: createInitialUpgrades(),
      tacticalCooldown: 0,
      tacticalMaxCooldown: tacticalMax,
      tacticalBuffTimer: 0,
      aegisProtectedTimer: 0,
      ultimateCooldown: 8, // brief opening cooldown so ultimate isn't wasted at 0:00
      ultimateMaxCooldown: Math.max(10, Math.round(era.ultimate.cooldown * mods.ultCooldownMult * 10) / 10),
      baseHitFlash: 0,
      evolveFlash: 0,
      upgradeFlash: 0,
      kills: 0,
      bossKills: 0,
      eliteKills: 0,
      unitsSpawned: 0,
      bountiesCleared: 0,
      dronesKilled: 0,
      spoilsTapped: 0,
      liveMedalsEarned: 0,
      comboCount: 0,
      comboTimer: 0,
      maxCombo: 0,
      feverKills: 0,
      feverTimer: 0,
      feverDuration: FEVER_DURATION_SEC,
    };
  }

  private advanceEndlessWave(gateBroken: boolean): void {
    this.wave += 1;
    this.endlessWaveTimer = 0;

    const targetEnemyEra = Math.min(ERAS.length - 1, Math.floor((this.wave - 1) / 1.5));
    if (targetEnemyEra > this.enemy.eraIndex) {
      this.enemy.eraIndex = targetEnemyEra;
      this.enemy.evolveFlash = 1;
    }

    const eEra = getEra(this.enemy.eraIndex);
    const waveBaseScale = 1 + (this.wave - 1) * 0.16;
    const nextEnemyMax = Math.round(
      eEra.baseMaxHp * getBaseMaxHpMult(this.enemy.upgrades) * this.enemy.mods.baseMaxHpMult * waveBaseScale,
    );
    this.enemy.baseMaxHp = nextEnemyMax;
    if (gateBroken) {
      this.enemy.baseHp = nextEnemyMax;
      this.enemy.displayBaseHp = nextEnemyMax;
      this.enemy.lastStandUsed = false;

      const pEra = getEra(this.player.eraIndex);
      const breakGold = Math.round((pEra.units[2]?.cost ?? 50) * 2.2 * this.player.mods.killGoldMult);
      const breakXp = Math.round(
        (pEra.evolveXp > 0 ? pEra.evolveXp * 0.34 : 6500) * this.player.mods.xpMult,
      );
      const fortHeal = Math.round(this.player.baseMaxHp * 0.12);
      this.player.gold += breakGold;
      this.player.xp += breakXp;
      this.player.totalXp += breakXp;
      this.player.baseHp = Math.min(this.player.baseMaxHp, this.player.baseHp + fortHeal);
      this.player.displayBaseHp = Math.max(this.player.displayBaseHp, this.player.baseHp);

      this.spawnBaseDestruction(ENEMY_BASE_X);
      this.callbacks.onSound?.('fever');
      this.addPopup(ENEMY_BASE_X - 60, GROUND_Y - 148, `WAVE BREAK! +${breakGold}G`, '#facc15', 1.35, 'gold');
      this.callbacks.onBanner?.(
        `차원문 돌파 성공! WAVE ${this.wave}`,
        `돌파 보너스 +${breakGold.toLocaleString()}G · +${breakXp.toLocaleString()} XP · 아군 성채 수리!`,
        '#2dd4bf',
      );
    } else {
      this.enemy.baseHp = Math.min(nextEnemyMax, this.enemy.baseHp + Math.round(nextEnemyMax * 0.2));
      this.enemy.displayBaseHp = Math.max(this.enemy.displayBaseHp, this.enemy.baseHp);
      this.callbacks.onBanner?.(
        `무한 웨이브 WAVE ${this.wave}`,
        `적 차원문 공세 강화 · 시대 ${eEra.eraNumber} 병력 투입!`,
        '#a855f7',
      );
    }

    // Grant enemy surge gold for the new wave
    this.enemy.gold += (eEra.units[1]?.cost ?? 35) * (1.6 + this.wave * 0.12);

    if (this.wave % 5 === 0) {
      this.spawnSpecialUnit('enemy', 'boss');
    } else if (this.wave >= 2) {
      this.spawnSpecialUnit('enemy', 'elite');
    }

    if (this.wave % 3 === 0) {
      this.offerRelicDraft();
    }
  }

  private updateChronoRifts(dt: number): void {
    if (this.activeRift) {
      this.activeRift.life -= dt;
      if (this.activeRift.life <= 0) {
        this.activeRift = null;
        const baseGap = this.mutators.includes('rift_overdrive') ? 13 : 26;
        this.nextRiftAt = this.elapsed + baseGap + this.random() * 6;
      }
    } else if (this.elapsed >= this.nextRiftAt) {
      this.spawnChronoRift();
    }
  }

  private updateAutoSpawn(dt: number): void {
    if (!this.autoSpawn || this.player.queue.length > 0) return;
    this.autoSpawnThinkTimer -= dt;
    if (this.autoSpawnThinkTimer > 0) return;
    this.autoSpawnThinkTimer = 0.25;

    if (this.getActiveUnitCount('player') >= this.getMaxUnitCap('player')) return;

    const era = getEra(this.player.eraIndex);
    const units = era.units;
    let frontline = 0;
    let backline = 0;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.team !== 'player' || u.state === 'dead') continue;
      if (u.def.role === 'melee' || u.def.role === 'heavy') frontline++;
      else backline++;
    }

    const costOf = (u: UnitDef) => this.getEffectiveUnitCost('player', u.cost);
    const topUnit = units[units.length - 1];
    const tier3Unit = units[Math.min(units.length - 1, 2)];

    // Save briefly for heavy/siege powerhouses once frontline is established
    if (
      frontline >= 2 &&
      this.player.gold < costOf(topUnit) &&
      this.player.gold >= costOf(topUnit) * 0.65
    ) {
      return;
    }

    let desired: UnitDef | null = null;
    if (frontline === 0) {
      desired = this.player.gold >= costOf(tier3Unit) && (tier3Unit.role === 'heavy' || tier3Unit.role === 'melee')
        ? tier3Unit
        : units[0];
    } else if (this.player.gold >= costOf(topUnit) && (frontline + backline >= 2 || this.random() < 0.5)) {
      desired = topUnit;
    } else if (backline < frontline && this.player.gold >= costOf(units[1])) {
      desired = units[1];
    } else if (this.player.gold >= costOf(tier3Unit)) {
      desired = tier3Unit;
    } else if (this.player.gold >= costOf(units[0])) {
      desired = units[0];
    }

    if (desired && this.player.gold >= costOf(desired)) {
      this.enqueueUnit('player', desired.id);
    }
  }

  private stepInternal(dt: number): void {
    this.elapsed += dt;

    // Sanctuary rift bonus gold if controlling midfield sanctuary zone
    let playerInSanctuary = false;
    let enemyInSanctuary = false;
    if (this.activeRift && this.activeRift.kind === 'sanctuary') {
      const rx = this.activeRift.x;
      const rr = this.activeRift.radius;
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        if (u.state === 'dead') continue;
        if (Math.abs(u.x - rx) <= rr) {
          if (u.team === 'player') playerInSanctuary = true;
          else enemyInSanctuary = true;
        }
      }
    }

    // 1. Passive income (scaled by Economy + Relics/Commander/Sanctuary + Chrono Fever), cooldowns, flash decay
    const diff = DIFFICULTIES[this.difficulty];
    const pEra = getEra(this.player.eraIndex);
    const eEra = getEra(this.enemy.eraIndex);

    const pFeverGold = this.player.feverTimer > 0 ? 1.25 + getFeverPowerBonus(this.player.upgrades) : 1;
    const eFeverGold = this.enemy.feverTimer > 0 ? 1.25 + getFeverPowerBonus(this.enemy.upgrades) : 1;
    const pRiftGold = playerInSanctuary ? 1.25 : 1;
    const eRiftGold = enemyInSanctuary ? 1.25 : 1;

    this.player.gold +=
      pEra.passiveGoldPerSec *
      getGoldIncomeMult(this.player.upgrades) *
      this.player.mods.passiveGoldMult *
      pFeverGold *
      pRiftGold *
      dt;
    this.enemy.gold +=
      eEra.passiveGoldPerSec *
      diff.aiGoldMultiplier *
      getGoldIncomeMult(this.enemy.upgrades) *
      this.enemy.mods.passiveGoldMult *
      eFeverGold *
      eRiftGold *
      dt;

    this.updateFactionTimers(this.player, dt);
    this.updateFactionTimers(this.enemy, dt);
    this.updateChronoRifts(dt);

    // Periodic Elite Champion spawns to keep midfield rewards exciting
    if (this.elapsed >= this.nextEliteAt) {
      if (this.getActiveUnitCount('enemy') < this.getMaxUnitCap('enemy')) {
        this.spawnSpecialUnit('enemy', 'elite');
      }
      const gap = this.mode === 'endless' ? 24 : 42;
      this.nextEliteAt = this.elapsed + gap + this.random() * 8;
    }

    // Endless mode wave progression timer
    if (this.mode === 'endless') {
      this.endlessWaveTimer += dt;
      if (this.endlessWaveTimer >= 28) {
        this.advanceEndlessWave(false);
      }
    }

    if (this.eraTransition.active) {
      this.eraTransition.progress = Math.min(1, this.eraTransition.progress + dt * 1.1);
      if (this.eraTransition.progress >= 1) {
        this.eraTransition.active = false;
      }
    }

    // 2. Auto-Spawn assist, Production queues & Midfield Supply Crates
    this.updateAutoSpawn(dt);
    this.updateQueue(this.player, dt);
    this.updateQueue(this.enemy, dt);
    this.updateSupplyCrates(dt);

    // 3. Enemy AI decision step
    this.ai.update(this, dt);

    // 4. Units movement & combat
    this.updateUnits(dt);

    // 5. Base turrets
    this.updateTurrets(this.player, dt);
    this.updateTurrets(this.enemy, dt);

    // 6. Projectiles, beams, ultimates & dynamic battlefield events (frontline, spoils, drone, bounty)
    this.updateProjectiles(dt);
    this.updateUltimates(dt);
    this.updateEffects(dt);
    this.updateDynamicBattleEvents(dt);

    // 7. Win / Loss / Endless Wave Break resolution
    if (this.enemy.baseHp <= 0) {
      if (this.mode === 'endless') {
        this.advanceEndlessWave(true);
      } else {
        this.enemy.baseHp = 0;
        this.status = 'victory';
        this.spawnBaseDestruction(ENEMY_BASE_X);
        this.callbacks.onSound?.('victory');
      }
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
    if (f.tacticalCooldown > 0) {
      f.tacticalCooldown = Math.max(0, f.tacticalCooldown - dt);
    }
    if (f.tacticalBuffTimer > 0) {
      f.tacticalBuffTimer = Math.max(0, f.tacticalBuffTimer - dt);
    }
    if (f.aegisProtectedTimer > 0) {
      f.aegisProtectedTimer = Math.max(0, f.aegisProtectedTimer - dt);
    }
    if (f.feverTimer > 0) {
      f.feverTimer = Math.max(0, f.feverTimer - dt);
    }
    if (f.comboTimer > 0) {
      f.comboTimer = Math.max(0, f.comboTimer - dt);
      if (f.comboTimer <= 0) {
        f.comboCount = 0;
      }
    }
    if (f.mods.baseRegenPerSec > 0 && f.baseHp > 0 && f.baseHp < f.baseMaxHp) {
      f.baseHp = Math.min(f.baseMaxHp, f.baseHp + f.baseMaxHp * f.mods.baseRegenPerSec * dt);
    }
    // Bulwark 3-Set Synergy: Fortress fires an automatic Astral Judgement Beam every 8s!
    if (f.mods.bulwarkTier >= 3 && f.baseHp > 0) {
      f.bulwarkBeamTimer -= dt;
      if (f.bulwarkBeamTimer <= 0) {
        const baseX = f.team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
        const dir = f.team === 'player' ? 1 : -1;
        let closestEnemy: UnitEntity | null = null;
        let closestDist = 860;
        for (let i = 0; i < this.units.length; i++) {
          const u = this.units[i];
          if (u.team === f.team || u.state === 'dead') continue;
          const d = (u.x - baseX) * dir;
          if (d >= -20 && d <= closestDist) {
            closestDist = d;
            closestEnemy = u;
          }
        }
        if (closestEnemy) {
          f.bulwarkBeamTimer = 8.0;
          const era = getEra(f.eraIndex);
          const beamDmg = Math.round(
            (era.units[2]?.damage ?? 30) * 2.35 * getWeaponDamageMult(f.upgrades) * f.mods.damageMult,
          );
          const tx = closestEnemy.x;
          const ty = GROUND_Y - closestEnemy.def.height * 0.65;
          this.beams.push({
            uid: this.nextUid++,
            team: f.team,
            style: 'chrono_beam',
            x1: baseX + dir * 24,
            y1: GROUND_Y - 148,
            x2: tx,
            y2: ty,
            width: 9,
            color: '#4ade80',
            life: 0.38,
            maxLife: 0.38,
            seed: this.random() * 100,
          });
          this.spawnFlashStar(tx, ty, '#86efac', 26);
          this.spawnRing(tx, GROUND_Y - 10, '#4ade80', 46);
          this.applySplashDamage(tx, f.team, beamDmg, 54, true, true, dir * 32);
          if (f.team === 'player') {
            this.callbacks.onSound?.('laser');
          }
        } else {
          f.bulwarkBeamTimer = 1.2;
        }
      }
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
    if (head.remaining <= 0 && this.getActiveUnitCount(f.team) < this.getMaxUnitCap(f.team)) {
      f.queue.shift();
      const unitDef = UNIT_BY_ID[head.unitId];
      const spawned = this.spawnUnit(f.team, unitDef);
      // Imperial 3-Set Synergy: every 6th trained unit deploys a free Twin Escort!
      if (
        f.mods.imperialTier >= 3 &&
        f.unitsSpawned % 6 === 0 &&
        this.getActiveUnitCount(f.team) < this.getMaxUnitCap(f.team)
      ) {
        const dir = f.team === 'player' ? 1 : -1;
        const twin = this.spawnUnit(f.team, unitDef);
        twin.x = spawned.x - dir * 18;
        twin.upgradeFlash = 1;
        if (f.team === 'player') {
          this.addPopup(twin.x, GROUND_Y - 96, '👑 쌍둥이 호위 출격!', '#facc15', 1.16, 'crit');
          this.spawnRing(twin.x, GROUND_Y - 24, '#facc15', 42);
        }
      }
    }
  }

  public spawnUnit(team: Team, def: UnitDef, specialKind?: 'elite' | 'boss'): UnitEntity {
    const faction = this.getFaction(team);
    const spawnX = team === 'player' ? PLAYER_SPAWN_X : ENEMY_SPAWN_X;
    const jitter = (this.random() - 0.5) * 6;
    const statMult = team === 'enemy' ? DIFFICULTIES[this.difficulty].aiUnitStatMult : 1;
    const endlessEnemyScale =
      this.mode === 'endless' && team === 'enemy'
        ? 1 + Math.max(0, this.wave - 1) * 0.08 + Math.max(0, this.wave - 12) * 0.12
        : 1;
    const vetSpawnChance = getVeteranSpawnChance(faction.upgrades) + faction.mods.vetSpawnBonus;
    const initialVetRank: 0 | 1 | 2 | 3 =
      specialKind === 'boss'
        ? 2
        : specialKind === 'elite'
          ? 1
          : vetSpawnChance > 0 && this.random() < vetSpawnChance
            ? 1
            : 0;
    const baseVetMult = getVeteranStatMult(initialVetRank, faction.upgrades);
    const vetHpMult = 1 + (baseVetMult - 1) * faction.mods.vetStatBonusMult;
    const eliteHpMult = specialKind === 'boss' ? 4.2 : specialKind === 'elite' ? 2.2 : 1;
    const scaledMaxHp = Math.round(
      def.maxHp *
        getArmorHpMult(faction.upgrades) *
        faction.mods.maxHpMult *
        vetHpMult *
        statMult *
        eliteHpMult *
        endlessEnemyScale,
    );
    const baseShieldRatio = getVanguardShieldRatio(faction.upgrades) + faction.mods.shieldBonusRatio;
    const specialShieldRatio = specialKind === 'boss' ? 0.25 : specialKind === 'elite' ? 0.14 : 0;
    const maxShield = Math.round(scaledMaxHp * Math.max(baseShieldRatio, specialShieldRatio));
    const era = getEra(def.eraIndex);

    const unit: UnitEntity = {
      uid: this.nextUid++,
      team,
      def,
      x: spawnX + jitter,
      y: GROUND_Y,
      hp: scaledMaxHp,
      maxHp: scaledMaxHp,
      shield: maxShield,
      maxShield,
      displayHp: scaledMaxHp,
      displayHpHold: 0,
      state: 'walk',
      attackCooldown: 0.15,
      attackAnim: 0,
      walkPhase: this.random() * Math.PI * 2,
      hitFlash: 0,
      lastHitCrit: false,
      upgradeFlash: initialVetRank > 0 || specialKind !== undefined ? 0.9 : 0,
      knockbackVel: 0,
      deathTimer: 0,
      kills: initialVetRank === 2 ? 3 : initialVetRank === 1 ? 1 : 0,
      vetRank: initialVetRank,
      eliteKind: specialKind,
      eliteTitle:
        specialKind === 'boss'
          ? `시대 ${era.roman} 수호군주`
          : specialKind === 'elite'
            ? '시공 정예병'
            : undefined,
      scaleMult: specialKind === 'boss' ? 1.35 : specialKind === 'elite' ? 1.18 : 1,
      damageScale:
        (specialKind === 'boss' ? 1.42 : specialKind === 'elite' ? 1.24 : 1) * endlessEnemyScale,
      rewardMult: specialKind === 'boss' ? 4.5 : specialKind === 'elite' ? 2.4 : 1,
      slowTimer: 0,
      imperialHalo: faction.mods.imperialTier >= 2 && initialVetRank >= 1,
      bulwarkHex: faction.mods.bulwarkTier >= 2 && maxShield > 0,
      berserkerAura: false,
    };
    this.units.push(unit);
    faction.unitsSpawned += 1;
    return unit;
  }

  private updateUnits(dt: number): void {
    // Separate live units by team sorted from front to back using pre-allocated scratch buffers (zero GC)
    const playerLive = this.scratchPlayerLive;
    const enemyLive = this.scratchEnemyLive;
    playerLive.length = 0;
    enemyLive.length = 0;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.state === 'dead') continue;
      if (u.team === 'player') playerLive.push(u);
      else enemyLive.push(u);
    }
    playerLive.sort((a, b) => b.x - a.x);
    enemyLive.sort((a, b) => a.x - b.x);

    const rift = this.activeRift;
    const riftBoost = this.mutators.includes('rift_overdrive') ? 1.35 : 1;

    const stepTeam = (allies: UnitEntity[], enemies: UnitEntity[], team: Team): void => {
      const dir = team === 'player' ? 1 : -1;
      const enemyBaseFront = team === 'player' ? ENEMY_BASE_FRONT_X : PLAYER_BASE_FRONT_X;
      const teamFaction = this.getFaction(team);
      const feverOn = teamFaction.feverTimer > 0;
      const feverPower = feverOn ? getFeverPowerBonus(teamFaction.upgrades) : 0;
      const tacBuffOn = teamFaction.tacticalBuffTimer > 0;
      const atkSpdMult =
        getAttackSpeedMult(teamFaction.upgrades) *
        teamFaction.mods.attackSpeedMult *
        (feverOn ? 1.25 + feverPower : 1) *
        (tacBuffOn ? 1.35 : 1);
      const moveSpdMult =
        getMoveSpeedMult(teamFaction.upgrades) *
        teamFaction.mods.moveSpeedMult *
        (feverOn ? 1.2 + feverPower * 0.6 : 1) *
        (tacBuffOn ? 1.3 : 1);
      const rangeMult = getRangeMult(teamFaction.upgrades);
      const baseRegenRate = getRegenRatePerSec(teamFaction.upgrades) + teamFaction.mods.regenBonusPerSec;

      for (let i = 0; i < allies.length; i++) {
        const u = allies[i];
        if (u.hitFlash > 0) u.hitFlash = Math.max(0, u.hitFlash - dt * 6.5);
        if (u.upgradeFlash > 0) u.upgradeFlash = Math.max(0, u.upgradeFlash - dt * 1.9);
        if (u.attackCooldown > 0) u.attackCooldown = Math.max(0, u.attackCooldown - dt);
        if (u.attackAnim > 0) u.attackAnim = Math.max(0, u.attackAnim - dt * 3.4);
        if (u.slowTimer && u.slowTimer > 0) u.slowTimer = Math.max(0, u.slowTimer - dt);

        const inRift = rift !== null && Math.abs(u.x - rift.x) <= rift.radius;
        const unitSlowMult = u.slowTimer && u.slowTimer > 0 ? 0.72 : 1;
        const riftAtkSpd = inRift && rift!.kind === 'haste' ? 1 + 0.35 * riftBoost : 1;
        const riftMoveSpd = inRift && rift!.kind === 'haste' ? 1 + 0.32 * riftBoost : 1;
        const regenRate =
          baseRegenRate + (inRift && rift!.kind === 'sanctuary' ? 0.055 * riftBoost : 0);

        // Battlefield Regeneration / Sanctuary Rift heals wounded allied units steadily
        if (regenRate > 0 && u.hp < u.maxHp) {
          u.hp = Math.min(u.maxHp, u.hp + u.maxHp * regenRate * dt);
          if (this.random() < dt * 1.6) {
            this.particles.push({
              x: u.x + (this.random() - 0.5) * 16,
              y: GROUND_Y - u.def.height * 0.65 - (u.def.hoverHeight ?? 0),
              vx: (this.random() - 0.5) * 14,
              vy: -32 - this.random() * 18,
              size: 3.4,
              color: '#4ade80',
              alpha: 0.9,
              life: 0.35,
              maxLife: 0.35,
              gravity: -12,
              shape: 'circle',
            });
          }
        }

        // Berserk Fury crimson aura sparks on wounded fighters!
        if (teamFaction.upgrades.berserk_fury > 0 && u.hp / Math.max(1, u.maxHp) <= 0.58 && this.random() < dt * 2.6) {
          this.particles.push({
            x: u.x + (this.random() - 0.5) * 18,
            y: GROUND_Y - u.def.height * 0.55 - (u.def.hoverHeight ?? 0),
            vx: (this.random() - 0.5) * 20,
            vy: -42 - this.random() * 24,
            size: 3.2,
            color: '#f43f5e',
            alpha: 0.88,
            life: 0.3,
            maxLife: 0.3,
            gravity: -18,
            shape: 'spark',
          });
        }

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
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          const dist = (e.x - u.x) * dir - (e.def.width + u.def.width) * 0.45;
          if (dist >= -24 && dist < minEnemyDist) {
            minEnemyDist = dist;
            target = e;
          }
        }

        // Find closest landed Midfield Chrono Supply Crate in front!
        let targetCrate: SupplyCrateEntity | null = null;
        let minCrateDist = Infinity;
        for (let cIdx = 0; cIdx < this.supplyCrates.length; cIdx++) {
          const c = this.supplyCrates[cIdx];
          if (!c.landed || c.hp <= 0) continue;
          const dist = (c.x - u.x) * dir - (30 + u.def.width) * 0.45;
          if (dist >= -20 && dist < minCrateDist) {
            minCrateDist = dist;
            targetCrate = c;
          }
        }

        const isRangedUnit =
          u.def.role === 'ranged' || u.def.role === 'siege' || u.def.projectile !== undefined;
        const effectiveRange = isRangedUnit ? u.def.range * rangeMult : u.def.range;
        const distToEnemyBase = (enemyBaseFront - u.x) * dir - u.def.width * 0.5;
        const inRangeOfUnit = target !== null && minEnemyDist <= effectiveRange;
        const inRangeOfCrate = targetCrate !== null && minCrateDist <= effectiveRange;
        const inRangeOfBase = distToEnemyBase <= effectiveRange;

        if (inRangeOfUnit || inRangeOfCrate || inRangeOfBase) {
          u.state = 'attack';
          // Subtle combat-stance breathing/cape sway between strikes
          u.walkPhase += dt * 2.2;
          if (u.attackCooldown <= 0) {
            const hpRatio = u.hp / Math.max(1, u.maxHp);
            const berserkSpd = getBerserkAttackSpeedMult(teamFaction.upgrades, hpRatio);
            const hitCrateFirst = inRangeOfCrate && (!inRangeOfUnit || minCrateDist <= minEnemyDist + 16);
            if (hitCrateFirst && targetCrate) {
              const baseVet = getVeteranStatMult(u.vetRank, teamFaction.upgrades);
              const vetMult = 1 + (baseVet - 1) * teamFaction.mods.vetStatBonusMult;
              const berserkDmg = getBerserkDamageMult(teamFaction.upgrades, hpRatio);
              const crateDmg =
                u.def.damage *
                getWeaponDamageMult(teamFaction.upgrades) *
                teamFaction.mods.damageMult *
                (u.damageScale ?? 1) *
                vetMult *
                berserkDmg;
              this.callbacks.onSound?.(u.def.attackSound);
              if (!u.def.projectile) {
                this.spawnMeleeSlash(u, u.x + dir * (u.def.width * 0.6), GROUND_Y - u.def.height * 0.72, dir, false);
              }
              this.damageSupplyCrate(targetCrate, crateDmg, team);
            } else {
              this.performUnitAttack(u, inRangeOfUnit ? target : null);
            }
            u.attackCooldown =
              1 / (u.def.attackRate * atkSpdMult * berserkSpd * riftAtkSpd * unitSlowMult);
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
            // Keep waiting units gently breathing & fluttering capes/hover plumes
            u.walkPhase += dt * 2.8;
          } else {
            u.state = 'walk';
            const effSpeed = u.def.speed * moveSpdMult * riftMoveSpd * unitSlowMult;
            const moveDist = effSpeed * dt;
            let nextX = u.x + moveDist * dir;
            // Don't walk past closest enemy unit, landed crate, or enemy base
            if (target) {
              const stopX = target.x - dir * ((target.def.width + u.def.width) * 0.48);
              nextX = dir === 1 ? Math.min(nextX, stopX) : Math.max(nextX, stopX);
            }
            if (targetCrate) {
              const crateStop = targetCrate.x - dir * ((30 + u.def.width) * 0.48);
              nextX = dir === 1 ? Math.min(nextX, crateStop) : Math.max(nextX, crateStop);
            }
            const baseStop = enemyBaseFront - dir * (u.def.width * 0.5 + 4);
            nextX = dir === 1 ? Math.min(nextX, baseStop) : Math.max(nextX, baseStop);
            u.x = nextX;
            const prevStep = Math.floor(u.walkPhase / Math.PI);
            u.walkPhase += dt * (effSpeed * 0.16);
            // Heavy war-machines & cavalry kick up subtle road dust as they stride!
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
    const hpRatio = attacker.hp / Math.max(1, attacker.maxHp);
    const inFuryRift =
      this.activeRift !== null &&
      this.activeRift.kind === 'fury' &&
      Math.abs(attacker.x - this.activeRift.x) <= this.activeRift.radius;
    const riftBoost = this.mutators.includes('rift_overdrive') ? 1.35 : 1;
    const furyCritBonus = inFuryRift ? 0.22 * riftBoost : 0;
    const furyDmgMult = inFuryRift ? 1 + 0.28 * riftBoost : 1;

    const critChance = Math.min(
      0.9,
      def.critChance + getCritChanceBonus(attackerFaction.upgrades) + furyCritBonus,
    );
    const critMult = CRIT_MULTIPLIER + getCritDamageBonus(attackerFaction.upgrades);
    const isCrit = this.random() < critChance;
    const baseVetMult = getVeteranStatMult(attacker.vetRank, attackerFaction.upgrades);
    const vetDamageMult = 1 + (baseVetMult - 1) * attackerFaction.mods.vetStatBonusMult;
    const berserkDamageMult = getBerserkDamageMult(attackerFaction.upgrades, hpRatio);
    const berserkerSynMult =
      attackerFaction.mods.berserkerTier >= 2 && hpRatio <= 0.75 ? 1.16 : 1;
    attacker.berserkerAura = attackerFaction.mods.berserkerTier >= 2 && hpRatio <= 0.75;
    const bloodOathMult =
      attackerFaction.mods.bloodOathLowHpBonus > 0 && hpRatio <= 0.5
        ? 1 + attackerFaction.mods.bloodOathLowHpBonus
        : 1;
    const aiDmgMult = attacker.team === 'enemy' ? DIFFICULTIES[this.difficulty].aiUnitStatMult : 1;
    const rawDamage =
      def.damage *
      getWeaponDamageMult(attackerFaction.upgrades) *
      attackerFaction.mods.damageMult *
      (attacker.damageScale ?? 1) *
      vetDamageMult *
      berserkDamageMult *
      berserkerSynMult *
      bloodOathMult *
      furyDmgMult *
      aiDmgMult *
      (isCrit ? critMult : 1);
    const rangeMult = getRangeMult(attackerFaction.upgrades);
    const projSpeedMult =
      getProjectileSpeedMult(attackerFaction.upgrades) * attackerFaction.mods.projectileSpeedMult;
    const splashMult = getSplashRadiusMult(attackerFaction.upgrades);
    const bonusSplashPx = attackerFaction.mods.splashBonusPx;
    const effUnitSplash =
      def.splashRadius > 0 ? (def.splashRadius + bonusSplashPx) * splashMult : 0;
    const isRangedUnit = def.role === 'ranged' || def.role === 'siege' || def.projectile !== undefined;
    const effRange = isRangedUnit ? def.range * rangeMult : def.range;

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

    // Storm 3-Set Synergy: every 5th ranged attack calls down an Orbital Sky Lightning Bolt!
    if (isRangedUnit && attackerFaction.mods.stormTier >= 3 && target) {
      attackerFaction.stormShotCounter += 1;
      if (attackerFaction.stormShotCounter % 5 === 0) {
        this.beams.push({
          uid: this.nextUid++,
          team: attacker.team,
          style: 'lightning',
          x1: target.x + (this.random() - 0.5) * 24,
          y1: -24,
          x2: target.x,
          y2: targetY,
          width: 7,
          color: '#38bdf8',
          life: 0.28,
          maxLife: 0.28,
          seed: this.random() * 100,
        });
        this.spawnFlashStar(target.x, targetY, '#67e8f9', 24);
        this.applyDamageToUnit(
          target,
          Math.max(4, Math.round(rawDamage * 0.55)),
          true,
          false,
          0,
          attacker.team,
          attacker,
        );
      }
    }

    // Instant Railgun, Interstellar Graviton, Transcendent Chrono-Prism, or Industrial Tesla Arc piercing beam
    if (
      def.projectile === 'railgun' ||
      def.projectile === 'gravity_beam' ||
      def.projectile === 'chrono_beam' ||
      def.projectile === 'tesla_arc'
    ) {
      const isGrav = def.projectile === 'gravity_beam';
      const isChrono = def.projectile === 'chrono_beam';
      const isTesla = def.projectile === 'tesla_arc';
      const endX = target && isTesla ? target.x : originX + dir * (effRange + 45);
      const endY = target && isTesla ? targetY : originY;
      const beamStyle = isChrono ? 'chrono_beam' : isGrav ? 'gravity_beam' : isTesla ? 'tesla_arc' : 'railgun';
      this.beams.push({
        uid: this.nextUid++,
        team: attacker.team,
        style: beamStyle,
        x1: originX,
        y1: originY,
        x2: endX,
        y2: endY,
        width: isChrono ? 9 : isGrav ? 7 : isTesla ? 6 : 5,
        color: isChrono
          ? '#2dd4bf'
          : isGrav
            ? '#c084fc'
            : isTesla
              ? '#38bdf8'
              : attacker.team === 'player'
                ? '#38bdf8'
                : '#fb7185',
        life: isChrono ? 0.32 : isGrav ? 0.28 : isTesla ? 0.26 : 0.24,
        maxLife: isChrono ? 0.32 : isGrav ? 0.28 : isTesla ? 0.26 : 0.24,
        seed: this.random() * 100,
      });

      const procMultishot =
        attackerFaction.mods.multishotChance > 0 &&
        this.random() < attackerFaction.mods.multishotChance;
      if (procMultishot) {
        this.beams.push({
          uid: this.nextUid++,
          team: attacker.team,
          style: beamStyle,
          x1: originX,
          y1: originY - 8,
          x2: endX,
          y2: endY - 5,
          width: 4,
          color: '#2dd4bf',
          life: 0.22,
          maxLife: 0.22,
          seed: this.random() * 100,
        });
      }
      const beamDmg = procMultishot ? rawDamage * 1.45 : rawDamage;

      const beamCol = isChrono ? '#5eead4' : isGrav ? '#e879f9' : '#7dd3fc';
      this.spawnMuzzleFlash(originX, originY, Math.atan2(endY - originY, endX - originX), beamCol, isChrono ? 18 : 14);
      this.spawnBurst(originX, originY, beamCol, 6, 110);

      // Pierce up to def.pierceCount enemies along beam (using scratch buffer)
      const hitCandidates = this.scratchHitCandidates;
      hitCandidates.length = 0;
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        if (u.team === attacker.team || u.state === 'dead') continue;
        const rel = (u.x - originX) * dir;
        if (rel >= -10 && rel <= effRange + 45) {
          hitCandidates.push(u);
        }
      }
      hitCandidates.sort((a, b) => (a.x - originX) * dir - (b.x - originX) * dir);

      let hits = 0;
      let prevArcX = originX;
      let prevArcY = originY;
      for (const victim of hitCandidates) {
        if (isTesla && hits > 0) {
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
        this.spawnImpactCross(prevArcX, prevArcY, beamCol, isChrono ? 28 : 22);
        if (isChrono && effUnitSplash > 0 && hits === 0) {
          this.applySplashDamage(
            victim.x,
            attacker.team,
            beamDmg,
            effUnitSplash,
            def.armorPierce,
            isCrit,
            dir * def.knockback,
            attacker,
          );
          this.spawnExplosion(victim.x, prevArcY, def.splashRadius * 0.85, '#2dd4bf');
        } else {
          this.applyDamageToUnit(victim, beamDmg, def.armorPierce, isCrit, dir * def.knockback, attacker.team, attacker);
        }
        hits++;
        if (hits >= def.pierceCount) break;
      }
      if (hits === 0 && !target) {
        this.applyDamageToBase(
          attacker.team === 'player' ? 'enemy' : 'player',
          beamDmg * def.baseDamageMult,
          isCrit,
          attacker.team,
        );
      }
      return;
    }

    // Flamethrower jet: cone blast hitting enemies in range
    if (def.projectile === 'flame') {
      const endX = originX + dir * (effRange + 15);
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
      this.spawnMuzzleFlash(originX, originY, dir === 1 ? 0 : Math.PI, '#fb923c', 14);
      for (let p = 0; p < 5; p++) {
        this.particles.push({
          x: originX + dir * (10 + this.random() * effRange * 0.7),
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
        if (rel >= -10 && rel <= effRange + 28) {
          this.applyDamageToUnit(victim, rawDamage, def.armorPierce, isCrit, dir * def.knockback, attacker.team, attacker);
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

    // Ranged Projectile (+ Prism Split multishot relic & Storm electrified plasma trail!)
    const isElectrified = attackerFaction.mods.stormTier >= 2;
    if (def.projectile) {
      const speed = (def.projectileSpeed ?? 420) * projSpeedMult;
      const gravity = def.projectileArc ?? 200;
      const dx = targetX - originX;
      const dy = targetY - originY;
      const flightTime = Math.max(0.11, Math.abs(dx) / speed);
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
        splashRadius: effUnitSplash,
        armorPierce: def.armorPierce,
        isCrit,
        electrified: isElectrified,
        baseDamageMult: def.baseDamageMult,
        knockback: def.knockback,
        pierceRemaining: def.pierceCount,
        hitUids: [],
        life: 0,
        maxLife: Math.min(3.5, flightTime + 0.8),
        targetX,
        sourceUnitUid: attacker.uid,
      });

      // Prism Split Relic: fires a parallel-timeline twin projectile!
      if (
        attackerFaction.mods.multishotChance > 0 &&
        this.random() < attackerFaction.mods.multishotChance
      ) {
        const twinFlight = flightTime * 1.07;
        const twinDx = dx + dir * 18;
        this.projectiles.push({
          uid: this.nextUid++,
          team: attacker.team,
          style: def.projectile,
          x: originX,
          y: originY - 6,
          prevX: originX,
          prevY: originY - 6,
          vx: twinDx / twinFlight,
          vy: (dy - 0.5 * gravity * twinFlight * twinFlight) / twinFlight - 14,
          gravity,
          damage: rawDamage * 0.65,
          splashRadius: effUnitSplash,
          armorPierce: def.armorPierce,
          isCrit,
          electrified: isElectrified,
          baseDamageMult: def.baseDamageMult,
          knockback: def.knockback * 0.6,
          pierceRemaining: def.pierceCount,
          hitUids: [],
          life: 0,
          maxLife: Math.min(3.5, twinFlight + 0.8),
          targetX: targetX + dir * 18,
          sourceUnitUid: attacker.uid,
        });
      }

      // Directional weapon-matched muzzle flash & gunsmoke for guns, artillery, rockets & energy weapons!
      const fireAngle = Math.atan2(vy, vx);
      if (
        def.projectile === 'bullet' ||
        def.projectile === 'cannonball' ||
        def.projectile === 'shell' ||
        def.projectile === 'mortar_shell' ||
        def.projectile === 'rocket' ||
        def.projectile === 'dragon_rocket'
      ) {
        const isHeavyShot =
          def.projectile === 'cannonball' ||
          def.projectile === 'shell' ||
          def.projectile === 'mortar_shell' ||
          def.projectile === 'rocket';
        this.spawnMuzzleFlash(
          originX,
          originY,
          fireAngle,
          def.projectile === 'dragon_rocket' ? '#f43f5e' : '#fbbf24',
          isHeavyShot ? 19 : 13,
        );
        this.spawnBurst(originX, originY, '#fde68a', isHeavyShot ? 7 : 5, isHeavyShot ? 105 : 80);
        this.spawnSmoke(originX, originY, isHeavyShot ? 4 : 2);
      } else if (
        def.projectile === 'plasma' ||
        def.projectile === 'quantum_orb' ||
        def.projectile === 'antimatter' ||
        def.projectile === 'solar_orb' ||
        def.projectile === 'totem_fire'
      ) {
        const flashCol =
          def.projectile === 'quantum_orb'
            ? '#2dd4bf'
            : def.projectile === 'antimatter'
              ? '#c084fc'
              : def.projectile === 'plasma'
                ? attacker.team === 'player'
                  ? '#38bdf8'
                  : '#fb7185'
                : '#fbbf24';
        this.spawnMuzzleFlash(originX, originY, fireAngle, flashCol, 14);
      }
      return;
    }

    // Direct Melee Hit (+ optional cleave splash for chariot/cyborg)
    const slashX = attacker.x + dir * (def.width * 0.62);
    const slashY = GROUND_Y - def.height * 0.76;
    this.spawnMeleeSlash(attacker, slashX, slashY, dir, isCrit);

    const isHeavyMelee =
      def.role === 'heavy' ||
      def.role === 'siege' ||
      def.id === 'dino_rider' ||
      def.id === 'sphinx_chariot' ||
      def.id === 'dragon_general' ||
      def.id === 'void_templar' ||
      def.id === 'chrono_blade';

    if (target) {
      if (effUnitSplash > 0) {
        this.applySplashDamage(
          target.x,
          attacker.team,
          rawDamage,
          effUnitSplash,
          def.armorPierce,
          isCrit,
          dir * def.knockback,
          attacker,
        );
      } else {
        this.applyDamageToUnit(target, rawDamage, def.armorPierce, isCrit, dir * def.knockback, attacker.team, attacker);
      }
      const impactY = GROUND_Y - target.def.height * 0.72;
      const meleeCol = isCrit
        ? '#fde047'
        : def.id === 'chrono_blade'
          ? '#2dd4bf'
          : def.id === 'void_templar'
            ? '#c084fc'
            : def.id === 'cyborg'
              ? '#38bdf8'
              : def.id === 'dragon_general'
                ? '#f97316'
                : '#fff7ed';
      this.spawnBurst(
        target.x - dir * 10,
        impactY,
        meleeCol,
        isCrit ? 12 : 7,
        isCrit ? 175 : 130,
      );
      if (isHeavyMelee || isCrit) {
        this.spawnGroundShockwave(target.x, GROUND_Y + 1, isCrit ? '#facc15' : meleeCol, isCrit ? 48 : 34);
      }
      if (isCrit) {
        this.spawnRing(target.x - dir * 8, impactY, '#fde047', 28);
      }
    } else {
      this.applyDamageToBase(
        attacker.team === 'player' ? 'enemy' : 'player',
        rawDamage * def.baseDamageMult,
        isCrit,
        attacker.team,
      );
      this.spawnImpactCross(targetX, targetY, isCrit ? '#fde047' : '#fb923c', isCrit ? 28 : 20);
      this.spawnBurst(targetX, targetY, '#fcd34d', 9, 135);
      if (isHeavyMelee || isCrit) {
        this.spawnGroundShockwave(targetX, GROUND_Y + 1, '#fb923c', 38);
      }
    }
  }

  private updateTurrets(faction: FactionState, dt: number): void {
    const enemyTeam: Team = faction.team === 'player' ? 'enemy' : 'player';
    const dir = faction.team === 'player' ? 1 : -1;
    const rangeMult = getRangeMult(faction.upgrades) * getTurretRapidRangeMult(faction.upgrades);
    const turretRateMult =
      getTurretAttackSpeedMult(faction.upgrades) *
      faction.mods.turretRateMult *
      (faction.tacticalBuffTimer > 0 ? 1.35 : 1);
    const projSpeedMult =
      getProjectileSpeedMult(faction.upgrades) * faction.mods.projectileSpeedMult;
    const splashMult = getSplashRadiusMult(faction.upgrades);

    for (let i = 0; i < faction.turretSlots; i++) {
      const turret = faction.turrets[i];
      if (!turret) continue;
      const def = TURRET_BY_ID[turret.turretId];

      if (turret.cooldown > 0) turret.cooldown = Math.max(0, turret.cooldown - dt);
      if (turret.recoil > 0) turret.recoil = Math.max(0, turret.recoil - dt * 5);

      const pos = this.getTurretWorldPosition(faction.team, i);
      const effTurretRange = def.range * rangeMult;

      // Acquire closest enemy unit within turret range
      let bestTarget: UnitEntity | null = null;
      let bestDist = Infinity;
      for (const u of this.units) {
        if (u.team !== enemyTeam || u.state === 'dead') continue;
        const dx = (u.x - pos.x) * dir;
        if (dx >= -20 && dx <= effTurretRange && dx < bestDist) {
          bestDist = dx;
          bestTarget = u;
        }
      }

      if (!bestTarget) continue;

      const aimDx = bestTarget.x - pos.x;
      const aimDy = GROUND_Y - bestTarget.def.height * 0.55 - pos.y;
      turret.aimAngle = Math.atan2(aimDy, aimDx);

      if (turret.cooldown > 0) continue;

      turret.cooldown = 1 / (def.attackRate * turretRateMult);
      turret.recoil = 1;
      this.callbacks.onSound?.(def.fireSound);

      const muzzleX = pos.x + Math.cos(turret.aimAngle) * 18;
      const muzzleY = pos.y + Math.sin(turret.aimAngle) * 18;
      const scaledTurretDamage =
        def.damage * getTurretDamageMult(faction.upgrades) * faction.mods.turretDamageMult;
      const effTurretSplash =
        def.splashRadius > 0
          ? (def.splashRadius + faction.mods.splashBonusPx) * splashMult
          : 0;

      // Storm 3-Set Synergy: every 5th ranged/turret shot calls down Orbital Sky Lightning!
      if (faction.mods.stormTier >= 3) {
        faction.stormShotCounter += 1;
        if (faction.stormShotCounter % 5 === 0) {
          const lTargetY = GROUND_Y - bestTarget.def.height * 0.6;
          this.beams.push({
            uid: this.nextUid++,
            team: faction.team,
            style: 'lightning',
            x1: bestTarget.x + (this.random() - 0.5) * 22,
            y1: -24,
            x2: bestTarget.x,
            y2: lTargetY,
            width: 7,
            color: '#38bdf8',
            life: 0.28,
            maxLife: 0.28,
            seed: this.random() * 100,
          });
          this.spawnFlashStar(bestTarget.x, lTargetY, '#67e8f9', 24);
          this.applyDamageToUnit(
            bestTarget,
            Math.max(4, Math.round(scaledTurretDamage * 0.55)),
            true,
            false,
            0,
            faction.team,
          );
        }
      }

      if (
        def.projectile === 'ion_beam' ||
        def.projectile === 'gravity_beam' ||
        def.projectile === 'chrono_beam'
      ) {
        const isGrav = def.projectile === 'gravity_beam';
        const isChrono = def.projectile === 'chrono_beam';
        const tx = bestTarget.x;
        const ty = GROUND_Y - bestTarget.def.height * 0.5;
        const beamCol = isChrono ? '#2dd4bf' : isGrav ? '#c084fc' : '#22d3ee';
        this.beams.push({
          uid: this.nextUid++,
          team: faction.team,
          style: isChrono ? 'chrono_beam' : isGrav ? 'gravity_beam' : 'ion_beam',
          x1: muzzleX,
          y1: muzzleY,
          x2: tx,
          y2: ty,
          width: isChrono ? 11 : isGrav ? 9 : 7,
          color: beamCol,
          life: isChrono ? 0.34 : 0.3,
          maxLife: isChrono ? 0.34 : 0.3,
          seed: this.random(),
        });
        this.spawnMuzzleFlash(muzzleX, muzzleY, turret.aimAngle, beamCol, 17);
        this.spawnImpactCross(tx, ty, beamCol, 28);
        this.spawnGroundShockwave(tx, GROUND_Y + 1, beamCol, Math.max(36, def.splashRadius * 0.8));
        this.applySplashDamage(
          tx,
          faction.team,
          scaledTurretDamage,
          effTurretSplash,
          def.armorPierce,
          false,
          dir * (isChrono ? 115 : isGrav ? 95 : 75),
        );
        this.spawnRing(tx, ty, beamCol, def.splashRadius * 0.65);
      } else {
        const flightTime = Math.max(0.12, Math.hypot(aimDx, aimDy) / (def.projectileSpeed * projSpeedMult));
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
          splashRadius: effTurretSplash,
          armorPierce: def.armorPierce,
          isCrit: false,
          electrified: faction.mods.stormTier >= 2,
          baseDamageMult: 1,
          knockback: def.splashRadius > 0 ? 55 : 18,
          pierceRemaining: 1,
          hitUids: [],
          life: 0,
          maxLife: Math.min(3.5, flightTime + 0.7),
        });
        this.spawnMuzzleFlash(muzzleX, muzzleY, turret.aimAngle, def.splashRadius > 0 ? '#fb923c' : '#fde68a', def.splashRadius > 0 ? 17 : 12);
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

      // Smoke & fire trail for rockets / dragon rockets / cannonballs / shells / mortars / grenades / totem fire
      if (
        (p.style === 'rocket' ||
          p.style === 'dragon_rocket' ||
          p.style === 'cannonball' ||
          p.style === 'shell' ||
          p.style === 'mortar_shell' ||
          p.style === 'grenade' ||
          p.style === 'totem_fire') &&
        this.random() < 0.68
      ) {
        const isFiery = p.style === 'totem_fire' || p.style === 'grenade' || p.style === 'dragon_rocket';
        this.particles.push({
          x: p.x,
          y: p.y,
          vx: -p.vx * 0.08 + (this.random() - 0.5) * 16,
          vy: -10 - this.random() * 14,
          size: p.style === 'rocket' || p.style === 'mortar_shell' ? 4.5 : 3.5,
          color:
            p.style === 'dragon_rocket'
              ? '#f43f5e'
              : isFiery
                ? '#fb923c'
                : p.style === 'rocket'
                  ? '#e2e8f0'
                  : '#94a3b8',
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
        p.style === 'quantum_orb'
          ? '#2dd4bf'
          : p.style === 'plasma'
            ? '#22d3ee'
            : p.style === 'antimatter'
              ? '#c084fc'
              : p.style === 'solar_orb'
                ? '#fbbf24'
                : p.style === 'dragon_rocket' || p.style === 'mortar_shell'
                  ? '#ef4444'
                  : '#f97316';

      // Check collision with enemy units (zero-closure sourceUnit lookup)
      let sourceUnit: UnitEntity | undefined;
      if (p.sourceUnitUid !== undefined) {
        for (let sIdx = 0; sIdx < this.units.length; sIdx++) {
          const s = this.units[sIdx];
          if (s.uid === p.sourceUnitUid && s.state !== 'dead') {
            sourceUnit = s;
            break;
          }
        }
      }
      for (let uIdx = 0; uIdx < this.units.length; uIdx++) {
        const u = this.units[uIdx];
        if (u.team !== enemyTeam || u.state === 'dead') continue;
        if (p.hitUids.includes(u.uid)) continue;
        const halfW = u.def.width * 0.55 + 6;
        const hoverOff = u.def.hoverHeight ?? 0;
        const topY = GROUND_Y - u.def.height - 4 - hoverOff;
        if (p.x >= u.x - halfW && p.x <= u.x + halfW && p.y >= topY && p.y <= GROUND_Y + 6) {
          p.hitUids.push(u.uid);
          if (p.splashRadius > 0) {
            this.applySplashDamage(
              p.x,
              p.team,
              p.damage,
              p.splashRadius,
              p.armorPierce,
              p.isCrit,
              dir * p.knockback,
              sourceUnit,
            );
            this.spawnExplosion(p.x, Math.min(p.y, GROUND_Y - 6), p.splashRadius, blastColor);
            this.callbacks.onSound?.('explosion');
          } else {
            this.applyDamageToUnit(u, p.damage, p.armorPierce, p.isCrit, dir * p.knockback, p.team, sourceUnit);
            this.spawnBurst(p.x, p.y, blastColor === '#f97316' ? '#fef08a' : blastColor, 5, 100);
          }
          p.pierceRemaining -= 1;
          if (p.pierceRemaining <= 0) {
            impacted = true;
            break;
          }
        }
      }

      // Check collision with landed Midfield Supply Crates
      if (!impacted) {
        for (let cIdx = 0; cIdx < this.supplyCrates.length; cIdx++) {
          const c = this.supplyCrates[cIdx];
          if (!c.landed || c.hp <= 0) continue;
          if (Math.abs(p.x - c.x) <= 22 && p.y >= GROUND_Y - 38 && p.y <= GROUND_Y + 6) {
            this.damageSupplyCrate(c, p.damage, p.team);
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

      // Ground impact (credit sourceUnit for splash kills/lifesteal/veteran progression)
      if (!impacted && p.y >= GROUND_Y) {
        if (p.splashRadius > 0) {
          this.applySplashDamage(
            p.x,
            p.team,
            p.damage,
            p.splashRadius,
            p.armorPierce,
            p.isCrit,
            dir * p.knockback,
            sourceUnit,
          );
          this.spawnExplosion(p.x, GROUND_Y - 4, p.splashRadius, blastColor);
          this.callbacks.onSound?.('explosion');
        } else {
          this.spawnBurst(p.x, GROUND_Y - 2, '#a8a29e', 4, 60);
        }
        impacted = true;
      }

      if (impacted || p.life >= p.maxLife || p.x < -50 || p.x > WORLD_WIDTH + 50) {
        const lastIdx = this.projectiles.length - 1;
        if (i !== lastIdx) this.projectiles[i] = this.projectiles[lastIdx];
        this.projectiles.pop();
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
          ord.kind === 'dragon_barrage' ||
          ord.kind === 'carpet_bomb' ||
          ord.kind === 'zeppelin_raid' ||
          ord.kind === 'naval_barrage'
        ) {
          ord.vy += 320 * dt;
        }

        if (ord.y >= ord.targetY) {
          ord.impacted = true;
          const casterFaction = this.getFaction(ult.team);
          const ultDmg =
            ult.def.damagePerStrike *
            getUltimateDamageMult(casterFaction.upgrades) *
            casterFaction.mods.ultDamageMult;
          const ultRad =
            (ult.def.radius + casterFaction.mods.splashBonusPx) *
            getSplashRadiusMult(casterFaction.upgrades);
          this.applySplashDamage(
            ord.targetX,
            ult.team,
            ultDmg,
            ultRad,
            true,
            false,
            dir * 95,
          );
          this.spawnExplosion(ord.targetX, GROUND_Y - 4, ult.def.radius, ult.def.accentColor);
          this.spawnGroundShockwave(ord.targetX, GROUND_Y + 2, ult.def.accentColor, ult.def.radius * 0.95);
          this.spawnImpactCross(ord.targetX, GROUND_Y - 12, '#fef08a', Math.min(44, ult.def.radius * 0.55));
          if (ord.kind === 'meteor') {
            // Volcanic magma geyser chunks erupting upward!
            this.spawnDebris(ord.targetX, GROUND_Y - 8, '#ea580c', 8, 310);
          } else if (ord.kind === 'dragon_barrage') {
            // Imperial crimson-gold firework burst petals!
            this.spawnBurst(ord.targetX, GROUND_Y - 22, '#facc15', 10, 240);
          } else if (ord.kind === 'naval_barrage' || ord.kind === 'carpet_bomb' || ord.kind === 'tactical_missiles') {
            this.spawnSmoke(ord.targetX, GROUND_Y - 26, 4, true);
          }
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
    const casterFaction = this.getFaction(ult.team);
    const ultDmg =
      ult.def.damagePerStrike *
      getUltimateDamageMult(casterFaction.upgrades) *
      casterFaction.mods.ultDamageMult;
    const ultRad =
      (ult.def.radius + casterFaction.mods.splashBonusPx) *
      getSplashRadiusMult(casterFaction.upgrades);

    if (kind === 'lightning') {
      this.beams.push({
        uid: this.nextUid++,
        team: ult.team,
        style: 'lightning',
        x1: targetX + (this.random() - 0.5) * 70,
        y1: -20,
        x2: targetX,
        y2: GROUND_Y,
        width: 13,
        color: '#7dd3fc',
        life: 0.48,
        maxLife: 0.48,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ultDmg, ultRad, true, true, dir * 80);
      this.spawnExplosion(targetX, GROUND_Y - 6, ult.def.radius * 0.92, '#38bdf8');
      this.spawnGroundShockwave(targetX, GROUND_Y + 2, '#7dd3fc', ult.def.radius * 1.15);
      this.spawnImpactCross(targetX, GROUND_Y - 18, '#e0f2fe', 42);
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
        width: 38,
        color: '#fbbf24',
        life: 0.7,
        maxLife: 0.7,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ultDmg, ultRad, true, true, dir * 75);
      this.spawnExplosion(targetX, GROUND_Y - 6, ult.def.radius * 0.98, '#fbbf24');
      this.spawnGroundShockwave(targetX, GROUND_Y + 2, '#fde047', ult.def.radius * 1.2);
      this.spawnImpactCross(targetX, GROUND_Y - 20, '#fef08a', 46);
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
        width: 52,
        color: '#22d3ee',
        life: 0.88,
        maxLife: 0.88,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ultDmg, ultRad, true, true, dir * 110);
      this.spawnExplosion(targetX, GROUND_Y - 8, ult.def.radius * 1.15, '#22d3ee');
      this.spawnGroundShockwave(targetX, GROUND_Y + 2, '#22d3ee', ult.def.radius * 1.3);
      this.spawnImpactCross(targetX, GROUND_Y - 22, '#a5f3fc', 50);
      this.callbacks.onSound?.('explosion');
      return;
    }

    if (kind === 'black_hole') {
      const centerY = GROUND_Y - 72;
      this.beams.push({
        uid: this.nextUid++,
        team: ult.team,
        style: 'black_hole_vortex',
        x1: targetX,
        y1: centerY,
        x2: targetX,
        y2: GROUND_Y,
        width: 64,
        color: '#c084fc',
        life: 0.96,
        maxLife: 0.96,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ultDmg, ultRad, true, true, -dir * 40);
      this.spawnExplosion(targetX, GROUND_Y - 12, ult.def.radius * 1.2, '#c084fc');
      this.spawnGroundShockwave(targetX, GROUND_Y + 2, '#c084fc', ult.def.radius * 1.32);
      // Inward-pulling star debris swirling straight into the singularity!
      for (let s = 0; s < 12; s++) {
        const a = (s / 12) * Math.PI * 2 + this.random() * 0.4;
        const dist = 68 + this.random() * 58;
        const sx = targetX + Math.cos(a) * dist;
        const sy = Math.min(GROUND_Y - 4, centerY + Math.sin(a) * dist * 0.65);
        this.particles.push({
          x: sx,
          y: sy,
          vx: (targetX - sx) * 2.1,
          vy: (centerY - sy) * 2.1,
          size: 3.4 + this.random() * 2.6,
          color: s % 2 === 0 ? '#f0abfc' : '#fef08a',
          alpha: 0.95,
          life: 0.45,
          maxLife: 0.45,
          gravity: 0,
          shape: 'spark',
        });
      }
      this.callbacks.onSound?.('explosion');
      return;
    }

    if (kind === 'chrono_nova') {
      this.beams.push({
        uid: this.nextUid++,
        team: ult.team,
        style: 'chrono_nova_pillar',
        x1: targetX,
        y1: -36,
        x2: targetX,
        y2: GROUND_Y + 6,
        width: 64,
        color: '#2dd4bf',
        life: 1.0,
        maxLife: 1.0,
        seed: this.random() * 1000,
      });
      this.applySplashDamage(targetX, ult.team, ultDmg, ultRad, true, true, dir * 135);
      this.spawnExplosion(targetX, GROUND_Y - 10, ult.def.radius * 1.25, '#2dd4bf');
      this.spawnGroundShockwave(targetX, GROUND_Y + 2, '#2dd4bf', ult.def.radius * 1.38);
      this.spawnGroundShockwave(targetX, GROUND_Y + 2, '#facc15', ult.def.radius * 0.95);
      this.spawnImpactCross(targetX, GROUND_Y - 24, '#fef08a', 56);
      this.spawnRing(targetX, GROUND_Y - 12, '#facc15', ult.def.radius * 1.05);
      // Ascending teal-gold celestial starlight shards rising around the pillar
      for (let k = 0; k < 10; k++) {
        this.particles.push({
          x: targetX + (this.random() - 0.5) * 95,
          y: GROUND_Y - this.random() * 45,
          vx: (this.random() - 0.5) * 45,
          vy: -135 - this.random() * 140,
          size: 3.6 + this.random() * 2.8,
          color: k % 2 === 0 ? '#5eead4' : '#fef08a',
          alpha: 0.96,
          life: 0.55,
          maxLife: 0.55,
          gravity: -40,
          shape: 'spark',
        });
      }
      this.callbacks.onSound?.('explosion');
      return;
    }

    // Falling sky ordinance (meteor, dragon_barrage, fire_arrows, naval_barrage, zeppelin_raid, carpet_bomb, tactical_missiles)
    const startY = kind === 'carpet_bomb' || kind === 'zeppelin_raid' ? 92 : -40;
    const slant =
      kind === 'meteor'
        ? -dir * 220
        : kind === 'fire_arrows' || kind === 'dragon_barrage'
          ? -dir * 270
          : kind === 'naval_barrage'
            ? -dir * 160
            : kind === 'tactical_missiles'
              ? -dir * 90
              : -dir * 55;
    const fallTime =
      kind === 'fire_arrows' || kind === 'dragon_barrage'
        ? 0.5
        : kind === 'tactical_missiles'
          ? 0.45
          : 0.6;
    const startX = targetX + slant;
    const vx = (targetX - startX) / fallTime;
    const gravity =
      kind === 'fire_arrows' ||
      kind === 'dragon_barrage' ||
      kind === 'carpet_bomb' ||
      kind === 'zeppelin_raid' ||
      kind === 'naval_barrage'
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
    attackerUnit?: UnitEntity,
  ): void {
    const enemyTeam: Team = attackerTeam === 'player' ? 'enemy' : 'player';
    for (const u of this.units) {
      if (u.team !== enemyTeam || u.state === 'dead') continue;
      const dist = Math.abs(u.x - centerX);
      if (dist <= radius + u.def.width * 0.4) {
        const falloff = Math.max(0.45, 1 - (dist / Math.max(1, radius + 24)) * 0.5);
        this.applyDamageToUnit(
          u,
          damage * falloff,
          armorPierce,
          isCrit,
          knockback * falloff,
          attackerTeam,
          attackerUnit,
        );
      }
    }
    if (
      attackerTeam === 'player' &&
      this.treasureDrone &&
      Math.abs(this.treasureDrone.x - centerX) <= radius + 34
    ) {
      this.damageTreasureDrone(damage * 0.65);
    }
  }

  private applyDamageToUnit(
    victim: UnitEntity,
    rawDamage: number,
    armorPierce: boolean,
    isCrit: boolean,
    knockbackImpulse: number,
    attackerTeam: Team,
    attackerUnit?: UnitEntity,
    isThornsReflect = false,
    isChainArc = false,
  ): void {
    if (victim.state === 'dead') return;
    const victimFaction = this.getFaction(victim.team);
    const attackerFaction = this.getFaction(attackerTeam);

    const totalArmor = Math.min(
      0.62,
      victim.def.armor + getArmorMitigationBonus(victimFaction.upgrades) + victimFaction.mods.armorBonus,
    );
    const pierceFraction = getArmorPierceFraction(attackerFaction.upgrades, armorPierce);
    const effectiveArmor = totalArmor * (1 - pierceFraction);
    const aegisMitigation = victimFaction.aegisProtectedTimer > 0 ? 0.72 : 1;

    // Siege Craft & Siegebreaker Ram deal bonus damage against Heavy/Siege/Boss units!
    const heavyBonus =
      victim.def.role === 'heavy' || victim.def.role === 'siege' || victim.eliteKind === 'boss'
        ? getSiegeDamageMult(attackerFaction.upgrades) * attackerFaction.mods.siegeDamageMult
        : 1;

    // Executioner Instinct deals massive bonus finisher damage to enemies at or below 40% HP!
    const isExecute =
      !isThornsReflect && attackerFaction.upgrades.executioner > 0 && victim.hp / victim.maxHp <= 0.4;
    const executeBonus = isExecute ? getExecutionerDamageMult(attackerFaction.upgrades) : 1;

    const finalDamage = Math.max(
      1,
      Math.round(rawDamage * heavyBonus * executeBonus * aegisMitigation * (1 - effectiveArmor)),
    );
    const hadShield = victim.shield > 0;
    const shieldAbsorbed = hadShield ? Math.min(victim.shield, finalDamage) : 0;
    victim.shield -= shieldAbsorbed;
    const hpDamage = finalDamage - shieldAbsorbed;
    victim.hp -= hpDamage;
    victim.hitFlash = 1;
    victim.lastHitCrit = isCrit || isExecute;
    if (hpDamage > 0) {
      victim.displayHpHold = Math.max(victim.displayHpHold, isCrit || isExecute ? 0.28 : 0.16);
    }

    const kbResistBase =
      victim.eliteKind === 'boss'
        ? 0.18
        : victim.eliteKind === 'elite'
          ? 0.48
          : victim.def.isMechanical
            ? 0.35
            : 0.88;
    victim.knockbackVel +=
      knockbackImpulse * kbResistBase * getKnockbackResistMult(victimFaction.upgrades);

    // Cryo Shard Relic: chills target movement & attack rate for 2.2s
    if (
      !isThornsReflect &&
      attackerFaction.mods.cryoSlowChance > 0 &&
      this.random() < attackerFaction.mods.cryoSlowChance
    ) {
      victim.slowTimer = Math.max(victim.slowTimer ?? 0, 2.2);
    }

    // Thunder Core Relic / Chain Storm Mutator: arcs lightning to up to 2 nearby enemies!
    if (
      !isThornsReflect &&
      !isChainArc &&
      attackerFaction.mods.chainLightningChance > 0 &&
      (!attackerUnit || attackerUnit.def.projectile !== undefined) &&
      this.random() < attackerFaction.mods.chainLightningChance
    ) {
      const vy0 = GROUND_Y - victim.def.height * 0.72 - (victim.def.hoverHeight ?? 0);
      let chained = 0;
      for (let idx = 0; idx < this.units.length && chained < 2; idx++) {
        const other = this.units[idx];
        if (other.team !== victim.team || other.state === 'dead' || other.uid === victim.uid) continue;
        if (Math.abs(other.x - victim.x) <= 155) {
          chained++;
          const oy = GROUND_Y - other.def.height * 0.72 - (other.def.hoverHeight ?? 0);
          this.beams.push({
            uid: this.nextUid++,
            team: attackerTeam,
            style: 'tesla_arc',
            x1: victim.x,
            y1: vy0,
            x2: other.x,
            y2: oy,
            width: 5,
            color: '#67e8f9',
            life: 0.22,
            maxLife: 0.22,
            seed: this.random() * 100,
          });
          this.applyDamageToUnit(
            other,
            Math.max(2, finalDamage * 0.38),
            true,
            false,
            0,
            attackerTeam,
            attackerUnit,
            false,
            true,
          );
        }
      }
    }

    // Lifesteal heals the living attacker unit on damage dealt + spawns crimson heal glint!
    if (!isThornsReflect && attackerUnit && attackerUnit.state !== 'dead') {
      const lsRatio = getLifestealRatio(attackerFaction.upgrades) + attackerFaction.mods.lifestealBonus;
      if (lsRatio > 0 && attackerUnit.hp < attackerUnit.maxHp) {
        const healAmt = Math.max(1, finalDamage * lsRatio);
        attackerUnit.hp = Math.min(attackerUnit.maxHp, attackerUnit.hp + healAmt);
        this.particles.push({
          x: attackerUnit.x + (this.random() - 0.5) * 14,
          y: GROUND_Y - attackerUnit.def.height * 0.65 - (attackerUnit.def.hoverHeight ?? 0),
          vx: (this.random() - 0.5) * 18,
          vy: -42 - this.random() * 18,
          size: 4.2,
          color: '#fb7185',
          alpha: 0.92,
          life: 0.32,
          maxLife: 0.32,
          gravity: -16,
          shape: 'circle',
        });
      }
    }

    // Sync live Berserker / Bulwark visual aura flags on damaged victim
    victim.berserkerAura =
      victimFaction.mods.berserkerTier >= 2 && victim.hp > 0 && victim.hp / Math.max(1, victim.maxHp) <= 0.75;
    victim.bulwarkHex = victimFaction.mods.bulwarkTier >= 2 && victim.shield > 0.5;

    // Bulwark 2-Set Synergy: frost-thorn barrier chills any unit striking a Bulwark defender!
    if (!isThornsReflect && victimFaction.mods.bulwarkTier >= 2 && attackerUnit && attackerUnit.state !== 'dead') {
      attackerUnit.slowTimer = Math.max(attackerUnit.slowTimer ?? 0, 1.8);
    }

    // Thorns armor reflects melee strike damage back to the melee attacker!
    if (!isThornsReflect && attackerUnit && attackerUnit.state !== 'dead' && !attackerUnit.def.projectile) {
      const thornsRatio = getThornsReflectRatio(victimFaction.upgrades) + victimFaction.mods.thornsBonus;
      if (thornsRatio > 0) {
        const reflectDmg = Math.max(1, Math.round(finalDamage * thornsRatio));
        this.applyDamageToUnit(attackerUnit, reflectDmg, true, false, 0, victim.team, undefined, true);
      }
    }

    const hitDir = attackerTeam === 'player' ? 1 : -1;
    const impactX = victim.x - hitDir * Math.min(14, victim.def.width * 0.3);
    const impactY = GROUND_Y - victim.def.height * 0.72 - (victim.def.hoverHeight ?? 0);

    // Vanguard Shield shatter ring + cyan shockwave & crystal cross when energy barrier breaks!
    if (hadShield && victim.shield <= 0) {
      this.spawnRing(victim.x, impactY, '#38bdf8', 34);
      this.spawnImpactCross(victim.x, impactY, '#38bdf8', 30);
      this.spawnGroundShockwave(victim.x, GROUND_Y + 1, '#38bdf8', 36);
      this.spawnBurst(victim.x, impactY, '#67e8f9', 8, 195);
      this.callbacks.onSound?.('shield_break');
    }

    // Supercharged arcade hit-impact starburst, anime impact cross, directional sparks & ground shockwave!
    const sparkColor =
      shieldAbsorbed > 0 && hpDamage === 0
        ? '#38bdf8'
        : isExecute
          ? '#fb7185'
          : isCrit
            ? '#fde047'
            : isThornsReflect
              ? '#fb923c'
              : victim.def.isMechanical
                ? '#fef08a'
                : armorPierce
                  ? '#67e8f9'
                  : '#ffedd5';
    this.spawnFlashStar(impactX, impactY, sparkColor, isCrit || isExecute ? 30 : 17);
    this.spawnDirectionalSparks(
      impactX,
      impactY,
      hitDir,
      sparkColor,
      isCrit || isExecute ? 12 : 6,
      isCrit || isExecute ? 255 : 170,
    );

    if (isCrit || isExecute) {
      this.spawnImpactCross(impactX, impactY, isExecute ? '#fb7185' : '#fde047', 34);
      this.spawnRing(impactX, impactY, isExecute ? '#fb7185' : '#fde047', 36);
      this.spawnGroundShockwave(victim.x, GROUND_Y + 1, isExecute ? '#fb7185' : '#facc15', 42);
      this.spawnDustWave(victim.x, GROUND_Y, hitDir * 76, 17, '#a8a29e');
      if (attackerTeam === 'player') {
        this.callbacks.onSound?.('crit');
      }
    } else if (armorPierce || (knockbackImpulse !== 0 && Math.abs(knockbackImpulse) >= 18)) {
      if (armorPierce) {
        this.spawnImpactCross(impactX, impactY, sparkColor, 18);
      }
      this.spawnDustWave(victim.x, GROUND_Y, hitDir * 46, 11, '#78716c');
    }

    // Distinct readable color-coded popup styling by hit type & victim team
    const popupKind: DamagePopup['kind'] =
      shieldAbsorbed > 0 && hpDamage === 0
        ? 'elemental'
        : isCrit || isExecute
          ? 'crit'
          : victim.team === 'player'
            ? 'player_hit'
            : armorPierce
              ? 'elemental'
              : 'normal';
    const popupColor =
      shieldAbsorbed > 0 && hpDamage === 0
        ? '#38bdf8'
        : isExecute
          ? '#fb7185'
          : popupKind === 'crit'
            ? '#fde047'
            : popupKind === 'player_hit'
              ? '#fca5a5'
              : popupKind === 'elemental'
                ? '#67e8f9'
                : '#ffffff';

    this.addPopup(
      victim.x + (this.random() - 0.5) * 16,
      GROUND_Y - victim.def.height * 1.48 - 10 - (victim.def.hoverHeight ?? 0),
      isCrit || isExecute ? `${finalDamage}!` : `${finalDamage}`,
      popupColor,
      isCrit || isExecute ? 1.36 : 1.0,
      popupKind,
    );

    if (victim.hp <= 0) {
      victim.hp = 0;
      victim.state = 'dead';
      victim.deathTimer = 0;

      const killer = this.getFaction(attackerTeam);
      const loser = this.getFaction(victim.team);
      const diff = DIFFICULTIES[this.difficulty];

      // Kill Combo Chain (starts granting +2.5% bonus per combo above 1, up to +50%)
      killer.comboCount += 1;
      killer.comboTimer = 4.2;
      if (killer.comboCount > killer.maxCombo) {
        killer.maxCombo = killer.comboCount;
      }
      const comboMult =
        killer.comboCount >= 2 ? 1 + Math.min(0.5, (killer.comboCount - 1) * 0.025) : 1;

      const isSpecialVictim = victim.eliteKind === 'elite' || victim.eliteKind === 'boss';
      const specialRewardMult =
        (victim.rewardMult ?? 1) * (isSpecialVictim ? killer.mods.bountyBossMult : 1);

      const feverGoldMult = killer.feverTimer > 0 ? 1.25 + getFeverPowerBonus(killer.upgrades) : 1;
      const goldMult =
        (attackerTeam === 'enemy' ? diff.aiGoldMultiplier : 1) *
        getKillGoldMult(killer.upgrades) *
        killer.mods.killGoldMult *
        feverGoldMult *
        comboMult *
        specialRewardMult;
      const xpMult =
        (attackerTeam === 'enemy' ? diff.aiXpMultiplier : 1) *
        getKillXpMult(killer.upgrades) *
        getXpMasteryMult(killer.upgrades) *
        killer.mods.xpMult *
        comboMult *
        specialRewardMult;

      let rewardGold = Math.round(victim.def.killGold * goldMult);
      let rewardXp = Math.round(victim.def.killXp * xpMult);

      // First Blood opening bonus!
      if (!this.firstBloodClaimed) {
        this.firstBloodClaimed = true;
        rewardGold += 45;
        rewardXp += 75;
        if (attackerTeam === 'player') {
          this.addPopup(victim.x, GROUND_Y - 126, '선취점! +45G', '#fde047', 1.26, 'crit');
        }
      }

      killer.gold += rewardGold;
      killer.xp += rewardXp;
      killer.totalXp += rewardXp;
      killer.kills += 1;
      if (victim.eliteKind === 'boss') {
        killer.bossKills += 1;
        if (attackerTeam === 'player') {
          this.spawnSpoil(victim.x - 16, 'gold', Math.max(25, Math.round(rewardGold * 0.45)), -145);
          this.spawnSpoil(victim.x + 16, 'xp', Math.max(40, Math.round(rewardXp * 0.45)), -155);
          this.spawnSpoil(victim.x, 'medal', 2, -170);
          this.callbacks.onSound?.('fever');
          this.callbacks.onBanner?.(
            `${victim.eliteTitle ?? '수호군주'} 토벌 성공!`,
            `현상금 +${rewardGold.toLocaleString()}G · +${rewardXp.toLocaleString()} XP + 전장 전리품 드롭!`,
            '#fde047',
          );
        }
      } else if (victim.eliteKind === 'elite') {
        killer.eliteKills += 1;
        if (attackerTeam === 'player' && this.dynamicEventsEnabled) {
          this.spawnSpoil(victim.x - 10, 'gold', Math.max(15, Math.round(rewardGold * 0.4)), -130);
          this.spawnSpoil(victim.x + 10, 'xp', Math.max(25, Math.round(rewardXp * 0.4)), -140);
        }
      }

      // Advance live Battlefield Bounty Directive on player kills
      if (attackerTeam === 'player' && this.activeBounty) {
        if (this.activeBounty.kind === 'kills') {
          this.advanceBountyProgress(1);
        } else if (this.activeBounty.kind === 'special_hunt' && isSpecialVictim) {
          this.advanceBountyProgress(1);
        }
      }

      // Berserker 3-Set Synergy: enemy death erupts a Molten Ground Shockwave!
      if (killer.mods.berserkerTier >= 3) {
        const moltenDmg = Math.max(6, Math.round(victim.maxHp * 0.16));
        this.spawnGroundShockwave(victim.x, GROUND_Y + 2, '#fb923c', 68);
        this.spawnRing(victim.x, GROUND_Y - 14, '#f97316', 54);
        this.spawnScorch(victim.x, 42, '#f97316');
        for (let mIdx = 0; mIdx < this.units.length; mIdx++) {
          const foe = this.units[mIdx];
          if (foe.team === attackerTeam || foe.state === 'dead' || foe.uid === victim.uid) continue;
          if (Math.abs(foe.x - victim.x) <= 68) {
            this.applyDamageToUnit(foe, moltenDmg, true, false, 0, attackerTeam, undefined, true);
          }
        }
      }

      // Combo audio & milestone popups for player
      if (attackerTeam === 'player' && killer.comboCount >= 3) {
        this.callbacks.onComboSound?.(killer.comboCount);
        if (
          killer.comboCount === 5 ||
          killer.comboCount === 10 ||
          killer.comboCount === 15 ||
          killer.comboCount === 20 ||
          killer.comboCount % 10 === 0
        ) {
          const comboLabel =
            killer.comboCount >= 20
              ? `${killer.comboCount} ULTRA!`
              : killer.comboCount >= 10
                ? `${killer.comboCount} RAMPAGE!`
                : `${killer.comboCount} COMBO!`;
          this.addPopup(victim.x, GROUND_Y - 132, comboLabel, '#f97316', 1.28, 'crit');
        }
      }

      // Guillotine Blade Relic: kill triggers an AOE victory heal pulse for nearby allies!
      if (killer.mods.executeHealRatio > 0) {
        for (let idx = 0; idx < this.units.length; idx++) {
          const ally = this.units[idx];
          if (ally.team !== attackerTeam || ally.state === 'dead') continue;
          if (Math.abs(ally.x - victim.x) <= 170 && ally.hp < ally.maxHp) {
            const heal = Math.max(2, Math.round(ally.maxHp * killer.mods.executeHealRatio));
            ally.hp = Math.min(ally.maxHp, ally.hp + heal);
            ally.displayHp = Math.max(ally.displayHp, ally.hp);
          }
        }
        this.spawnRing(victim.x, GROUND_Y - 24, '#4ade80', 46);
      }

      // Unit Veteran Promotion (accelerated & amplified by veteran_drill & warlord_signet)!
      if (attackerUnit && attackerUnit.state !== 'dead') {
        attackerUnit.kills += 1;
        const nextRank = getVeteranRankForKills(attackerUnit.kills, killer.upgrades);
        if (nextRank > attackerUnit.vetRank) {
          attackerUnit.vetRank = nextRank;
          attackerUnit.imperialHalo = killer.mods.imperialTier >= 2 && nextRank >= 1;
          const baseVet = getVeteranStatMult(nextRank, killer.upgrades);
          const vetHpMult = 1 + (baseVet - 1) * killer.mods.vetStatBonusMult;
          const statMult = attackerTeam === 'enemy' ? DIFFICULTIES[this.difficulty].aiUnitStatMult : 1;
          const eliteHpMult =
            attackerUnit.eliteKind === 'boss' ? 4.2 : attackerUnit.eliteKind === 'elite' ? 2.2 : 1;
          const newMax = Math.round(
            attackerUnit.def.maxHp *
              getArmorHpMult(killer.upgrades) *
              killer.mods.maxHpMult *
              vetHpMult *
              statMult *
              eliteHpMult,
          );
          const hpDelta = Math.max(0, newMax - attackerUnit.maxHp);
          attackerUnit.maxHp = newMax;
          attackerUnit.hp = Math.min(newMax, attackerUnit.hp + hpDelta + Math.round(newMax * 0.2));
          attackerUnit.displayHp = Math.max(attackerUnit.displayHp, attackerUnit.hp);
          attackerUnit.upgradeFlash = 1;
          const stars = '★'.repeat(nextRank);
          const title = nextRank === 3 ? `${stars} 영웅!` : nextRank === 2 ? `${stars} 정예!` : `${stars} 베테랑!`;
          this.addPopup(
            attackerUnit.x,
            GROUND_Y - attackerUnit.def.height * 1.48 - 32 - (attackerUnit.def.hoverHeight ?? 0),
            title,
            '#fde047',
            1.14,
            'crit',
          );
          this.spawnRing(attackerUnit.x, GROUND_Y - attackerUnit.def.height * 0.5, '#facc15', 36);
          this.spawnGroundShockwave(attackerUnit.x, GROUND_Y + 1, '#facc15', 38);
          if (attackerTeam === 'player') {
            this.callbacks.onSound?.('promote');
          }
        }
      }

      // Chrono Fever Kill-Streak Charge (shortened by berserker_horn / gold_fever!)
      if (killer.feverTimer <= 0) {
        const feverGain = victim.eliteKind === 'boss' ? 5 : victim.eliteKind === 'elite' ? 3 : 1;
        killer.feverKills += feverGain;
        const feverTarget = killer.mods.feverKillsTarget;
        if (killer.feverKills >= feverTarget) {
          killer.feverKills = 0;
          const feverSec = getFeverDurationSec(FEVER_DURATION_SEC, killer.upgrades);
          const feverBonusPct = Math.round(getFeverPowerBonus(killer.upgrades) * 100);
          killer.feverTimer = feverSec;
          killer.feverDuration = feverSec;
          for (const ally of this.units) {
            if (ally.team === attackerTeam && ally.state !== 'dead') {
              ally.upgradeFlash = 1;
            }
          }
          if (attackerTeam === 'player') {
            this.callbacks.onSound?.('fever');
            this.callbacks.onBanner?.(
              '크로노 피버 발동!',
              `${Math.round(feverSec)}초간 전 아군 공속 +${25 + feverBonusPct}% · 골드 +${25 + feverBonusPct}%`,
              '#facc15',
            );
          }
        }
      }

      // Small consolation XP for loser so battles never stall (also boosted by xp_mastery)
      const consolationXp = Math.round(
        victim.def.killXp *
          LOSS_XP_RATIO *
          (victim.team === 'enemy' ? diff.aiXpMultiplier : 1) *
          getXpMasteryMult(loser.upgrades) *
          loser.mods.xpMult,
      );
      loser.xp += consolationXp;
      loser.totalXp += consolationXp;

      if (attackerTeam === 'player') {
        this.addPopup(
          victim.x,
          GROUND_Y - victim.def.height * 1.48 - 30,
          `+${rewardGold}G`,
          '#facc15',
          victim.eliteKind ? 1.18 : 0.98,
          'gold',
        );
      }

      if (victim.def.isMechanical || victim.eliteKind === 'boss') {
        this.spawnExplosion(
          victim.x,
          GROUND_Y - victim.def.height * 0.65,
          victim.eliteKind === 'boss' ? 92 : 68,
          victim.eliteKind === 'boss' ? '#facc15' : '#f97316',
        );
        this.callbacks.onSound?.('explosion');
      } else {
        const deathCol = victim.team === 'player' ? '#93c5fd' : '#fca5a5';
        this.spawnFlashStar(victim.x, impactY, deathCol, victim.def.role === 'heavy' ? 28 : 22);
        this.spawnImpactCross(victim.x, impactY, deathCol, victim.def.role === 'heavy' ? 28 : 20);
        this.spawnBurst(victim.x, GROUND_Y - victim.def.height * 0.6, victim.team === 'player' ? '#60a5fa' : '#f87171', 14, 185);
        this.spawnDebris(victim.x, GROUND_Y - victim.def.height * 0.45, '#52525b', 6, 165);
        this.spawnDustWave(victim.x, GROUND_Y, hitDir * 66, 17, '#78716c');
        if (victim.def.role === 'heavy' || victim.def.role === 'siege') {
          this.spawnGroundShockwave(victim.x, GROUND_Y + 1, deathCol, 42);
        }
      }
    }
  }

  private applyDamageToBase(targetTeam: Team, rawDamage: number, isCrit: boolean, attackerTeam: Team): void {
    const defender = this.getFaction(targetTeam);
    const attacker = this.getFaction(attackerTeam);
    const dmg = Math.max(
      1,
      Math.round(rawDamage * getSiegeDamageMult(attacker.upgrades) * attacker.mods.siegeDamageMult),
    );
    const hpBefore = defender.baseHp;
    defender.baseHp = Math.max(0, defender.baseHp - dmg);
    defender.baseHitFlash = 1;

    const xpGain = Math.max(
      1,
      Math.round(
        (dmg / 100) *
          BASE_HIT_XP_PER_100_DMG *
          getXpMasteryMult(attacker.upgrades) *
          attacker.mods.xpMult,
      ),
    );
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
    this.spawnFlashStar(baseX, GROUND_Y - 72, isCrit ? '#fde047' : '#fb923c', isCrit ? 30 : 20);
    this.spawnImpactCross(baseX, GROUND_Y - 72, isCrit ? '#fde047' : '#fb923c', isCrit ? 32 : 22);
    this.spawnDirectionalSparks(baseX, GROUND_Y - 70, bounceDir, '#fde68a', isCrit ? 12 : 7, 185);
    this.spawnDebris(baseX, GROUND_Y - 64, '#78716c', isCrit ? 8 : 5, 175);
    this.spawnDustWave(baseX, GROUND_Y, bounceDir * 60, 18, '#a8a29e');
    this.callbacks.onSound?.('hit_base');

    // Campaign/Daily mid-siege climax: Enemy Warlord Boss emerges when enemy base first drops <= 50% HP!
    if (
      targetTeam === 'enemy' &&
      this.mode !== 'endless' &&
      !this.enemyHalfBaseBossSpawned &&
      defender.baseHp > 0 &&
      defender.baseHp <= defender.baseMaxHp * 0.5
    ) {
      this.enemyHalfBaseBossSpawned = true;
      this.spawnSpecialUnit('enemy', 'boss');
    }

    // Rewind Hourglass Mythic Relic: saves fortress once even from a lethal blow when crossing <= 25% HP!
    if (
      hpBefore > 0 &&
      defender.mods.hasRewindHourglass &&
      !defender.rewindUsed &&
      defender.baseHp <= defender.baseMaxHp * 0.25
    ) {
      defender.rewindUsed = true;
      defender.lastStandUsed = true;
      const rewindHeal = Math.round(defender.baseMaxHp * 0.45);
      defender.baseHp = Math.min(defender.baseMaxHp, defender.baseHp + rewindHeal);
      defender.displayBaseHp = defender.baseHp;
      defender.feverTimer = Math.max(defender.feverTimer, 10);
      defender.feverDuration = 10;
      defender.tacticalBuffTimer = Math.max(defender.tacticalBuffTimer, 5);

      const pushDir: 1 | -1 = targetTeam === 'player' ? 1 : -1;
      for (const u of this.units) {
        if (u.team !== targetTeam && u.state !== 'dead') {
          u.knockbackVel += pushDir * 320;
        }
      }
      this.spawnRing(baseX, GROUND_Y - 68, '#fef08a', 140);
      this.spawnGroundShockwave(baseX, GROUND_Y + 2, '#2dd4bf', 150);
      if (targetTeam === 'player') {
        this.callbacks.onSound?.('fever');
        this.addPopup(baseX, GROUND_Y - 155, `시간 역행! +${rewindHeal} HP`, '#fef08a', 1.38, 'heal');
        this.callbacks.onBanner?.(
          '시간 역행 모래시계 발동!',
          '성채 체력 45% 역행 복구 + 적군 충격파 넉백 + 크로노 피버 즉시 발동!',
          '#fef08a',
        );
      }
    } else if (
      defender.baseHp > 0 &&
      !defender.lastStandUsed &&
      defender.baseHp <= defender.baseMaxHp * 0.25
    ) {
      // Standard 1-time Fortress Emergency Shockwave at <= 25% HP (while still alive)
      defender.lastStandUsed = true;
      defender.tacticalBuffTimer = Math.max(defender.tacticalBuffTimer, 4.0);
      const pushDir: 1 | -1 = targetTeam === 'player' ? 1 : -1;
      const fortFront = targetTeam === 'player' ? PLAYER_BASE_FRONT_X : ENEMY_BASE_FRONT_X;
      for (const u of this.units) {
        if (u.team !== targetTeam && u.state !== 'dead' && Math.abs(u.x - fortFront) <= 420) {
          u.knockbackVel += pushDir * 240;
        }
      }
      this.spawnRing(baseX, GROUND_Y - 68, '#38bdf8', 120);
      this.spawnGroundShockwave(baseX, GROUND_Y + 2, '#38bdf8', 130);
      if (targetTeam === 'player') {
        this.callbacks.onSound?.('tactical');
        this.callbacks.onBanner?.(
          '성채 비상 방어 충격파!',
          '침입한 적군 후퇴 충격파 + 4초간 포탑·수비군 긴급 과충전!',
          '#38bdf8',
        );
      }
    }
  }

  private updateEffects(dt: number): void {
    // O(1) swap-and-pop removal avoids array-shift churn and GC pressure during massive 2x battles
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) {
        const last = this.beams.length - 1;
        if (i !== last) this.beams[i] = this.beams[last];
        this.beams.pop();
      }
    }

    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life -= dt;
      if (this.slashes[i].life <= 0) {
        const last = this.slashes.length - 1;
        if (i !== last) this.slashes[i] = this.slashes[last];
        this.slashes.pop();
      }
    }

    for (let i = this.scorchMarks.length - 1; i >= 0; i--) {
      this.scorchMarks[i].life -= dt;
      if (this.scorchMarks[i].life <= 0) {
        const last = this.scorchMarks.length - 1;
        if (i !== last) this.scorchMarks[i] = this.scorchMarks[last];
        this.scorchMarks.pop();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        const last = this.particles.length - 1;
        if (i !== last) this.particles[i] = this.particles[last];
        this.particles.pop();
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.shape === 'ring') {
        p.size += dt * 195;
      } else if (p.shape === 'ground_shockwave') {
        p.size += dt * 235;
      } else if (p.shape === 'debris') {
        p.rotation = (p.rotation ?? 0) + (p.vRot ?? 6) * dt;
        if (p.y > GROUND_Y) {
          p.y = GROUND_Y;
          p.vy = -Math.abs(p.vy) * 0.38;
          p.vx *= 0.65;
        }
      }
    }

    const popupDragX = Math.exp(-3.6 * dt);
    const popupDragY = Math.exp(-2.6 * dt);
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.life -= dt;
      if (pop.life <= 0) {
        const last = this.popups.length - 1;
        if (i !== last) this.popups[i] = this.popups[last];
        this.popups.pop();
        continue;
      }
      if (pop.vx) {
        pop.x += pop.vx * dt;
        pop.vx *= popupDragX;
      }
      pop.y += pop.vy * dt;
      pop.vy *= popupDragY;
    }

    // Cap VFX budgets for locked 60fps & low heat on iPhone Safari/PWA even at 2x speed
    if (this.particles.length > 380) {
      this.particles.length = 380;
    }
    if (this.scorchMarks.length > 32) {
      this.scorchMarks.length = 32;
    }
    if (this.slashes.length > 28) {
      this.slashes.length = 28;
    }
    if (this.popups.length > 42) {
      this.popups.length = 42;
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
    } else if (id === 'dynasty_swordsman') {
      style = 'blade';
      color = '#10b981';
      coreColor = '#fef08a';
      radius = 42;
    } else if (id === 'dragon_general') {
      style = 'heavy';
      color = '#ef4444';
      coreColor = '#fef08a';
      radius = 54;
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
    } else if (id === 'chrono_blade') {
      style = 'plasma';
      color = '#2dd4bf';
      coreColor = '#fef9c3';
      radius = 56;
    }

    const baseAngle = (this.random() - 0.5) * 0.28;
    this.slashes.push({
      x,
      y,
      dir,
      radius: isCrit ? radius * 1.38 : radius * 1.15,
      color: isCrit ? '#facc15' : color,
      coreColor,
      life: isCrit ? 0.32 : 0.28,
      maxLife: isCrit ? 0.32 : 0.28,
      angleOffset: baseAngle,
      style,
    });

    // Dramatic anime cross-slash twin crescent on melee crits!
    if (isCrit && style !== 'thrust') {
      this.slashes.push({
        x: x + dir * 4,
        y: y - 3,
        dir,
        radius: radius * 1.16,
        color: '#fb923c',
        coreColor: '#ffffff',
        life: 0.26,
        maxLife: 0.26,
        angleOffset: baseAngle - 0.52,
        style: 'blade',
      });
    }
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
      life: 0.15,
      maxLife: 0.15,
      gravity: 0,
      shape: 'flash_star',
      rotation: this.random() * Math.PI,
    });
  }

  private spawnGroundShockwave(x: number, y: number, color: string, initialRadius: number): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: Math.max(12, initialRadius * 0.28),
      color,
      alpha: 0.96,
      life: 0.36,
      maxLife: 0.36,
      gravity: 0,
      shape: 'ground_shockwave',
    });
  }

  private spawnMuzzleFlash(x: number, y: number, angle: number, color: string, size: number): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size,
      color,
      alpha: 1,
      life: 0.09,
      maxLife: 0.09,
      gravity: 0,
      shape: 'muzzle_flash',
      rotation: angle,
    });
  }

  private spawnImpactCross(x: number, y: number, color: string, size: number): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size,
      color,
      alpha: 1,
      life: 0.16,
      maxLife: 0.16,
      gravity: 0,
      shape: 'impact_cross',
      rotation: (this.random() - 0.5) * 0.65 + 0.32,
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
    // 1. Instant blinding arcade flash starburst & anime cross-cut at blast core
    this.spawnFlashStar(x, y, accentColor, Math.min(50, Math.max(22, radius * 0.66)));
    this.spawnImpactCross(x, y, '#fef9c3', Math.min(44, Math.max(20, radius * 0.56)));

    // 2. Layered 3-lobe cel-shaded cartoon fireballs blooming outward!
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

    // 3. Dual expanding shockwave rings + perspective ground shockwave & dust waves
    this.spawnRing(x, y, accentColor, radius);
    this.spawnRing(x, y, '#fef9c3', radius * 0.45);
    if (y >= GROUND_Y - 80) {
      this.spawnGroundShockwave(x, GROUND_Y + 2, accentColor, radius * 0.85);
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
