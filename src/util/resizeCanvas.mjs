/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../state/config/index.mjs').GameConfig} GameConfig */

/**
 * Resizes the game canvas based on the configured resolution setting.
 *
 * Supports fixed resolutions (400, 800) and fullscreen mode.
 * Updates CSS classes and fog scale accordingly.
 *
 * @param {ShadowRoot} shadow - Shadow root containing the canvas element
 * @param {Signal.State} currentResolution - Signal State for current resolution
 *
 * @returns {void}
 */
export function resizeCanvas(shadow, currentResolution) {
  const cnvs = shadow.getElementById("canvas");
  if (cnvs instanceof HTMLCanvasElement) {
    const resolution = currentResolution.get();
    if (resolution === "fullscreen") {
      // Fullscreen mode
      shadow.host.classList.remove(
        "resolution",
        "resolution-400",
        "resolution-600",
        "resolution-800",
      );

      cnvs.width = globalThis.innerWidth;
      cnvs.height = globalThis.innerHeight;
      cnvs.style.width = "100vw";
      cnvs.style.width = "100dvw";
      cnvs.style.height = "100vh";
      cnvs.style.height = "100dvh";

      return;
    }

    // Fixed resolution mode
    shadow.host.classList.add("resolution");
    shadow.host.classList.remove(
      "resolution-400",
      "resolution-600",
      "resolution-800",
    );

    const size = parseInt(resolution);
    cnvs.width = size;
    cnvs.height = size;
    cnvs.style.width = size + "px";
    cnvs.style.height = size + "px";

    shadow.host.classList.add(`resolution-${size}`);
  }
}
