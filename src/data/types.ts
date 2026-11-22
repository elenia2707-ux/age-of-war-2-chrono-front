export type Team = 'player' | 'enemy';

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'brutal' | 'nightmare' | 'mythic';

export type GameStatus = 'title' | 'playing' | 'paused' | 'victory' | 'defeat';

export type ProjectileStyle =
  | 'stone'
  | 'totem_fire'
  | 'boulder'
  | 'solar_orb'
  | 'arrow'
  | 'fire_arrow'
  | 'dragon_rocket'
  | 'bolt'
  | 'bullet'
  | 'grenade'
  | 'cannonball'
  | 'tesla_arc'
  | 'flame'
  | 'mortar_shell'
  | 'shell'
  | 'rocket'
  | 'plasma'
  | 'railgun'
  | 'ion_beam'
  | 'antimatter'
  | 'gravity_beam'
  | 'quantum_orb'
  | 'chrono_beam';

export type UltimateKind =
  | 'meteor'
  | 'solar_wrath'
  | 'lightning'
  | 'dragon_barrage'
  | 'fire_arrows'
  | 'naval_barrage'
  | 'zeppelin_raid'
  | 'carpet_bomb'
  | 'tactical_missiles'
  | 'orbital_laser'
  | 'black_hole'
  | 'chrono_nova';

export type UpgradeId =
  // Offense (공격)
  | 'weapons'
  | 'attack_speed'
  | 'crit_mastery'
  | 'armor_pierce'
  // Defense (방어)
  | 'armor'
  | 'regeneration'
  | 'lifesteal'
  | 'thorns'
  // Tactics (전술)
  | 'mobility'
  | 'range_optics'
  | 'siege_craft'
  | 'ultimate_power'
  // Empire (제국)
  | 'economy'
  | 'bounty'
  | 'discount'
  | 'fortress'
  // Special (특수)
  | 'xp_mastery'
  | 'ult_efficiency'
  | 'executioner'
  | 'turret_rapid'
  // Command (지휘)
  | 'vanguard_shield'
  | 'berserk_fury'
  | 'veteran_drill'
  | 'chrono_fever';

export type UpgradeCategory = 'offense' | 'defense' | 'tactics' | 'empire' | 'special' | 'command';

export type UpgradeLevels = Record<UpgradeId, number>;

export interface UpgradeDef {
  id: UpgradeId;
  category: UpgradeCategory;
  name: string;
  shortName: string;
  effectText: string;
  maxLevel: number;
  costs: readonly number[];
  spriteKey: string;
}

export type UnitRole = 'melee' | 'ranged' | 'heavy' | 'siege';

export type UnitVisualKind =
  | 'clubman'
  | 'slinger'
  | 'shaman'
  | 'dino_rider'
  | 'anubis_warrior'
  | 'sun_priest'
  | 'scorpion_guard'
  | 'sphinx_chariot'
  | 'spearman'
  | 'archer'
  | 'centurion'
  | 'chariot'
  | 'dynasty_swordsman'
  | 'repeating_crossbow'
  | 'hwacha_cart'
  | 'dragon_general'
  | 'knight'
  | 'crossbowman'
  | 'heavy_cavalry'
  | 'catapult'
  | 'pikeman'
  | 'musketeer'
  | 'grenadier'
  | 'field_cannon'
  | 'steam_trooper'
  | 'gatling_gunner'
  | 'tesla_coil_trooper'
  | 'steam_walker'
  | 'rifleman'
  | 'flamethrower'
  | 'mortar_team'
  | 'early_tank'
  | 'spec_ops'
  | 'at_rocket'
  | 'riot_juggernaut'
  | 'mbt'
  | 'cyborg'
  | 'hover_drone'
  | 'railgun_sniper'
  | 'colossus_mech'
  | 'void_templar'
  | 'gravity_sniper'
  | 'star_archon'
  | 'omega_titan'
  | 'chrono_blade'
  | 'quantum_weaver'
  | 'aegis_seraph'
  | 'chrono_sovereign';

export type TurretVisualKind =
  | 'rock_dropper'
  | 'bone_catapult'
  | 'obelisk_beam'
  | 'scarab_catapult'
  | 'arrow_tower'
  | 'ballista'
  | 'dragon_repeater'
  | 'fire_ox_cannon'
  | 'crossbow_bastion'
  | 'keep_trebuchet'
  | 'musket_battery'
  | 'fortress_cannon'
  | 'steam_repeater'
  | 'boiler_mortar'
  | 'mg_nest'
  | 'howitzer_turret'
  | 'vulcan_ciws'
  | 'missile_pod'
  | 'plasma_repeater'
  | 'ion_cannon'
  | 'prism_spire'
  | 'singularity_cannon'
  | 'chrono_pylon'
  | 'eternity_beam';

export type SoundCue =
  | 'melee_wood'
  | 'melee_metal'
  | 'melee_energy'
  | 'bow'
  | 'gun'
  | 'cannon'
  | 'flame'
  | 'rocket'
  | 'laser'
  | 'railgun'
  | 'explosion'
  | 'spawn'
  | 'turret_build'
  | 'sell'
  | 'evolve'
  | 'ultimate'
  | 'hit_base'
  | 'victory'
  | 'defeat';

export interface UnitDef {
  id: UnitVisualKind;
  eraIndex: number;
  name: string;
  shortName: string;
  role: UnitRole;
  cost: number;
  trainTime: number;
  maxHp: number;
  damage: number;
  attackRate: number; // attacks per second
  range: number;
  speed: number;
  width: number;
  height: number;
  armor: number; // 0..0.35 damage reduction
  armorPierce: boolean;
  critChance: number;
  splashRadius: number;
  pierceCount: number; // > 1 for piercing beams/flames
  baseDamageMult: number;
  knockback: number;
  killGold: number;
  killXp: number;
  projectile?: ProjectileStyle;
  projectileSpeed?: number;
  projectileArc?: number;
  attackSound: SoundCue;
  isMechanical?: boolean;
  /** Optional hovering height above ground shadow for drones & floating cosmic entities */
  hoverHeight?: number;
}

export interface TurretDef {
  id: TurretVisualKind;
  eraIndex: number;
  name: string;
  shortName: string;
  cost: number;
  damage: number;
  attackRate: number;
  range: number;
  splashRadius: number;
  armorPierce: boolean;
  projectile: ProjectileStyle;
  projectileSpeed: number;
  projectileArc: number;
  fireSound: SoundCue;
}

export interface UltimateDef {
  kind: UltimateKind;
  eraIndex: number;
  name: string;
  shortName: string;
  description: string;
  xpCost: number;
  cooldown: number;
  duration: number;
  strikeCount: number;
  damagePerStrike: number;
  radius: number;
  accentColor: string;
}

export interface EraPalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sunColor: string;
  farHill: string;
  midHill: string;
  nearProp: string;
  groundTop: string;
  groundMid: string;
  groundDark: string;
  accent: string;
}

export interface EraDef {
  index: number; // 0..11
  eraNumber: number; // 1..12
  name: string;
  shortName: string;
  roman: string;
  evolveXp: number; // XP needed to advance from this era to the next (0 for final era)
  baseMaxHp: number;
  passiveGoldPerSec: number;
  units: UnitDef[];
  turrets: TurretDef[];
  ultimate: UltimateDef;
  palette: EraPalette;
}

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  shortTag: string;
  accentColor: string;
  description: string;
  aiGoldMultiplier: number;
  aiXpMultiplier: number;
  aiThinkInterval: number;
  aiMaxTurrets: number;
  aiUsesUltimate: boolean;
  aiEvolveDelay: number;
  aiMaxUpgradeLevel: number;
  aiUpgradeChance: number;
  aiStartingGoldBonus: number;
  aiUnitStatMult: number;
  aiCounterSmartness: number;
  aiMaxQueue: number;
}

export interface QueuedUnit {
  unitId: UnitVisualKind;
  eraIndex: number;
  cost: number;
  trainTime: number;
  remaining: number;
}

export interface InstalledTurret {
  slotIndex: number;
  turretId: TurretVisualKind;
  eraIndex: number;
  cost: number;
  cooldown: number;
  aimAngle: number;
  recoil: number;
}

export interface FactionState {
  team: Team;
  eraIndex: number;
  gold: number;
  xp: number;
  totalXp: number;
  baseHp: number;
  baseMaxHp: number;
  displayBaseHp: number;
  turretSlots: number;
  turrets: (InstalledTurret | null)[];
  queue: QueuedUnit[];
  upgrades: UpgradeLevels;
  ultimateCooldown: number;
  ultimateMaxCooldown: number;
  baseHitFlash: number;
  evolveFlash: number;
  upgradeFlash: number;
  kills: number;
  unitsSpawned: number;
  /** Chrono Fever: kill streak gauge (0..10) & active golden frenzy timer */
  feverKills: number;
  feverTimer: number;
  feverDuration: number;
}

export interface UnitEntity {
  uid: number;
  team: Team;
  def: UnitDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  displayHp: number;
  displayHpHold: number;
  state: 'walk' | 'attack' | 'idle' | 'dead';
  attackCooldown: number;
  attackAnim: number; // 0..1 progress of current swing/recoil
  walkPhase: number;
  hitFlash: number;
  lastHitCrit: boolean;
  upgradeFlash: number;
  knockbackVel: number;
  deathTimer: number;
  /** Veteran promotion progression: 1 kill -> ★, 3 kills -> ★★, 5 kills -> ★★★ */
  kills: number;
  vetRank: 0 | 1 | 2 | 3;
}

export interface SupplyCrateEntity {
  uid: number;
  x: number;
  y: number;
  vy: number;
  landed: boolean;
  hp: number;
  maxHp: number;
  goldReward: number;
  xpReward: number;
  hitFlash: number;
  life: number;
  maxLife: number;
}

export interface ProjectileEntity {
  uid: number;
  team: Team;
  style: ProjectileStyle;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  gravity: number;
  damage: number;
  splashRadius: number;
  armorPierce: boolean;
  isCrit: boolean;
  baseDamageMult: number;
  knockback: number;
  pierceRemaining: number;
  hitUids: number[];
  life: number;
  maxLife: number;
  targetX?: number;
  sourceUnitUid?: number;
}

export interface BeamEffect {
  uid: number;
  team: Team;
  style:
    | 'railgun'
    | 'ion_beam'
    | 'lightning'
    | 'tesla_arc'
    | 'orbital_laser'
    | 'flame_jet'
    | 'solar_beam'
    | 'gravity_beam'
    | 'black_hole_vortex'
    | 'chrono_beam'
    | 'chrono_nova_pillar';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: string;
  life: number;
  maxLife: number;
  seed: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  shape: 'circle' | 'spark' | 'smoke' | 'ring' | 'debris' | 'flash_star' | 'fireball' | 'dust_wave';
  rotation?: number;
  vRot?: number;
}

export interface SlashEffect {
  x: number;
  y: number;
  dir: 1 | -1;
  radius: number;
  color: string;
  coreColor: string;
  life: number;
  maxLife: number;
  angleOffset: number;
  style: 'heavy' | 'blade' | 'thrust' | 'plasma';
}

export interface ScorchMark {
  x: number;
  radius: number;
  glowColor: string;
  life: number;
  maxLife: number;
}

export interface DamagePopup {
  x: number;
  y: number;
  vx?: number;
  vy: number;
  text: string;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
  kind?: 'normal' | 'crit' | 'elemental' | 'player_hit' | 'gold' | 'base' | 'heal';
}

export interface ActiveUltimate {
  uid: number;
  team: Team;
  def: UltimateDef;
  elapsed: number;
  duration: number;
  strikesFired: number;
  nextStrikeAt: number;
  /** Visual projectiles/aircraft specific to active ultimate */
  planes?: { x: number; y: number; speed: number; dir: 1 | -1; kind?: 'bomber' | 'zeppelin' }[];
  fallingOrdinance: {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    vx: number;
    vy: number;
    impacted: boolean;
    kind: UltimateKind;
    trail: { x: number; y: number }[];
  }[];
}

export interface EngineCallbacks {
  onSound?: (cue: SoundCue) => void;
  onBanner?: (title: string, subtitle: string, accent: string) => void;
}

export interface GameSnapshot {
  status: GameStatus;
  difficulty: DifficultyId;
  speed: 1 | 2;
  elapsed: number;
  player: FactionState;
  enemy: FactionState;
  units: UnitEntity[];
  supplyCrates: SupplyCrateEntity[];
  projectiles: ProjectileEntity[];
  beams: BeamEffect[];
  particles: ParticleEntity[];
  slashes: SlashEffect[];
  scorchMarks: ScorchMark[];
  popups: DamagePopup[];
  ultimates: ActiveUltimate[];
  eraTransition: {
    active: boolean;
    fromEra: number;
    toEra: number;
    progress: number;
  };
}
