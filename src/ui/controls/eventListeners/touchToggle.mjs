import { effect } from "../../../utils/effect.mjs";
import { persistValue } from "../../../core/systems/persistence.mjs";

/**
 * Initializes the touch controls toggle.
 *
 * @param {ShadowRoot} shadow
 */
export function initTouchToggle(shadow) {
  const gameConfig = globalThis.blockGarden.config;
  const toggleTouchControls = shadow.getElementById("toggleTouchControls");

  if (toggleTouchControls) {
    toggleTouchControls.addEventListener("click", async () => {
      const newValue = !gameConfig.useTouchControls.get();
      gameConfig.useTouchControls.set(newValue);

      await persistValue("config", "useTouchControls", newValue);
    });

    effect(() => {
      const enabled = gameConfig.useTouchControls.get();

      toggleTouchControls.textContent = enabled
        ? "Disable Touch Controls"
        : "Enable Touch Controls";

      toggleTouchControls.style.backgroundColor = enabled
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      toggleTouchControls.style.color = "var(--bg-color-white)";
    });
  }
}
