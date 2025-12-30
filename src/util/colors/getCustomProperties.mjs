import { colors } from "../../state/config/colors.mjs";

import { buildStyleMapByPropNames } from "./buildStyleMapByPropNames.mjs";

/** @typedef {import('./index.mjs').CombinedColorMap} CombinedColorMap */

/**
 * Extracts all CSS custom properties prefixed with --bg from the computed styles of a shadow DOM host.
 *
 * Used for both general UI colors and game block colors, as defined in the colors object, and returns
 * them as a combined map.
 *
 * @param {typeof globalThis} gThis - The global context or window object that provides getComputedStyle.
 * @param {ShadowRoot} shadow - The shadow root whose host's computed styles will be inspected.
 *
 * @returns {CombinedColorMap} An object mapping CSS custom property names (without the --bg- prefix) to their values.
 *
 * @example
 * const cssProps = getCustomProperties(window, shadowRoot);
 * console.log(cssProps["color-amber-500"]); // e.g., "f39c12"
 * console.log(cssProps["block-dirt-color"]); // e.g., "8b4513"
 */
export function getCustomProperties(gThis, shadow) {
  const styles = gThis.getComputedStyle(shadow.host);

  return {
    ...buildStyleMapByPropNames(
      styles,
      Object.keys(colors["color"]).map((k) => `--bg-color-${k}`),
    ),
    ...buildStyleMapByPropNames(
      styles,
      Object.keys(colors["block"]).map((k) => `--bg-block-${k}`),
    ),
    ...buildStyleMapByPropNames(
      styles,
      Object.keys(colors["ui"]).map((k) => `--bg-ui-${k}`),
    ),
  };
}
