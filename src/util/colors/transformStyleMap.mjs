/** @typedef {import('./index.mjs').CombinedMap} CombinedMap */

/**
 * Transform an existing style map using a CSS prefix.
 *
 * @param {CombinedMap} [styleMap={}] - The input style map which includes
 * properties from ColorMap, TileColorMap, and potentially others.
 * @param {string} [prefix="--sg-"] - The prefix to filter keys in the styleMap.
 * @param {(key: string) => string} [keyTransform=(key) => key] - Function to transform keys after prefix removal.
 *
 * @returns {CombinedMap} A new object containing the transformed keys and values from the filtered styleMap. The
 * return object may include keys from ColorMap, TileColorMap, and potentially additional properties.
 */
export function transformStyleMap(
  styleMap = {},
  prefix = "--sg-",
  keyTransform = (key) => key,
) {
  let combinedMap;

  for (const [key, value] of Object.entries(styleMap)) {
    if (!combinedMap) {
      combinedMap = {};
    }

    if (key.startsWith(prefix)) {
      const tileKey = keyTransform(key.slice(prefix.length));
      combinedMap[tileKey] = value.trim().replace(/^['"]|['"]$/g, "");
    }
  }

  return combinedMap;
}
