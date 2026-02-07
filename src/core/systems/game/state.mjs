import isNumber from "lodash.isnumber";

import { Signal } from "signal-polyfill";

import { getBlockById, getBlockIdByName } from "../../world/config/blocks.mjs";

import { ChunkManager } from "../../world/chunkManager.mjs";
import { gameConfig } from "../../world/config/index.mjs";
import { CLOUD_HEIGHT_MIN } from "../../world/generation/chunk.mjs";

import { getRandomSeed } from "../../../utils/getRandomSeed.mjs";

/**
 * @template T
 *
 * @typedef {import("signal-polyfill").Signal.State<T>} State
 */

/** @typedef {import('../../world/config/blocks.mjs').BlockDefinition} BlockDefinition */
/** @typedef {import('../../world/config/index.mjs').GameConfig} GameConfig */
/** @typedef {import("../../../utils/ray.mjs").PointWithFace} PointWithFace */
/** @typedef {import("../../world/config/blocks.mjs").BlockPlacement} BlockPlacement */

/**
 * @typedef {Object.<string, any>} BlockGardenGlobalDemo
 */

/**
 * @typedef {Object} BlockGardenGlobal
 *
 * @property {GameConfig} config - Game configuration state
 * @property {GameState} state - Game state
 * @property {Object} computed - Computed signals
 * @property {BlockGardenGlobalDemo} [demo] - Demo APIs
 * @property {function(string, function): any} setConfig
 * @property {function(number, GameState): void} generateWorld - Generates a new world
 * @property {function(string): any} getConfig
 * @property {function(string, (current: any) => any): void} updateConfig
 * @property {function(string, any): any} setState
 * @property {function(string): any} getState
 * @property {function(string, (current: any) => any): void} updateState
 */

/**
 * Extension of globalThis with blockGarden property.
 *
 * @typedef {typeof globalThis & { blockGarden: BlockGardenGlobal, showOpenFilePicker: function }} BlockGardenGlobalThis
 */

/**
 * @typedef {Object} PlantStructure
 *
 * @property {string} type - The plant type name
 * @property {BlockPlacement[]} blocks - Array of block coordinates/definitions
 */

/**
 * Game configuration state.
 *
 * @typedef {Object} GameState
 *
 * @property {boolean} fastGrowth
 * @property {boolean} preventNextContextMenu
 * @property {boolean} onGround
 * @property {boolean} uiButtonActive
 * @property {boolean} spacePressed
 * @property {boolean} isCanvasActionDisabled
 * @property {ChunkManager} world
 * @property {number} worldTime
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
 * @property {number} bobbingDistance
 * @property {number} bobbingIntensity
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {Record<string, number>} growthTimers
 * @property {Record<string, PlantStructure>} plantStructures
 * @property {PointWithFace|null} hit
 * @property {Record<string, any>} [inventory] - Legacy inventory support
 * @property {State<Record<string, number>>} materialsInventory - Materials inventory: { "DIRT": 10, ... }
 * @property {State<Record<string, number>>} seedsInventory - Seeds inventory: { "WHEAT": 1, ... }
 * @property {State<boolean>} arrowsControlCamera
 * @property {State<number>} curBlock
 * @property {State<boolean>} shouldReset
 * @property {State<boolean>} hasEnabledExtras
 * @property {State<boolean>} flying
 * @property {State<number[]>} materialBar
 * @property {State<number>} activeMaterialBarSlot
 * @property {State<any>} armedLinkConfig
 * @property {State<any>} armedTextConfig
 * @property {{active: boolean, startTime: number, blockPos: {x: number, y: number, z: number}|null, currentBlockId: number|null, breakPercentage: number}} breaking
 * @property {{isHeld: boolean, mode: string, cursorX: number, cursorY: number}} breakingInput
 * @property {{active: boolean, lastPlaceTime: number, interval: number}} placing
 * @property {{isHeld: boolean, mode: string, cursorX: number, cursorY: number}} placingInput
 * @property {{x: number, y: number, z: number}|null} cursorTarget - Block under cursor for immediate highlighting
 * @property {boolean} panStartedOnCanvas - Whether the current pan gesture started on the canvas
 */

/**
 * @typedef {Object} InitStateReturn
 *
 * @property {any} computedSignals
 * @property {GameConfig} gameConfig
 * @property {GameState} gameState
 * @property {boolean} invalidSeedProvided
 */

/** @type number */
let initialWorldSeed;
let invalidSeedProvided = false;

const params = new URLSearchParams(globalThis.location?.search);

if (params.has("seed")) {
  const seed = Number(params.get("seed"));
  if (
    isNumber(seed) &&
    !isNaN(seed) &&
    seed >= 1 &&
    seed <= Number.MAX_SAFE_INTEGER
  ) {
    initialWorldSeed = seed;
  } else {
    initialWorldSeed = getRandomSeed();
    invalidSeedProvided = true;
  }
} else {
  initialWorldSeed = getRandomSeed();
}

/**
 * Selects a slot in the materialBar.
 *
 * @param {number} index - Index of the slot (0-8)
 *
 * @returns {void}
 */
export function selectMaterialBarSlot(/** @type {number} */ index) {
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
 *
 * @returns {void}
 */
export function setMaterialBarItem(/** @type {number} */ blockId) {
  const index = gameState.activeMaterialBarSlot.get();
  const materialBar = [...gameState.materialBar.get()];
  materialBar[index] = blockId;

  gameState.materialBar.set(materialBar);
  gameState.curBlock.set(blockId);
}

/**
 * Gets the count of a material in the inventory.
 *
 * @param {string} materialName - The material name (e.g., "DIRT")
 *
 * @returns {number} The count of the material
 */
export function getMaterialCount(/** @type {string} */ materialName) {
  return (
    /** @type {Record<string, number>} */ (gameState.materialsInventory.get())[
      materialName
    ] || 0
  );
}

/**
 * Adds material(s) to the inventory.
 *
 * @param {string} materialName - The material name (e.g., "DIRT")
 * @param {number} [count=1] - Amount to add
 *
 * @returns {void}
 */
export function addMaterial(/** @type {string} */ materialName, count = 1) {
  const inv = /** @type {Record<string, number>} */ ({
    ...gameState.materialsInventory.get(),
  });

  inv[materialName] = (inv[materialName] || 0) + count;

  gameState.materialsInventory.set(inv);
}

/**
 * Removes material(s) from the inventory.
 *
 * @param {string} materialName - The material name (e.g., "DIRT")
 * @param {number} [count=1] - Amount to remove
 *
 * @returns {boolean} True if successful, false if not enough materials
 */
export function removeMaterial(/** @type {string} */ materialName, count = 1) {
  const inv = /** @type {Record<string, number>} */ ({
    ...gameState.materialsInventory.get(),
  });

  if ((inv[materialName] || 0) < count) {
    return false;
  }

  inv[materialName] -= count;

  if (inv[materialName] <= 0) {
    delete inv[materialName];
  }

  gameState.materialsInventory.set(inv);

  return true;
}

/**
 * Gets the count of a seed in the inventory.
 *
 * @param {string} seedName - The seed name (e.g., "WHEAT")
 *
 * @returns {number} The count of the seed
 */
export function getSeedCount(/** @type {string} */ seedName) {
  return (
    /** @type {Record<string, number>} */ (gameState.seedsInventory.get())[
      seedName
    ] || 0
  );
}

/**
 * Adds seed(s) to the inventory.
 *
 * @param {string} seedName - The seed name (e.g., "WHEAT")
 * @param {number} [count=1] - Amount to add
 *
 * @returns {void}
 */
export function addSeed(/** @type {string} */ seedName, count = 1) {
  const inv = /** @type {Record<string, number>} */ ({
    ...gameState.seedsInventory.get(),
  });

  inv[seedName] = (inv[seedName] || 0) + count;

  gameState.seedsInventory.set(inv);
}

/**
 * Removes seed(s) from the inventory.
 *
 * @param {string} seedName - The seed name (e.g., "WHEAT")
 * @param {number} [count=1] - Amount to remove
 *
 * @returns {boolean} True if successful, false if not enough seeds
 */
export function removeSeed(/** @type {string} */ seedName, count = 1) {
  const inv = /** @type {Record<string, number>} */ ({
    ...gameState.seedsInventory.get(),
  });

  if ((inv[seedName] || 0) < count) {
    return false;
  }

  inv[seedName] -= count;

  if (inv[seedName] <= 0) {
    delete inv[seedName];
  }

  gameState.seedsInventory.set(inv);

  return true;
}

/**
 * Converts a block name to an inventory key.
 *
 * @param {string} name - The block display name
 *
 * @returns {string} The inventory key (uppercase with underscores)
 */
export function toInventoryKey(/** @type {string} */ name) {
  return name.toUpperCase().replace(/ /g, "_");
}

/**
 * Primary game state store using reactive Signals.
 *
 * @type {GameState}
 *
 * @constant
 */
export const gameState = {
  curBlock: new Signal.State(getBlockIdByName("Sunflower")),
  world: new ChunkManager(),
  worldTime: 0.5,
  seed: initialWorldSeed,
  yaw: 0,
  pitch: 0,
  x: 0,
  y: CLOUD_HEIGHT_MIN - 1,
  z: 0,
  dx: 0,
  dy: 0,
  dz: 0,
  bobbingDistance: 0,
  bobbingIntensity: 0,
  gameTime: 0,
  playerHeight: 1.8,
  playerWidth: 0.6,
  flySpeed: 10,
  flying: new Signal.State(true),
  onGround: false,
  preventNextContextMenu: false,
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
  // Materials inventory: { "DIRT": 10, "STONE": 5, ... }
  materialsInventory: new Signal.State({}),
  // Seeds inventory: { "WHEAT": 1, "CARROT": 1, ... }
  seedsInventory: new Signal.State({}),
  // Default blocks
  materialBar: new Signal.State([
    getBlockIdByName("Sunflower"),
    getBlockIdByName("Mushroom"),
    getBlockIdByName("Lotus"),
    getBlockIdByName("Rose"),
    getBlockIdByName("Pine Tree"),
    getBlockIdByName("Dirt"),
    getBlockIdByName("Sand"),
    getBlockIdByName("Clay"),
    getBlockIdByName("Stone"),
  ]),
  activeMaterialBarSlot: new Signal.State(0),
  armedLinkConfig: new Signal.State({
    worldName: "",
    params: {},
  }),
  armedTextConfig: new Signal.State({
    text: "",
  }),
  breaking: {
    active: false,
    startTime: 0,
    blockPos: null, // {x, y, z}
    currentBlockId: null,
    breakPercentage: 0,
  },
  breakingInput: {
    isHeld: false,
    mode: "center", // 'center' | 'cursor'
    cursorX: 0,
    cursorY: 0,
  },
  placing: {
    active: false,
    lastPlaceTime: 0,
    interval: 250, // ms
  },
  placingInput: {
    isHeld: false,
    mode: "center", // 'center' | 'cursor'
    cursorX: 0,
    cursorY: 0,
  },
  cursorTarget: null,
  panStartedOnCanvas: false,
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
export function updateState(
  /** @type {string} */ key,
  /** @type {(current: any) => any} */ updater,
) {
  /** @type {any} */
  const gameStateTyped = gameState;
  const current = gameStateTyped[key]?.get();

  if (current !== undefined) {
    gameStateTyped[key].set(updater(current));
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
  /** @type {any} */
  const gameConfigTyped = gameConfig;
  const current = gameConfigTyped[key]?.get();

  if (current !== undefined) {
    gameConfigTyped[key].set(updater(current));
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
export function setConfig(/** @type {string} */ key, /** @type {any} */ value) {
  /** @type {any} */
  const gameConfigTyped = gameConfig;

  return gameConfigTyped[key]?.set(value);
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
export function getConfig(/** @type {string} */ key) {
  /** @type {any} */
  const gameConfigTyped = gameConfig;

  return gameConfigTyped[key]?.get();
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
export function setState(/** @type {string} */ key, /** @type {any} */ value) {
  /** @type {any} */
  const gameStateTyped = gameState;

  return gameStateTyped[key]?.set(value);
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
export function getState(/** @type {string} */ key) {
  /** @type {any} */
  const gameStateTyped = gameState;

  return gameStateTyped[key]?.get();
}

/**
 * Initializes the global state store and exposes it through globalThis.
 *
 * Sets up reactive state access for the game and external APIs.
 *
 * @param {BlockGardenGlobalThis} gThis - Global this or window object
 * @param {string} version - Game version string to set in config
 *
 * @returns {Promise<InitStateReturn>} Object containing both config and state
 */
export async function initState(gThis, version) {
  gameConfig.version.set(version);

  // // Initialize with starter materials
  // const starterMaterials = {
  //   DIRT: 10,
  //   STONE: 10,
  //   SAND: 10,
  //   GRASS: 10,
  // };

  // gameState.materialsInventory.set(starterMaterials);

  // Initialize with 1 seed of each plantable type
  /** @type {Object.<string, number>|null} */
  let starterSeeds = null;
  gameConfig.blocks
    .filter((b) => b.isSeed)
    .forEach((b) => {
      if (starterSeeds === null) {
        starterSeeds = /** @type {Record<string, number>} */ ({});
      }

      starterSeeds[toInventoryKey(b.name)] = 1;
    });

  if (starterSeeds !== null) {
    gameState.seedsInventory.set(starterSeeds);
  }

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
    invalidSeedProvided,
  };
}
export { gameConfig };
