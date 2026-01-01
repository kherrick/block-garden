/** @typedef {import('./index.mjs').ColorMap} ColorMap */
/** @typedef {import('./index.mjs').BlockColorMap} BlockColorMap */

/**
 * Build a map using full CSS custom property names.
 *
 * @param {CSSStyleDeclaration} cssStyleDeclaration - The CSSStyleDeclaration object to read from.
 * @param {string[]} propNames - An array of full CSS custom property names, each starting with the given prefix.
 *
 * @returns {ColorMap | BlockColorMap} An object mapping the suffix of each property name to its CSS value.
 */
export function buildStyleMapByPropNames(cssStyleDeclaration, propNames) {
  let styleMap;

  for (const propName of propNames) {
    if (!styleMap) {
      styleMap = {};
    }

    // Extract block name from custom property name
    const resolvedPropName = propName.startsWith("--bg-color-")
      ? propName
      : `${propName}-color`;
    styleMap[resolvedPropName] =
      cssStyleDeclaration.getPropertyValue(resolvedPropName);
  }

  return styleMap;
}
