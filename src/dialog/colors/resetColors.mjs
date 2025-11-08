import localForage from "../../../deps/localForage.mjs";
import { getCustomProperties } from "./getCustomProperties.mjs";

// Reset to default colors
export async function resetColors(gThis, shadow, key) {
  try {
    await localForage.removeItem(key);

    // Remove inline styles to restore CSS defaults
    const allProperties = getCustomProperties(gThis, shadow);

    for (const property of Object.keys(allProperties)) {
      shadow.host.style.removeProperty(property);
    }

    console.log("Reset to default colors");
  } catch (error) {
    console.error("Failed to reset colors:", error);
  }
}
