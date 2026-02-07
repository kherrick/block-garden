import { getRandomSeed } from "../../../utils/getRandomSeed.mjs";

import { generateWorld } from "../../../core/world/generation/world.mjs";

/** @typedef {import('../../../core/systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */

/**
 * Handles the random seed button click.
 *
 * @param {ShadowRoot} shadow
 */
export function handleRandomSeedButton(shadow) {
  const currentSeedDisplay = shadow.getElementById("currentSeed");
  const seedInput = shadow.getElementById("worldSeedInput");
  const randomSeed = getRandomSeed();

  if (seedInput instanceof HTMLInputElement) {
    seedInput.value = String(randomSeed);
  }

  if (currentSeedDisplay) {
    currentSeedDisplay.textContent = String(randomSeed);
  }

  const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
  generateWorld(randomSeed, gThis.blockGarden.state);

  console.log(`Generated new world with random seed: ${randomSeed}`);
}
