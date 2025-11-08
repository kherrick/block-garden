import localForage from "../../../deps/localForage.mjs";

// Load saved colors from localForage
export async function getSavedColors(doc, key) {
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
