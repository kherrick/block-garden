import { initNoise, terrainNoise } from "../util/noise.mjs";

/**
 * @typedef {import('../state/config/index.mjs').gameConfig} GameConfig
 */

/**
 * @typedef {import('../state/state.mjs').gameState} GameState
 */

/**
 * @typedef {import('../state/state.mjs').computedSignals} ComputedSignals
 */

/**
 * Initialize procedural world generation.
 * Terrain is generated lazily per-chunk as player moves.
 *
 * @param {number} seed
 * @param {GameState} gameState
 */
export function generateWorld(seed, gameState) {
  const { world } = gameState;

  // Initialize noise generator with seed
  initNoise(seed);

  // Store seed for saving and chunk generation
  gameState.seed = seed;

  // Clear existing world
  world.clear();

  // Clear plant structures and growth timers
  gameState.plantStructures = {};
  gameState.growthTimers = {};

  // Calculate spawn height at origin
  const SEA_LEVEL = 4;
  const n = terrainNoise(0, 0, seed);
  let spawnY = Math.floor(((n + 1) / 2) * 12 + 2);
  spawnY = Math.max(spawnY, SEA_LEVEL + 1);

  // Set spawn position (terrain will generate around player)
  gameState.y = spawnY + 10 + (1.62 - gameState.playerHeight / 2);
  gameState.x = 0;
  gameState.z = 0;
  gameState.dy = 0;
  gameState.onGround = false;
}
