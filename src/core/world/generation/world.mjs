import { initNoise } from "../../../utils/noise.mjs";

import { CLOUD_HEIGHT_MIN } from "./chunk.mjs";

/**
 * @typedef {import('../config/index.mjs').gameConfig} GameConfig
 */

/**
 * @typedef {import('../../systems/game/state.mjs').gameState} GameState
 */

/**
 * @typedef {import('../../systems/game/state.mjs').computedSignals} ComputedSignals
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
 * @param {number} seed - World seed
 * @param {number} [newSeed] - Optional new seed to use
 *
 * @returns {void}
 */
export function initNewWorld(seed, newSeed) {
  let currentSeed;

  if (newSeed !== undefined && newSeed !== null) {
    seed = newSeed;
    currentSeed = newSeed;
  } else {
    currentSeed = seed;
  }

  // @ts-ignore - globalThis.blockGarden is set at runtime
  const gThis =
    /** @type {import('../../systems/game/state.mjs').BlockGardenGlobalThis} */ (
      globalThis
    );
  const bg = gThis.blockGarden;
  if (bg) {
    bg.state.gameTime = 0;
    generateWorld(currentSeed, bg.state);
  }
}
