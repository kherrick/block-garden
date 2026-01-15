import isNumber from "lodash.isnumber";

import { base64toBlob } from "../util/conversion.mjs";
import { extractAttachments } from "../util/extractAttachments.mjs";
import { extractJsonFromPng } from "../util/canvasToPngWithState.mjs";
import { initNoise } from "../util/noise.mjs";
import { worldToChunk } from "../util/chunk.mjs";

/**
 * @typedef {import('signal-polyfill').Signal} Signal
 */

/**
 * Restores game state and config from a save file.
 *
 * Reconstructs complex objects like world maps and fog maps from serialized data.
 * Updates all Signal values to restore previous game state.
 *
 * @param {typeof globalThis} gThis - Global this or window object with blockGarden property
 * @param {ShadowRoot} shadow - Shadow root for canvas resizing
 * @param {Object} state - Save state object created by createSaveState
 *
 * @returns {Promise<boolean>} - true if save state was successfully loaded, false if invalid
 */
export async function loadSaveState(gThis, shadow, state) {
  if (!state) {
    console.warn("Save state validation failed: No state data provided.");

    return false;
  }

  let saveState = state;

  // handle loading pdfs
  if (saveState?.type === "pdf") {
    const blob = base64toBlob(gThis, saveState.contents, "application/pdf");
    const [results] = await extractAttachments(
      new File([blob], "block-garden-game-card.png"),
    );

    saveState = JSON.parse(await extractJsonFromPng(new Blob([results.data])));
  }

  const worldData = saveState.world || saveState;
  const stateData = saveState.state || {};

  // Validation
  let hasVoxelData = false;

  const worldKeys = Object.keys(worldData);
  for (const x of worldKeys) {
    const numX = Number(x);
    if (!isNumber(numX) || isNaN(numX)) {
      continue;
    }

    const xz = worldData[x];
    if (xz && typeof xz === "object") {
      const zKeys = Object.keys(xz);
      for (const z of zKeys) {
        const numZ = Number(z);
        if (!isNumber(numZ) || isNaN(numZ)) {
          continue;
        }

        const ys = xz[z];
        if (ys && typeof ys === "object") {
          const yKeys = Object.keys(ys);
          for (const y of yKeys) {
            const numY = Number(y);
            if (!isNumber(numY) || isNaN(numY)) {
              continue;
            }

            const blockId = ys[y];
            if (typeof blockId === "number") {
              hasVoxelData = true;

              break;
            }
          }
        }

        if (hasVoxelData) {
          break;
        }
      }
    }

    if (hasVoxelData) {
      break;
    }
  }

  if (!hasVoxelData) {
    console.warn("Save state validation failed: No voxel data found.");

    return false;
  }

  // Start of Side-Effects
  const config = saveState.config || {};
  const world = gThis.blockGarden.state.world;
  const gameState = gThis.blockGarden.state;
  const configSignals = gThis.blockGarden.config;

  /**
   * Apply values to state or signals.
   *
   * @param {Object} obj - The parent object containing the property or Signal
   * @param {string} key - The key within the object
   * @param {any} value - The value from the save data
   * @param {'number'|'boolean'|'string'|'object'} type - Expected type
   * @param {Object} [options] - Constraints like min/max
   */
  const applyValue = (obj, key, value, type, options = {}) => {
    if (value === undefined || value === null || !obj) {
      return;
    }

    let result = value;

    if (type === "number") {
      result = Number(value);
      if (isNaN(result)) {
        return;
      }

      if (options.min !== undefined) {
        result = Math.max(options.min, result);
      }

      if (options.max !== undefined) {
        result = Math.min(options.max, result);
      }
    } else if (type === "boolean") {
      result = Boolean(value);
    } else if (type === "string") {
      result = String(value);
    } else if (type === "object") {
      if (typeof value !== "object" || Array.isArray(value)) {
        return;
      }
    }

    // Apply to Signal or raw property
    const target = obj[key];
    if (target && typeof target.set === "function") {
      target.set(result);
    } else {
      obj[key] = result;
    }
  };

  // Restore config values
  applyValue(gameState, "seed", config.seed, "number", {
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
  });
  applyValue(gameState, "version", config.version, "string");

  // Restore granular generation settings to gameConfig Signals
  if (configSignals) {
    applyValue(
      configSignals,
      "terrainOctaves",
      config.terrainOctaves,
      "number",
      {
        min: 1,
        max: 8,
      },
    );

    applyValue(configSignals, "mountainScale", config.mountainScale, "number", {
      min: 0,
      max: 100,
    });

    applyValue(
      configSignals,
      "decorationDensity",
      config.decorationDensity,
      "number",
      { min: 0, max: 100 },
    );

    applyValue(configSignals, "caveThreshold", config.caveThreshold, "number", {
      min: 0,
      max: 100,
    });

    applyValue(configSignals, "useCaves", config.useCaves, "boolean");
    applyValue(configSignals, "cloudDensity", config.cloudDensity, "number", {
      min: 0,
      max: 100,
    });
  }

  // Restore player state
  applyValue(gameState, "x", stateData.x, "number");
  applyValue(gameState, "y", stateData.y, "number");
  applyValue(gameState, "z", stateData.z, "number");
  applyValue(gameState, "dx", stateData.dx, "number");
  applyValue(gameState, "dy", stateData.dy, "number");
  applyValue(gameState, "dz", stateData.dz, "number");
  applyValue(gameState, "pitch", stateData.pitch, "number");
  applyValue(gameState, "yaw", stateData.yaw, "number");
  applyValue(gameState, "onGround", stateData.onGround, "boolean");
  applyValue(gameState, "flying", stateData.flying, "boolean");

  if (stateData.inventory && typeof stateData.inventory === "object") {
    gameState.inventory = stateData.inventory;
  } else {
    gameState.inventory = {};
  }

  applyValue(gameState, "curBlock", stateData.curBlock, "number");

  // Restore UI and inventory state
  if (
    stateData.materialsInventory &&
    Array.isArray(stateData.materialsInventory)
  ) {
    applyValue(
      gameState,
      "materialsInventory",
      stateData.materialsInventory,
      "object",
    );
  }

  if (stateData.materialBar && Array.isArray(stateData.materialBar)) {
    applyValue(gameState, "materialBar", stateData.materialBar, "object");
  }

  applyValue(
    gameState,
    "activeMaterialBarSlot",
    stateData.activeMaterialBarSlot,
    "number",
    {
      min: 0,
      max: 8,
    },
  );

  applyValue(
    gameState,
    "arrowsControlCamera",
    stateData.arrowsControlCamera,
    "boolean",
  );

  applyValue(
    gameState,
    "hasEnabledExtras",
    stateData.hasEnabledExtras,
    "boolean",
  );

  // Cancel any running game loop before reset (if available)
  if (typeof gThis.cancelGameLoop === "function") {
    gThis.cancelGameLoop();
  } else if (typeof gThis.globalThis?.cancelGameLoop === "function") {
    gThis.globalThis.cancelGameLoop();
  }

  // Clear existing world
  world.clear();

  // Initialize noise generator with seed for proper chunk generation
  // This does NOT regenerate the world - it only sets up the noise for async chunk generation
  if (gameState.seed !== undefined) {
    initNoise(gameState.seed);

    // Clear existing active state in-place to preserve object references for the game loop
    if (gameState.plantStructures) {
      Object.keys(gameState.plantStructures).forEach((k) => {
        delete gameState.plantStructures[k];
      });
    }

    if (gameState.growthTimers) {
      Object.keys(gameState.growthTimers).forEach((k) => {
        delete gameState.growthTimers[k];
      });
    }

    const structures = stateData.plantStructures || {};
    const timers = stateData.growthTimers || {};

    world.storedPlantStates.clear();

    // Preserve stored plant states from the save
    if (saveState.storedPlantStates) {
      Object.entries(saveState.storedPlantStates).forEach(([key, value]) => {
        world.storedPlantStates.set(key, value);
      });
    }

    const plantKeys = new Set([
      ...Object.keys(structures),
      ...Object.keys(timers),
    ]);

    plantKeys.forEach((key) => {
      const parts = key.split(",");
      if (parts.length === 3) {
        const x = parseInt(parts[0]);
        const z = parseInt(parts[2]);
        const { chunkX, chunkZ } = worldToChunk(x, z);

        const chunkKey = `${chunkX},${chunkZ}`;
        if (!world.storedPlantStates.has(chunkKey)) {
          world.storedPlantStates.set(chunkKey, {
            structures: {},
            timers: {},
          });
        }

        const stored = world.storedPlantStates.get(chunkKey);
        if (structures[key]) {
          stored.structures[key] = structures[key];
        }

        if (timers[key]) {
          stored.timers[key] = timers[key];
        }
      }
    });
  }

  // Restore stored chunk modifications
  world.storedChunks.clear();
  if (saveState.storedChunks) {
    Object.entries(saveState.storedChunks).forEach(([chunkKey, mods]) => {
      world.storedChunks.set(
        chunkKey,
        new Map(Object.entries(mods).map(([k, v]) => [Number(k), v])),
      );
    });
  }

  // Profile world loading
  const t0 = performance.now();

  // Validate world data size
  if (worldKeys.length > 1000) {
    console.warn(
      `World data is very large (${worldKeys.length} x columns), may cause slow loading.`,
    );
  }

  // Populate chunks from save data
  Object.entries(worldData).forEach(([xStr, xz]) => {
    const x = Number(xStr);
    Object.entries(xz).forEach(([zStr, ys]) => {
      const z = Number(zStr);
      Object.entries(ys).forEach(([yStr, blockId]) => {
        const y = Number(yStr);

        // Load block by its ID
        world.set(`${x},${y},${z}`, Number(blockId));

        // Mark chunk as generated to prevent terrain worker from overwriting save data
        const { chunkX, chunkZ } = worldToChunk(x, z);
        const chunk = world.getChunk(chunkX, chunkZ);
        if (chunk) {
          chunk.generated = true;
          // We DO NOT set chunk.restored = true here, because we want
          // restoreChunkPersistence to be called by updateVisibleChunks
          // to move plants from storedPlantStates to active state.
        }
      });
    });
  });

  const t1 = performance.now();
  console.log(`World loading of ${worldKeys.length} columns took ${t1 - t0}ms`);

  // "Reset" to enable updated state / config
  shadow.dispatchEvent(new CustomEvent("block-garden-reset"));

  return true;
}
