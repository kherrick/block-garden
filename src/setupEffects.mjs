import { effect } from "../deps/signal.mjs";

import { computedSignals, gameConfig, gameState } from "./state.mjs";
import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

export function setupEffects(doc) {
  // Set up reactive effects for UI updates
  effect(() => {
    // Auto-update inventory display when seed inventory changes
    const inventory = gameState.seedInventory.get();
    updateInventoryDisplay(doc, gameState);
  });

  effect(() => {
    // Auto-update inventory display when materials inventory changes
    const materialsInventory = gameState.materialsInventory.get();
    updateInventoryDisplay(doc, gameState);
  });

  effect(() => {
    // Auto-update UI when computed values change
    const biome = computedSignals.currentBiome.get() || { name: "Unknown" };
    const depth = computedSignals.currentDepth.get();
    const gameTime = gameState.gameTime.get();
    const viewMode = gameState.viewMode.get();

    const currentBiomeEl = doc.getElementById("currentBiome");
    if (currentBiomeEl) currentBiomeEl.textContent = biome.name;

    const currentDepthEl = doc.getElementById("currentDepth");
    if (currentDepthEl) currentDepthEl.textContent = depth;

    const gameTimeEl = doc.getElementById("gameTime");
    if (gameTimeEl) gameTimeEl.textContent = Math.floor(gameTime);

    const viewModeTextEl = doc.getElementById("viewModeText");
    if (viewModeTextEl) {
      viewModeTextEl.textContent =
        viewMode === "normal" ? "View Normal" : "View X-Ray";
    }
  });

  effect(() => {
    // Auto-update fogMode mode display
    const fogMode = gameConfig.fogMode.get();

    const fogModeTextEl = doc.getElementById("fogModeText");
    if (fogModeTextEl) {
      fogModeTextEl.textContent = fogMode === "fog" ? "Fog" : "Clear";
    }
  });

  effect(() => {
    // Auto-update break mode display
    const breakMode = gameConfig.breakMode.get();

    const breakModeTextEl = doc.getElementById("breakModeText");
    if (breakModeTextEl) {
      breakModeTextEl.textContent =
        breakMode === "regular" ? "Dig Regular" : "Dig Extra";
    }
  });

  effect(() => {
    // Auto-update total seeds display
    const totalSeeds = computedSignals.totalSeeds.get();

    const seedCountEl = doc.getElementById("seedCount");
    if (seedCountEl) {
      seedCountEl.textContent = totalSeeds;
    }
  });

  effect(() => {
    // Auto-update selected seed display
    const selectedSeed = gameState.selectedSeedType.get();

    const selectedSeedEl = doc.getElementById("selectedSeed");
    if (selectedSeedEl) {
      selectedSeedEl.textContent = selectedSeed || "None";
    }
  });

  effect(() => {
    // Auto-update selected material display
    const selectedMaterial = gameState.selectedMaterialType.get();

    const selectedMaterialEl = doc.getElementById("selectedMaterial");
    if (selectedMaterialEl) {
      selectedMaterialEl.textContent = selectedMaterial || "None";
    }
  });
}
