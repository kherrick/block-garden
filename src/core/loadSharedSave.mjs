import { loadSaveState } from "./loadSave.mjs";
import { deleteSharedSave, retrieveSharedSave } from "./shareTarget.mjs";

/**
 * Check for and load any pending shared save from a Share Target
 * This function should be called during app initialization
 *
 * @param {typeof globalThis} gThis - Global this or window object with blockGarden property
 * @param {ShadowRoot} shadow - Shadow root for canvas resizing
 * @returns {Promise<boolean>} - true if a shared save was loaded, false otherwise
 */
export async function loadSharedSaveIfPending(gThis, shadow) {
  try {
    // Check for shared save in IndexedDB
    const sharedSave = await retrieveSharedSave();

    if (!sharedSave || !sharedSave.data) {
      console.info("[SharedSave] No pending shared save found");
      return false;
    }

    console.info(
      "[SharedSave] Found pending shared save, loading into game state",
    );

    // Load the shared save into the game state
    const saveState = sharedSave.data;

    await loadSaveState(gThis, shadow, saveState);

    // Delete the shared save after loading it
    await deleteSharedSave();

    console.info("[SharedSave] Successfully loaded shared save");
    return true;
  } catch (error) {
    console.error("[SharedSave] Error loading shared save:", error);
    return false;
  }
}
