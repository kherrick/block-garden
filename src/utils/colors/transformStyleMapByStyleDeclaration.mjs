/** @typedef {import('./index.mjs').CombinedColorMap} CombinedColorMap */

/**
 * Transform a CSSStyleDeclaration into a CombinedColorMap by filtering keys with a prefix.
 *
 * @param {CSSStyleDeclaration} cssStyleDeclaration - The CSSStyleDeclaration object to read from.
 * @param {string} [prefix="--bg-"] - The prefix used to filter CSS custom property keys.
 * @param {(key: string) => string} [keyTransform=(key) => key] - Function to transform keys after removing the prefix.
 *
 * @returns {CombinedColorMap} A new object containing keys and values from the CSSStyleDeclaration
 * that match the prefix. This object includes entries from ColorMap, BlockColorMap, and may include additional
 * properties.
 */
export function transformStyleMapByStyleDeclaration(
  cssStyleDeclaration,
  prefix = "--bg-",
  suffix = "-color",
  keyTransform = (key) => key,
) {
  let CombinedColorMap;

  for (const propName of cssStyleDeclaration) {
    if (!CombinedColorMap) {
      CombinedColorMap = {};
    }

    let resolvedPropName = propName.slice(prefix.length);
    resolvedPropName = resolvedPropName.slice(
      0,
      suffix.length > 0 ? -suffix.length : undefined,
    );

    if (propName.startsWith(prefix)) {
      const blockNameRaw = resolvedPropName;
      const blockKey = keyTransform(blockNameRaw);
      const rawValue = cssStyleDeclaration
        .getPropertyValue(propName)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      CombinedColorMap[blockKey] = rawValue;
    }
  }

  return CombinedColorMap;
}
