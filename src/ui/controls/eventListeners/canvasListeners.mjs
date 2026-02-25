/** @typedef {import('../../../core/systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */
/**
 * Initializes canvas event listeners.
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Object} blocks
 * @param {import('signal-polyfill').Signal.State<number>} curBlock
 *
 * @returns {void}
 */
export function initCanvasEventListeners(shadow, cnvs, blocks, curBlock) {
  cnvs.addEventListener("click", () => {
    const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
    const gameConfig = gThis.blockGarden.config;
    if (gameConfig.useSplitControls.get()) {
      cnvs?.requestPointerLock();
    }
  });

  const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
  gThis.addEventListener(
    "contextmenu",
    (e) => {
      // If we just activated a Link or Text block, prevent the context menu
      const gameState = gThis.blockGarden.state;
      if (gameState.preventNextContextMenu) {
        e.preventDefault();

        gameState.preventNextContextMenu = false;

        return;
      }

      const target = e.target;

      // If the context menu is triggered on the canvas, prevent it (standard game behavior)
      if (
        target === cnvs ||
        (target instanceof Element && cnvs.contains(target))
      ) {
        e.preventDefault();
      }
    },
    true,
  );
}
