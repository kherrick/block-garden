import { gameColors } from "../../state/config/colors.mjs";

import { buildStyleMapByPropNames } from "./buildStyleMapByPropNames.mjs";

/** @typedef {import('./index.mjs').CombinedMap} CombinedMap */

/**
 * Extracts all CSS custom properties prefixed with --sg from the computed styles of a shadow DOM host.
 *
 * Used for both general UI colors and game tile colors, as defined in the gameColors object, and returns
 * them as a combined map.
 *
 * @param {object} gThis - The global context or window object that provides getComputedStyle.
 * @param {ShadowRoot} shadow - The shadow root whose host's computed styles will be inspected.
 *
 * @returns {CombinedMap} An object mapping CSS custom property names (without the --sg- prefix) to their values.
 *
 * @example
 * const cssProps = getCustomProperties(window, shadowRoot);
 * console.log(cssProps["color-amber-500"]); // e.g., "f39c12"
 * console.log(cssProps["tile-color-dirt"]); // e.g., "8b4513"
 */
export function getCustomProperties(gThis, shadow) {
  const styles = gThis.getComputedStyle(shadow.host);

  return {
    ...buildStyleMapByPropNames(
      styles,
      Object.keys(gameColors["color"]).map((k) => `--sg-color-${k}`),
    ),
    ...buildStyleMapByPropNames(
      styles,
      Object.keys(gameColors["tile-color"]).map((k) => `--sg-tile-color-${k}`),
    ),
  };
}
