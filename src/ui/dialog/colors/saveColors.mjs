import localForage from "localforage";

/** @typedef {import("./index.mjs").CombinedColorMap} CombinedColorMap */

/**
 * Save colors to localForage
 *
 * @param {CombinedColorMap} colors
 * @param {string} key
 *
 * @returns {Promise<void>}
 */
export async function saveColors(colors, key) {
  try {
    await localForage.setItem(key, colors);

    console.log("Saved custom colors");
  } catch (error) {
    console.error("Failed to save colors:", error);
  }
}
