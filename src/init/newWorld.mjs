import { generateProceduralWorld } from "../generate/world.mjs";

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

  generateProceduralWorld(currentSeed, globalThis.blockGarden.state);
}
