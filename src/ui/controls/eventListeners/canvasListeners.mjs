/**
 * Initializes canvas event listeners.
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Object} blocks
 * @param {Signal.State} curBlock
 *
 * @returns {void}
 */
/** @typedef {import('signal-polyfill').Signal.State} Signal.State */
export function initCanvasEventListeners(shadow, cnvs, blocks, curBlock) {
  cnvs.addEventListener("click", () => {
    // @ts-ignore
    const gameConfig = globalThis.blockGarden.config;
    if (gameConfig.useSplitControls.get()) {
      cnvs?.requestPointerLock();
    }
  });

  globalThis.addEventListener(
    "contextmenu",
    (e) => {
      // If we just activated a Link or Text block, prevent the context menu
      const gameState = globalThis.blockGarden.state;
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
