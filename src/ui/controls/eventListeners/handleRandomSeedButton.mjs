import { getRandomSeed } from "../../../utils/getRandomSeed.mjs";

import { generateWorld } from "../../../world/generation/world.mjs";

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

  currentSeedDisplay.textContent = String(randomSeed);

  generateWorld(randomSeed, globalThis.blockGarden.state);

  console.log(`Generated new world with random seed: ${randomSeed}`);
}
