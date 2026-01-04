import { gameConfig } from "../state/config/index.mjs";
import { gameState } from "../state/state.mjs";

import { effect } from "../util/effect.mjs";
import { getRandomSeed } from "../util/getRandomSeed.mjs";
import { updateFlightToggleButton } from "./eventListeners.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/**
 * @param {ShadowRoot} shadow
 * @param {Signal.State} currentBlock
 *
 * @returns {void}
 */
export function initEffects(shadow, currentBlock) {
  // Set up reactive effects for UI updates
  effect(() => {
    const blockName = shadow.getElementById("blockName");
    blockName.textContent = currentBlock.get();
  });

  effect(() => {
    const touchControls = shadow.querySelector(".touch-controls");
    if (touchControls && gameConfig.useTouchControls.get()) {
      touchControls.removeAttribute("hidden");
    } else {
      touchControls.setAttribute("hidden", "");
    }
  });

  effect(() => {
    const flightToggle = shadow.getElementById("toggleFlight");
    const flyButton = shadow.getElementById("fly");
    const descendButton = shadow.getElementById("descend");
    if (flightToggle && flyButton && descendButton) {
      const isFlying = gameState.flying.get();
      if (isFlying) {
        descendButton.removeAttribute("hidden");
        flyButton.removeAttribute("hidden");
      } else {
        descendButton.setAttribute("hidden", "hidden");
        flyButton.setAttribute("hidden", "hidden");
      }

      updateFlightToggleButton(flightToggle, isFlying);
    }
  });

  effect(() => {
    const seedInput = shadow.getElementById("worldSeedInput");

    if (seedInput instanceof HTMLInputElement && !seedInput.value) {
      const currentSeedDisplay = shadow.getElementById("currentSeed");
      const currentWorldSeed = globalThis.blockGarden.state.seed;

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
}

/**
 * Initialize material bar rendering effects.
 *
 * @param {ShadowRoot} shadow
 * @param {Function} renderCallback - Callback to render material bar
 *
 * @returns {void}
 */
export function initMaterialBarEffects(shadow, renderCallback) {
  const gameState = globalThis.blockGarden?.state;
  const config = globalThis.blockGarden?.config;

  if (!gameState || !config) {
    console.error(
      "Game state or config not initialized for material bar effects",
    );
    return;
  }

  // Material bar effect to re-render when state changes
  effect(() => {
    renderCallback(
      shadow,
      gameState.materialBar.get(),
      gameState.activeMaterialBarSlot.get(),
      config.blocks,
    );
  });
}
