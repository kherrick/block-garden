import { effect } from "../util/effect.mjs";

import { updateInventoryUI } from "../update/ui/inventory.mjs";
import { getRandomSeed } from "../misc/getRandomSeed.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/**
 * @param {ShadowRoot} shadow
 * @param {Signal.State} totalSeeds
 * @param {Signal.State} breakMode
 * @param {Signal.State} fogMode
 * @param {Signal.State} worldSeed
 * @param {Signal.State} gameTime
 * @param {Signal.State} materialsInventory
 * @param {Signal.State} seedInventory
 * @param {Signal.State} selectedMaterialType
 * @param {Signal.State} selectedSeedType
 * @param {Signal.State} viewMode
 *
 * @returns {void}
 */
export function initEffects(
  shadow,
  totalSeeds,
  breakMode,
  fogMode,
  worldSeed,
  gameTime,
  materialsInventory,
  seedInventory,
  selectedMaterialType,
  selectedSeedType,
  viewMode,
) {
  // Set up reactive effects for UI updates
  effect(() => {
    // Auto-update inventory display when materials or seeds change
    updateInventoryUI(shadow, materialsInventory.get(), seedInventory.get());
  });

  effect(() => {
    const seedInput = shadow.getElementById("worldSeedInput");

    if (seedInput instanceof HTMLInputElement && !seedInput.value) {
      const currentSeedDisplay = shadow.getElementById("currentSeed");
      const currentWorldSeed = worldSeed.get();

      if (currentSeedDisplay && currentWorldSeed) {
        seedInput.value = currentWorldSeed;
        currentSeedDisplay.textContent = currentWorldSeed;

        return;
      }

      const randomSeed = String(getRandomSeed());

      seedInput.value = randomSeed;

      currentSeedDisplay.textContent = randomSeed;
    }
  });

  effect(() => {
    // Auto-update gameState
    const currentGameTime = gameTime.get();

    const gameTimeEl = shadow.getElementById("gameTime");
    if (gameTimeEl) {
      gameTimeEl.textContent = String(Math.floor(currentGameTime));
    }
  });

  effect(() => {
    // Auto-update viewMode
    const currentViewMode = viewMode.get();

    const viewModeTextEl = shadow.getElementById("viewModeText");
    if (viewModeTextEl) {
      viewModeTextEl.textContent =
        currentViewMode === "normal" ? "View Normal" : "View X-Ray";
    }
  });

  effect(() => {
    // Auto-update fogMode
    const currentFogMode = fogMode.get();

    const fogModeTextEl = shadow.getElementById("fogModeText");
    if (fogModeTextEl) {
      fogModeTextEl.textContent = currentFogMode === "fog" ? "Fog" : "Clear";
    }
  });

  effect(() => {
    // Auto-update breakMode
    const currentBreakMode = breakMode.get();

    const breakModeTextEl = shadow.getElementById("breakModeText");
    if (breakModeTextEl) {
      breakModeTextEl.textContent =
        currentBreakMode === "regular" ? "Dig Regular" : "Dig Extra";
    }
  });

  effect(() => {
    // Auto-update total seeds display
    const currentTotalSeeds = totalSeeds.get();

    const seedCountEl = shadow.getElementById("seedCount");
    if (seedCountEl) {
      seedCountEl.textContent = currentTotalSeeds;
    }
  });

  effect(() => {
    // Auto-update selected seed display
    const selectedSeed = selectedSeedType.get();

    const selectedSeedEl = shadow.getElementById("selectedSeed");
    if (selectedSeedEl) {
      selectedSeedEl.textContent = selectedSeed?.replace("_", " ") || "None";
    }
  });

  effect(() => {
    // Auto-update selected material display
    const selectedMaterial = selectedMaterialType.get();

    const selectedMaterialEl = shadow.getElementById("selectedMaterial");
    if (selectedMaterialEl) {
      selectedMaterialEl.textContent =
        selectedMaterial?.replace("_", " ") || "None";
    }
  });
}
