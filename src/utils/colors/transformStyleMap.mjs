/** @typedef {import('./index.mjs').CombinedColorMap} CombinedColorMap */

/**
 * Transform an existing style map using a CSS prefix.
 *
 * @param {CombinedColorMap} [styleMap={}] - The input style map which includes
 * properties from ColorMap, BlockColorMap, and potentially others.
 * @param {string} [prefix="--bg-"] - The prefix to filter keys in the styleMap.
 * @param {(key: string) => string} [keyTransform=(key) => key] - Function to transform keys after prefix removal.
 *
 * @returns {CombinedColorMap} A new object containing the transformed keys and values from the filtered styleMap. The
 * return object may include keys from ColorMap, BlockColorMap, and potentially additional properties.
 */
export function transformStyleMap(
  styleMap = {},
  prefix = "--bg-",
  suffix = "",
  keyTransform = (key) => key,
) {
  let CombinedColorMap;

  for (const [key, value] of Object.entries(styleMap)) {
    if (!CombinedColorMap) {
      CombinedColorMap = {};
    }

    if (!key.startsWith(prefix)) {
      continue;
    }

    let resolvedBlockKey = key.slice(prefix.length);
    resolvedBlockKey = resolvedBlockKey.slice(
      0,
      suffix.length > 0 ? -suffix.length : undefined,
    );

    const blockKey = keyTransform(resolvedBlockKey);
    CombinedColorMap[blockKey] = value.trim().replace(/^['"]|['"]$/g, "");
  }

  return CombinedColorMap;
}
