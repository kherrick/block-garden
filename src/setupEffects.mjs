import { effect } from "../deps/signal.mjs";

import { computedSignals, configSignals, stateSignals } from "./state.mjs";
import { updateInventoryDisplay } from "./updateInventoryDisplay.mjs";

export function setupEffects(doc) {
  // Set up reactive effects for UI updates
  effect(() => {
    // Auto-update inventory display when seed inventory changes
    const inventory = stateSignals.seedInventory.get();
    updateInventoryDisplay(doc, stateSignals);
  });

  effect(() => {
    // Auto-update inventory display when materials inventory changes
    const materialsInventory = stateSignals.materialsInventory.get();
    updateInventoryDisplay(doc, stateSignals);
  });

  effect(() => {
    // Auto-update UI when computed values change
    const biome = computedSignals.currentBiome.get() || { name: "Unknown" };
    const depth = computedSignals.currentDepth.get();
    const gameTime = stateSignals.gameTime.get();
    const viewMode = stateSignals.viewMode.get();

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
    const fogMode = configSignals.fogMode.get();

    const fogModeTextEl = doc.getElementById("fogModeText");
    if (fogModeTextEl) {
      fogModeTextEl.textContent = fogMode === "fog" ? "Fog" : "Clear";
    }
  });

  effect(() => {
    // Auto-update break mode display
    const breakMode = configSignals.breakMode.get();

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
    const selectedSeed = stateSignals.selectedSeedType.get();

    const selectedSeedEl = doc.getElementById("selectedSeed");
    if (selectedSeedEl) {
      selectedSeedEl.textContent = selectedSeed || "None";
    }
  });

  effect(() => {
    // Auto-update selected material display
    const selectedMaterial = stateSignals.selectedMaterialType.get();

    const selectedMaterialEl = doc.getElementById("selectedMaterial");
    if (selectedMaterialEl) {
      selectedMaterialEl.textContent = selectedMaterial || "None";
    }
  });
}
