import localForage from "localforage";

/** @typedef {import("./index.mjs").CombinedColorMap} CombinedColorMap */

/**
 * Load saved colors from localForage
 *
 * @param {string} key
 *
 * @returns {Promise<CombinedColorMap>}
 */
export async function getSavedColors(key) {
  try {
    const savedColors = await localForage.getItem(key);

    if (savedColors && typeof savedColors === "object") {
      console.log(
        "Loaded custom colors:",
        Object.keys(savedColors).length,
        "properties",
      );

      return savedColors;
    }
  } catch (error) {
    console.error("Failed to load saved colors:", error);
  }

  return null;
}
