import localForage from "../../../deps/localForage.mjs";

// Save colors to localForage
export async function saveColors(colors, key) {
  try {
    await localForage.setItem(key, colors);

    console.log("Saved custom colors");
  } catch (error) {
    console.error("Failed to save colors:", error);
  }
}
