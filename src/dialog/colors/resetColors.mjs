import localForage from "localforage";

import { getCustomProperties } from "../../util/colors/getCustomProperties.mjs";

/**
 * Reset to default colors
 *
 * @param {object} gThis - The global context or window object.
 * @param {ShadowRoot} shadow - The shadow root whose host's computed styles will be inspected.
 * @param {string} key
 *
 * @returns {Promise<void>}
 */
export async function resetColors(gThis, shadow, key) {
  try {
    await localForage.removeItem(key);

    // Remove inline styles to restore CSS defaults
    const allProperties = getCustomProperties(gThis, shadow);

    for (const property of Object.keys(allProperties)) {
      if (shadow.host instanceof HTMLElement) {
        shadow.host.style.removeProperty(property);
      }
    }

    console.log("Reset to default colors");
  } catch (error) {
    console.error("Failed to reset colors:", error);
  }
}
