/** @typedef {import('../state/config/index.mjs').GameConfig} GameConfig */

/**
 * Resizes the game canvas based on the configured resolution setting.
 *
 * Supports fixed resolutions (400, 800) and fullscreen mode.
 * Updates CSS classes and fog scale accordingly.
 *
 * @param {ShadowRoot} shadow - Shadow root containing the canvas element
 * @param {GameConfig} gameConfig - Game configuration object
 *
 * @returns {void}
 */
export function resizeCanvas(shadow, gameConfig) {
  const cnvs = shadow.getElementById("canvas");
  if (cnvs instanceof HTMLCanvasElement) {
    const currentResolution = gameConfig.currentResolution?.get();
    if (currentResolution === "fullscreen") {
      // Fullscreen mode
      shadow?.host.classList.remove(
        "resolution",
        "resolution-400",
        "resolution-800",
      );

      cnvs.width = window.innerWidth;
      cnvs.height = window.innerHeight;
      cnvs.style.width = "100vw";
      cnvs.style.height = "100vh";

      gameConfig.fogScale.set(36);

      return;
    }

    // Fixed resolution mode
    shadow.host.classList.add("resolution");
    shadow.host.classList.remove("resolution-400", "resolution-800");

    const size = parseInt(currentResolution);
    cnvs.width = size;
    cnvs.height = size;
    cnvs.style.width = size + "px";
    cnvs.style.height = size + "px";

    shadow.host.classList.add(`resolution-${size}`);

    if (currentResolution === "800") {
      gameConfig.fogScale.set(24);

      return;
    }

    // update scale for remaining resolutions
    gameConfig.fogScale.set(12);
  }
}
