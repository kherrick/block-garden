import { colors } from "../../state/config/colors.mjs";

import { buildStyleMapByPropNames } from "./buildStyleMapByPropNames.mjs";

/** @typedef {import('./index.mjs').CombinedColorMap} CombinedColorMap */

/**
 * Extracts all CSS custom properties prefixed with --sg from the computed styles of a shadow DOM host.
 *
 * Used for both general UI colors and game tile colors, as defined in the colors object, and returns
 * them as a combined map.
 *
 * @param {typeof globalThis} gThis - The global context or window object that provides getComputedStyle.
 * @param {ShadowRoot} shadow - The shadow root whose host's computed styles will be inspected.
 *
 * @returns {CombinedColorMap} An object mapping CSS custom property names (without the --sg- prefix) to their values.
 *
 * @example
 * const cssProps = getCustomProperties(window, shadowRoot);
 * console.log(cssProps["color-amber-500"]); // e.g., "f39c12"
 * console.log(cssProps["tile-dirt-color"]); // e.g., "8b4513"
 */
export function getCustomProperties(gThis, shadow) {
  const styles = gThis.getComputedStyle(shadow.host);

  return {
    ...buildStyleMapByPropNames(
      styles,
      Object.keys(colors["color"]).map((k) => `--sg-color-${k}`),
    ),
    ...buildStyleMapByPropNames(
      styles,
      Object.keys(colors["tile"]).map((k) => `--sg-tile-${k}`),
    ),
    ...buildStyleMapByPropNames(
      styles,
      Object.keys(colors["ui"]).map((k) => `--sg-ui-${k}`),
    ),
  };
}
