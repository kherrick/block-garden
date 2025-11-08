import { effect } from "../../deps/signal.mjs";

import { updateInventoryUI } from "../update/ui/inventory.mjs";

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

    if (seedInput && !seedInput.value) {
      const currentSeedDisplay = shadow.getElementById("currentSeed");
      const currentWorldSeed = worldSeed.get();

      if (currentSeedDisplay && currentWorldSeed) {
        seedInput.value = currentWorldSeed;
        currentSeedDisplay.textContent = currentWorldSeed;

        return;
      }

      const randomSeed = getRandomSeed();

      seedInput.value = randomSeed;
      currentSeedDisplay.textContent = randomSeed;
    }
  });

  effect(() => {
    // Auto-update gameState
    const currentGameTime = gameTime.get();
    const gameTimeEl = shadow.getElementById("gameTime");

    if (gameTimeEl) {
      gameTimeEl.textContent = Math.floor(currentGameTime);
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
      selectedSeedEl.textContent = selectedSeed || "None";
    }
  });

  effect(() => {
    // Auto-update selected material display
    const selectedMaterial = selectedMaterialType.get();

    const selectedMaterialEl = shadow.getElementById("selectedMaterial");
    if (selectedMaterialEl) {
      selectedMaterialEl.textContent = selectedMaterial || "None";
    }
  });
}
