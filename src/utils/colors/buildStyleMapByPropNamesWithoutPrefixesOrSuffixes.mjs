/** @typedef {import('./index.mjs').ColorMapWithoutPrefixes} ColorMapWithoutPrefixes */
/** @typedef {import('./index.mjs').BlockColorMapWithoutPrefixes} BlockColorMapWithoutPrefixes */

/**
 * Build a map by removing a known prefix from CSS custom property names.
 *
 * @param {CSSStyleDeclaration} cssStyleDeclaration - The CSSStyleDeclaration object to read from.
 * @param {string[]} propNames - An array of full CSS custom property names, each starting with the given prefix.
 * @param {string} [prefix=""] - The prefix string to remove from each property name to form keys in the output map.
 * @param {string} [suffix=""] - The suffix string to remove from the end of each property name to form keys in the output map.
 *
 * @returns {ColorMapWithoutPrefixes | BlockColorMapWithoutPrefixes} An object mapping the suffix of each property name
 * to its CSS value (without prefix).
 */
export function buildStyleMapByPropNamesWithoutPrefixesOrSuffixes(
  cssStyleDeclaration,
  propNames,
  prefix = "",
  suffix = "",
) {
  let styleMap;

  for (const propName of propNames) {
    if (!styleMap) {
      styleMap = {};
    }

    let resolvedPropName = propName.slice(prefix.length);
    resolvedPropName = resolvedPropName.slice(
      0,
      suffix.length > 0 ? -suffix.length : undefined,
    );

    // Extract block name from custom property name
    styleMap[resolvedPropName] = cssStyleDeclaration.getPropertyValue(propName);
  }

  return styleMap;
}
