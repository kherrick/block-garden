import { gameConfig } from "../state/config/index.mjs";
import { effect } from "../util/effect.mjs";

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
}
