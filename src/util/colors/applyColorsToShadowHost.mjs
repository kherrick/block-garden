/** @typedef {import("./index.mjs").CombinedColorMap} CombinedColorMap */

/**
 * Apply custom colors to ShadowRoot Host
 *
 * @param {ShadowRoot} shadow
 * @param {CombinedColorMap} colorProps
 *
 * @returns {void}
 */
export function applyColorsToShadowHost(shadow, colorProps) {
  for (const [property, value] of Object.entries(colorProps)) {
    if (shadow.host instanceof HTMLElement) {
      shadow.host.style.setProperty(property, value);
    }
  }
}
