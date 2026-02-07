import { gameConfig } from "../core/world/config/index.mjs";
import { gameState } from "../core/systems/game/state.mjs";

import { effect } from "../utils/effect.mjs";
import { getRandomSeed } from "../utils/getRandomSeed.mjs";
import { updateFlightToggleButton } from "../ui/utils/flightToggle.mjs";

/**
 * @typedef {Object} SignalState
 * @property {() => any} get
 */

/**
 * @param {ShadowRoot} shadow
 * @param {SignalState} currentBlock
 *
 * @returns {void}
 */
export function initEffects(shadow, currentBlock) {
  // Set up reactive effects for UI updates
  effect(() => {
    const blockName = shadow.getElementById("blockName");
    if (blockName) blockName.textContent = currentBlock.get();
  });

  effect(() => {
    const touchControls = /** @type {HTMLElement | null} */ (
      shadow.querySelector(".touch-controls")
    );
    if (touchControls) {
      if (gameConfig.useTouchControls.get()) {
        touchControls.removeAttribute("hidden");
      } else {
        touchControls.setAttribute("hidden", "");
      }
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
      const currentSeedDisplay = /** @type {HTMLElement | null} */ (
        shadow.getElementById("currentSeed")
      );
      const gThis =
        /** @type {import('../core/systems/game/state.mjs').BlockGardenGlobalThis} */ (
          globalThis
        );
      const currentWorldSeed = gThis.blockGarden.state.seed;

      if (currentSeedDisplay && currentWorldSeed) {
        seedInput.value = String(currentWorldSeed);
        currentSeedDisplay.textContent = String(currentWorldSeed);

        return;
      }

      const randomSeed = String(getRandomSeed());

      seedInput.value = randomSeed;

      if (currentSeedDisplay) {
        currentSeedDisplay.textContent = randomSeed;
      }
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
  const gThis =
    /** @type {import('../core/systems/game/state.mjs').BlockGardenGlobalThis} */ (
      globalThis
    );
  const gameState = gThis.blockGarden?.state;
  const config = gThis.blockGarden?.config;

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
      gameState.materialsInventory.get(),
      gameState.seedsInventory.get(),
    );
  });
}
