import { gameConfig } from "../state/config/index.mjs";
import { effect } from "../util/effect.mjs";
import { getRandomSeed } from "../util/getRandomSeed.mjs";

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
