export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 468;
export const GROUND_Y = 326;

export const PLAYER_BASE_X = 125;
export const ENEMY_BASE_X = WORLD_WIDTH - 125; // 2275
export const BASE_WIDTH = 176;
export const BASE_HALF_WIDTH = BASE_WIDTH / 2;

export const PLAYER_BASE_FRONT_X = PLAYER_BASE_X + BASE_HALF_WIDTH; // 213
export const ENEMY_BASE_FRONT_X = ENEMY_BASE_X - BASE_HALF_WIDTH; // 2187

export const PLAYER_SPAWN_X = PLAYER_BASE_FRONT_X + 10;
export const ENEMY_SPAWN_X = ENEMY_BASE_FRONT_X - 10;

export const STARTING_GOLD = 175;
export const MAX_QUEUE_SIZE = 5;
export const MAX_UNITS_PER_TEAM = 18;
export const MAX_TURRET_SLOTS = 4;

/** Cost to unlock slot #2, #3, #4 (index 0 -> slot 2, etc.) */
export const TURRET_SLOT_COSTS = [120, 400, 1200] as const;

export const TURRET_SELL_REFUND_RATE = 0.5;
export const UNIT_DEATH_DURATION = 0.65;
export const CRIT_MULTIPLIER = 1.6;
export const LOSS_XP_RATIO = 0.2;
export const BASE_HIT_XP_PER_100_DMG = 14;

/** Turret mount offsets relative to base center (x offset flipped for enemy) */
export const TURRET_MOUNT_OFFSETS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 30, dy: -94 },
  { dx: -12, dy: -124 },
  { dx: 24, dy: -154 },
  { dx: -16, dy: -184 },
];
