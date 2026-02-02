import isNumber from "lodash.isnumber";

import { showToast } from "../../../api/ui/toast.mjs";

import { generateWorld } from "../../../world/generation/world.mjs";

/**
 * Handles the generate button click.
 *
 * @param {ShadowRoot} shadow
 */
export function handleGenerateButton(shadow) {
  /** @type string | null */
  let seedInputValue = null;
  const seedInput = shadow.getElementById("worldSeedInput");
  if (seedInput instanceof HTMLInputElement) {
    seedInputValue = seedInput.value;
  }

  const currentSeedDisplay = shadow.getElementById("currentSeed");

  const seedValue = Number(seedInputValue);
  if (!isNumber(seedValue) || isNaN(seedValue)) {
    showToast(shadow, "Invalid seed. Please enter a number.");
    return;
  }

  if (seedValue < 1 || seedValue > Number.MAX_SAFE_INTEGER) {
    showToast(shadow, `Seed must be between 1 and ${Number.MAX_SAFE_INTEGER}.`);
    return;
  }

  generateWorld(seedValue, globalThis.blockGarden.state);

  console.log(`Generated new world with seed: ${seedValue}`);

  currentSeedDisplay.textContent = String(seedValue);
}
