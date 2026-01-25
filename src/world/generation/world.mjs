import { initNoise } from "../../utils/noise.mjs";

import { CLOUD_HEIGHT_MIN } from "./chunk.mjs";

/**
 * @typedef {import('../config/index.mjs').gameConfig} GameConfig
 */

/**
 * @typedef {import('../../core/systems/game/state.mjs').gameState} GameState
 */

/**
 * @typedef {import('../../core/systems/game/state.mjs').computedSignals} ComputedSignals
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
  gameState.y = CLOUD_HEIGHT_MIN - 1;
  gameState.x = 0;
  gameState.z = 0;
  gameState.dy = 0;
  gameState.onGround = false;
}

/**
 * @param {number} seed
 * @param {number} [newSeed=null]
 *
 * @returns {void}
 */
export function initNewWorld(seed, newSeed = null) {
  let currentSeed;

  if (newSeed !== null) {
    seed = newSeed;
    currentSeed = newSeed;
  } else {
    currentSeed = seed;
  }

  globalThis.blockGarden.gameTime = 0;

  generateWorld(currentSeed, globalThis.blockGarden.state);
}
