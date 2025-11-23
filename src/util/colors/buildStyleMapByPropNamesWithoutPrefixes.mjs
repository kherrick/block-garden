/** @typedef {import('./index.mjs').ColorMapWithoutPrefixes} ColorMapWithoutPrefixes */
/** @typedef {import('./index.mjs').TileColorMapWithoutPrefixes} TileColorMapWithoutPrefixes */

/**
 * Build a map by removing a known prefix from CSS custom property names.
 *
 * @param {CSSStyleDeclaration} cssStyleDeclaration - The CSSStyleDeclaration object to read from.
 * @param {string[]} propNames - An array of full CSS custom property names, each starting with the given prefix.
 * @param {string} [prefix=""] - The prefix string to remove from each property name to form keys in the output map.
 *
 * @returns {ColorMapWithoutPrefixes | TileColorMapWithoutPrefixes} An object mapping the suffix of each property name
 * to its CSS value (without prefix).
 */
export function buildStyleMapByPropNamesWithoutPrefixes(
  cssStyleDeclaration,
  propNames,
  prefix = "",
) {
  let styleMap;

  for (const propName of propNames) {
    if (!styleMap) {
      styleMap = {};
    }

    // Extract tile name from custom property name
    styleMap[propName.slice(prefix.length)] =
      cssStyleDeclaration.getPropertyValue(propName);
  }

  return styleMap;
}
