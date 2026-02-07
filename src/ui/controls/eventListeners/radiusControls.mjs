import { effect } from "../../../utils/effect.mjs";

/** @typedef {import('../../../core/systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */

/**
 * Initialize radius control listeners
 *
 * @param {ShadowRoot} shadow
 */
export function initRadiusControlListeners(shadow) {
  const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
  const gameConfig = gThis.blockGarden.config;

  const radiusSettings = [
    { id: "viewRadius", signal: gameConfig.viewRadius },
    { id: "cacheRadius", signal: gameConfig.cacheRadius },
    { id: "renderRadius", signal: gameConfig.renderRadius },
    { id: "worldRadius", signal: gameConfig.worldRadius },
  ];

  radiusSettings.forEach(({ id, signal }) => {
    const input = shadow.getElementById(`${id}Input`);
    const display = shadow.getElementById(`${id}Display`);

    if (input instanceof HTMLInputElement && display) {
      // Synchronize slider and display with signal
      effect(() => {
        const currentVal = signal.get();
        input.value = String(currentVal);

        display.textContent = String(
          currentVal === null || currentVal > 2048 ? "∞" : currentVal,
        );
      });

      // Update signal on change
      input.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
          signal.set(parseInt(e.target.value, 10));
        }
      });
    }
  });
}
