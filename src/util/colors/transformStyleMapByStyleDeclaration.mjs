/** @typedef {import('./index.mjs').CombinedMap} CombinedMap */

/**
 * Transform a CSSStyleDeclaration into a CombinedMap by filtering keys with a prefix.
 *
 * @param {CSSStyleDeclaration} cssStyleDeclaration - The CSSStyleDeclaration object to read from.
 * @param {string} [prefix="--sg-"] - The prefix used to filter CSS custom property keys.
 * @param {(key: string) => string} [keyTransform=(key) => key] - Function to transform keys after removing the prefix.
 *
 * @returns {CombinedMap} A new object containing keys and values from the CSSStyleDeclaration
 * that match the prefix. This object includes entries from ColorMap, TileColorMap, and may include additional
 * properties.
 */
export function transformStyleMapByStyleDeclaration(
  cssStyleDeclaration,
  prefix = "--sg-",
  keyTransform = (key) => key,
) {
  let combinedMap;

  for (const propName of cssStyleDeclaration) {
    if (!combinedMap) {
      combinedMap = {};
    }

    if (propName.startsWith(prefix)) {
      const tileNameRaw = propName.slice(prefix.length);
      const tileKey = keyTransform(tileNameRaw);
      const rawValue = cssStyleDeclaration
        .getPropertyValue(propName)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      combinedMap[tileKey] = rawValue;
    }
  }

  return combinedMap;
}
