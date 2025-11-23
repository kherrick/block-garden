/** @typedef {import('./index.mjs').ColorMap} ColorMap */
/** @typedef {import('./index.mjs').TileColorMap} TileColorMap */

/**
 * Build a map using full CSS custom property names.
 *
 * @param {CSSStyleDeclaration} cssStyleDeclaration - The CSSStyleDeclaration object to read from.
 * @param {string[]} propNames - An array of full CSS custom property names, each starting with the given prefix.
 *
 * @returns {ColorMap | TileColorMap} An object mapping the suffix of each property name to its CSS value.
 */
export function buildStyleMapByPropNames(cssStyleDeclaration, propNames) {
  let styleMap;

  for (const propName of propNames) {
    if (!styleMap) {
      styleMap = {};
    }

    // Extract tile name from custom property name
    styleMap[propName] = cssStyleDeclaration.getPropertyValue(propName);
  }

  return styleMap;
}
