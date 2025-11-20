import localForage from "localforage";

/**
 * Save colors to localForage
 *
 * @param {any} colors
 * @param {any} key
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
