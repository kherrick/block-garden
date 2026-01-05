import { initNoise } from "../util/noise.mjs";

import { MAX_Y } from "./chunkGenerator.mjs";

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

  // Set spawn in sky (drop)
  gameState.y = MAX_Y;
  gameState.x = 0;
  gameState.z = 0;
  gameState.dy = 0;
  gameState.onGround = false;
}
