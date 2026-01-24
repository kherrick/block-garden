import localForage from "localforage";

import { resizeCanvas } from "../../api/ui/resizeCanvas.mjs";

/**
 * Generates a storage key using the block-garden namespace pattern.
 * Examples: "block-garden-state-fast-growth", "block-garden-config-use-split-controls"
 *
 * @param {string} scope - Either "state" or "config"
 * @param {string} name - camelCase name of the setting
 *
 * @returns {string} The storage key in kebab-case format
 */
export function generatePersistenceKey(scope, name) {
  const kebabCaseName = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

  return `block-garden-${scope}-${kebabCaseName}`;
}

/**
 * Persist a state or config value to storage.
 *
 * @param {string} scope - Either "state" or "config"
 * @param {string} name - camelCase name of the setting
 * @param {*} value - The value to persist
 *
 * @returns {Promise<*>} The value that was stored
 */
export async function persistValue(scope, name, value) {
  const key = generatePersistenceKey(scope, name);

  try {
    return await localForage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to persist ${key}:`, error);

    return value;
  }
}

/**
 * Retrieve a persisted state or config value from storage.
 *
 * @param {string} scope - Either "state" or "config"
 * @param {string} name - camelCase name of the setting
 * @param {*} defaultValue - Value to return if not found
 *
 * @returns {Promise<*>} The persisted value or defaultValue if not found
 */
export async function getPersistedValue(scope, name, defaultValue = null) {
  const key = generatePersistenceKey(scope, name);

  try {
    const value = await localForage.getItem(key);

    return value !== null ? value : defaultValue;
  } catch (error) {
    console.error(`Failed to retrieve ${key}:`, error);

    return defaultValue;
  }
}

/**
 * Restore multiple persisted values from storage.
 * Returns an object with only the values that were found in storage.
 *
 * @param {Array<{scope: string, name: string, defaultValue: *}>} items - Items to restore
 *
 * @returns {Promise<Object>} Object with keys as "scope_name" and values from storage
 */
export async function getPersistedValues(items) {
  const result = {};
  for (const item of items) {
    const key = `${item.scope}_${item.name}`;
    const value = await getPersistedValue(
      item.scope,
      item.name,
      item.defaultValue,
    );

    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Restore all persisted game preferences from storage and apply them to gameState and gameConfig.
 *
 * @param {Object} gameState - The game state object
 * @param {Object} gameConfig - The game config object with signal setters
 * @param {ShadowRoot} shadow - The shadow DOM to update UI elements for non-signal values
 *
 * @returns {Promise<void>}
 */
export async function restorePersistedPreferences(
  gameState,
  gameConfig,
  shadow,
) {
  const [
    persistedFastGrowth,
    persistedLinkGameSave,
    persistedUseSplitControls,
    persistedUseBlockHighlight,
    persistedUseDamageAnimation,
    persistedUseTextureAtlas,
    persistedUseAmbientOcclusion,
    persistedUseDynamicLighting,
    persistedUsePerFaceLighting,
    persistedUseAODebug,
    persistedUseAutoJump,
    persistedCurrentResolution,
    persistedUseTouchControls,
  ] = await Promise.all([
    getPersistedValue("state", "fastGrowth"),
    getPersistedValue("config", "linkGameSave"),
    getPersistedValue("config", "useSplitControls"),
    getPersistedValue("config", "useBlockHighlight"),
    getPersistedValue("config", "useDamageAnimation"),
    getPersistedValue("config", "useTextureAtlas"),
    getPersistedValue("config", "useAmbientOcclusion"),
    getPersistedValue("config", "useDynamicLighting"),
    getPersistedValue("config", "usePerFaceLighting"),
    getPersistedValue("config", "useAODebug"),
    getPersistedValue("config", "useAutoJump"),
    getPersistedValue("config", "currentResolution"),
    getPersistedValue("config", "useTouchControls"),
  ]);

  if (persistedFastGrowth !== null && persistedFastGrowth !== undefined) {
    gameState.fastGrowth = persistedFastGrowth;

    // Update UI for non-signal state value
    const fastGrowthButton = shadow.getElementById("fastGrowthButton");
    if (fastGrowthButton) {
      fastGrowthButton.textContent = persistedFastGrowth
        ? "Disable Fast Growth"
        : "Enable Fast Growth";

      fastGrowthButton.style.backgroundColor = persistedFastGrowth
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      fastGrowthButton.style.color = "var(--bg-color-white)";
    }
  }

  if (
    persistedCurrentResolution !== null &&
    persistedCurrentResolution !== undefined
  ) {
    gameConfig.currentResolution.set(persistedCurrentResolution);

    // Update UI select element and trigger resize
    const resolutionSelectEl = shadow.getElementById("resolutionSelect");
    if (resolutionSelectEl) {
      /** @type {any} */
      (resolutionSelectEl).value = persistedCurrentResolution;
    }

    // Apply the resolution change to the canvas
    resizeCanvas(shadow, gameConfig.currentResolution);
  }

  if (persistedLinkGameSave !== null && persistedLinkGameSave !== undefined) {
    gameConfig.linkGameSave.set(persistedLinkGameSave);
  }

  if (
    persistedUseSplitControls !== null &&
    persistedUseSplitControls !== undefined
  ) {
    gameConfig.useSplitControls.set(persistedUseSplitControls);
  }

  if (
    persistedUseBlockHighlight !== null &&
    persistedUseBlockHighlight !== undefined
  ) {
    gameConfig.useBlockHighlight.set(persistedUseBlockHighlight);
  }

  if (
    persistedUseDamageAnimation !== null &&
    persistedUseDamageAnimation !== undefined
  ) {
    gameConfig.useDamageAnimation.set(persistedUseDamageAnimation);
  }

  if (
    persistedUseTextureAtlas !== null &&
    persistedUseTextureAtlas !== undefined
  ) {
    gameConfig.useTextureAtlas.set(persistedUseTextureAtlas);
  }

  if (
    persistedUseAmbientOcclusion !== null &&
    persistedUseAmbientOcclusion !== undefined
  ) {
    gameConfig.useAmbientOcclusion.set(persistedUseAmbientOcclusion);
  }

  if (
    persistedUseDynamicLighting !== null &&
    persistedUseDynamicLighting !== undefined
  ) {
    gameConfig.useDynamicLighting.set(persistedUseDynamicLighting);
  }

  if (
    persistedUsePerFaceLighting !== null &&
    persistedUsePerFaceLighting !== undefined
  ) {
    gameConfig.usePerFaceLighting.set(persistedUsePerFaceLighting);
  }

  if (persistedUseAODebug !== null && persistedUseAODebug !== undefined) {
    gameConfig.useAODebug.set(persistedUseAODebug);
  }

  if (persistedUseAutoJump !== null && persistedUseAutoJump !== undefined) {
    gameConfig.useAutoJump.set(persistedUseAutoJump);
  }

  if (
    persistedUseTouchControls !== null &&
    persistedUseTouchControls !== undefined
  ) {
    gameConfig.useTouchControls.set(persistedUseTouchControls);
  }
}
