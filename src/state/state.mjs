import { Signal } from "signal-polyfill";

import { gameConfig } from "./config/index.mjs";
import { getBlockById } from "./config/blocks.mjs";
import { getBlockIdByName } from "./config/getBlockIdByName.mjs";

import { getRandomSeed } from "../util/getRandomSeed.mjs";

import { ChunkManager } from "./chunkManager.mjs";

/** @typedef {import("../util/ray.mjs").PointWithFace} PointWithFace */

/**
 * Game configuration state.
 *
 * @typedef {Object} GameState
 *
 * @property {boolean} fastGrowth
 * @property {boolean} onGround
 * @property {boolean} uiButtonActive
 * @property {boolean} spacePressed
 * @property {boolean} isCanvasActionDisabled
 * @property {ChunkManager} world
 * @property {number} actionKeyPressTime
 * @property {number} lastSpacePressTime
 * @property {number} flySpeed
 * @property {number} gameTime
 * @property {number} playerHeight
 * @property {number} playerWidth
 * @property {number} seed
 * @property {number} pitch
 * @property {number} yaw
 * @property {number} dx
 * @property {number} dy
 * @property {number} dz
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {Object.<string, number>} growthTimers
 * @property {Object.<string, Object>} plantStructures
 * @property {PointWithFace} hit
 * @property {Signal.State} materialsInventory
 * @property {Signal.State} arrowsControlCamera
 * @property {Signal.State} curBlock
 * @property {Signal.State} shouldReset
 * @property {Signal.State} shouldReset
 * @property {Signal.State} hasEnabledExtras
 * @property {Signal.State} flying
 * @property {Signal.State} materialBar
 * @property {Signal.State} activeMaterialBarSlot
 */

/** @type number */
let initialWorldSeed;

const params = new URLSearchParams(globalThis.location?.search);

if (params.has("seed")) {
  initialWorldSeed = Number(params.get("seed"));
} else {
  initialWorldSeed = getRandomSeed();
}

/**
 * Selects a slot in the materialBar.
 *
 * @param {number} index - Index of the slot (0-8)
 */
export function selectMaterialBarSlot(index) {
  if (index < 0 || index >= 9) {
    return;
  }

  gameState.activeMaterialBarSlot.set(index);

  const materialBar = gameState.materialBar.get();
  gameState.curBlock.set(materialBar[index]);
}

/**
 * Sets the item in the active materialBar slot.
 *
 * @param {number} blockId - ID of the block
 */
export function setMaterialBarItem(blockId) {
  const index = gameState.activeMaterialBarSlot.get();
  const materialBar = [...gameState.materialBar.get()];
  materialBar[index] = blockId;

  gameState.materialBar.set(materialBar);
  gameState.curBlock.set(blockId);
}

/**
 * Primary game state store using reactive Signals.
 *
 * @type {GameState}
 *
 * @constant
 */
export const gameState = {
  curBlock: new Signal.State(getBlockIdByName("Dirt")),
  world: new ChunkManager(),
  seed: initialWorldSeed,
  yaw: 0,
  pitch: 0,
  x: 0,
  y: 2,
  z: 5,
  dx: 0,
  dy: 0,
  dz: 0,
  gameTime: 0,
  playerHeight: 1.8,
  playerWidth: 0.6,
  flySpeed: 10,
  flying: new Signal.State(false),
  onGround: false,
  hit: null,
  lastSpacePressTime: 0,
  spacePressed: false,
  isCanvasActionDisabled: false,
  uiButtonActive: false,
  plantStructures: {},
  growthTimers: {},
  fastGrowth: false,
  shouldReset: new Signal.State(false),
  arrowsControlCamera: new Signal.State(true),
  actionKeyPressTime: 0,
  hasEnabledExtras: new Signal.State(false),
  materialsInventory: new Signal.State([]),
  // Default blocks
  materialBar: new Signal.State([
    getBlockIdByName("Dirt"),
    getBlockIdByName("Sand"),
    getBlockIdByName("Mushroom"),
    getBlockIdByName("Sunflower"),
    getBlockIdByName("Lotus"),
    getBlockIdByName("Rose"),
    getBlockIdByName("Pine Tree"),
    getBlockIdByName("Gold"),
    getBlockIdByName("Stone"),
  ]),
  activeMaterialBarSlot: new Signal.State(0),
};

/**
 * Computed (derived) state values that depend on gameState Signals.
 *
 * Updates automatically when dependencies change.
 *
 * @type {Object}
 *
 * @constant
 */
export const computedSignals = {
  currentBlock: new Signal.Computed(() => {
    const id = gameState.curBlock.get();
    const block = getBlockById(id);

    return block?.name || "Air";
  }),
};

/**
 * Updates a gameState Signal value by applying an updater function.
 *
 * Safe no-op if the key doesn't exist or isn't a Signal.
 *
 * @param {string} key - The key of the Signal in gameState to update
 * @param {(current: any) => any} updater - Function that takes current value and returns new value
 *
 * @returns {void}
 */
export function updateState(key, updater) {
  const current = gameState[key]?.get();

  if (current !== undefined) {
    gameState[key].set(updater(current));
  }
}

/**
 * Updates a gameConfig Signal value by applying an updater function.
 *
 * Safe no-op if the key doesn't exist or isn't a Signal.
 *
 * @param {string} key - The key of the Signal in gameConfig to update
 * @param {(current: any) => any} updater - Function that takes current value and returns new value
 *
 * @returns {void}
 */
export function updateConfig(key, updater) {
  const current = gameConfig[key]?.get();

  if (current !== undefined) {
    gameConfig[key].set(updater(current));
  }
}

/**
 * Sets a gameConfig Signal value directly.
 *
 * Safe no-op if the key doesn't exist or isn't a Signal.
 *
 * @param {string} key - The key of the Signal in gameConfig
 * @param {any} value - The new value to set
 *
 * @returns {any} The return value from Signal.set()
 */
export function setConfig(key, value) {
  return gameConfig[key]?.set(value);
}

/**
 * Gets the current value of a gameConfig Signal.
 *
 * Returns undefined if the key doesn't exist or isn't a Signal.
 *
 * @param {string} key - The key of the Signal in gameConfig
 *
 * @returns {any} The current value of the Signal
 */
export function getConfig(key) {
  return gameConfig[key]?.get();
}

/**
 * Sets a gameState Signal value directly.
 *
 * Safe no-op if the key doesn't exist or isn't a Signal.
 *
 * @param {string} key - The key of the Signal in gameState
 * @param {any} value - The new value to set
 *
 * @returns {any} The return value from Signal.set()
 */
export function setState(key, value) {
  return gameState[key]?.set(value);
}

/**
 * Gets the current value of a gameState Signal.
 *
 * Returns undefined if the key doesn't exist or isn't a Signal.
 *
 * @param {string} key - The key of the Signal in gameState
 *
 * @returns {any} The current value of the Signal
 */
export function getState(key) {
  return gameState[key]?.get();
}

/**
 * Initializes the global state store and exposes it through globalThis.
 *
 * Sets up reactive state access for the game and external APIs.
 *
 * @param {typeof globalThis} gThis - Global this or window object
 * @param {string} version - Game version string to set in config
 *
 * @returns {Promise<{computedSignals, gameConfig, gameState: GameState}>} Object containing both config and state
 */
export async function initState(gThis, version) {
  gameConfig.version.set(version);

  // Until we have a proper inventory we will intialize
  // materials inventory with all blocks, except for air
  const allMaterialBlocks = gameConfig.blocks
    .filter((block) => block.name !== "Air")
    .map((block) => block.id);

  gameState.materialsInventory.set(allMaterialBlocks);

  // Set block types on ChunkManager for gravity queue
  gameState.world.blockTypes = gameConfig.blocks;

  // Expose reactive state through globalThis
  gThis.blockGarden = {
    ...gThis?.blockGarden,
    config: gameConfig,
    state: gameState,
    computed: computedSignals,
    // Helper methods to get/set values
    setConfig,
    getConfig,
    updateConfig,
    setState,
    getState,
    updateState,
  };

  return {
    computedSignals,
    gameConfig,
    gameState,
  };
}

export { gameConfig };
