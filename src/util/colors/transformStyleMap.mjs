/** @typedef {import('./index.mjs').CombinedColorMap} CombinedColorMap */

/**
 * Transform an existing style map using a CSS prefix.
 *
 * @param {CombinedColorMap} [styleMap={}] - The input style map which includes
 * properties from ColorMap, TileColorMap, and potentially others.
 * @param {string} [prefix="--sg-"] - The prefix to filter keys in the styleMap.
 * @param {(key: string) => string} [keyTransform=(key) => key] - Function to transform keys after prefix removal.
 *
 * @returns {CombinedColorMap} A new object containing the transformed keys and values from the filtered styleMap. The
 * return object may include keys from ColorMap, TileColorMap, and potentially additional properties.
 */
export function transformStyleMap(
  styleMap = {},
  prefix = "--sg-",
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

    let resolvedTileKey = key.slice(prefix.length);
    resolvedTileKey = resolvedTileKey.slice(
      0,
      suffix.length > 0 ? -suffix.length : undefined,
    );

    const tileKey = keyTransform(resolvedTileKey);
    CombinedColorMap[tileKey] = value.trim().replace(/^['"]|['"]$/g, "");
  }

  return CombinedColorMap;
}
