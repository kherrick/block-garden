import { Signal } from "signal-polyfill";

import { gameConfig } from "./config/index.mjs";
import { FogMap } from "../map/fog.mjs";

/** @typedef {import('./config/index.mjs').GameConfig} GameConfig */

const { TileNames } = gameConfig;

/**
 * @typedef {{x: number, y: number}} TilePosition TilePosition
 */

/**
 * @typedef {{x: number, y: number}} TilePositionNormalized TilePositionNormalized
 */

/**
 * @typedef {{x: number, y: number}} PixelPosition PixelPosition
 */

/**
 * Player state object.
 *
 * @typedef {Object} PlayerState
 *
 * @property {number} x - X position in pixels
 * @property {number} y - Y position in pixels
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 * @property {number} velocityX - Horizontal velocity in pixels/frame
 * @property {number} velocityY - Vertical velocity in pixels/frame
 * @property {number} speed - Movement speed in pixels/frame
 * @property {number} jumpPower - Jump force multiplier
 * @property {boolean} onGround - Whether player is touching solid ground
 * @property {string} color - Hex color for player sprite
 * @property {number} lastDirection - Last facing direction (-1 left, 1 right)
 */

/**
 * Player object with position and size.
 *
 * @typedef {Object} Player
 *
 * @property {number} x - X position in pixels
 * @property {number} y - Y position in pixels
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 */

/**
 * Positional information relative to world.
 *
 * @typedef {Object} PlayerPositionData
 *
 * @property {PixelPosition} pixel - Pixel coordinates
 * @property {TilePosition} tile - Tile coordinates
 * @property {TilePositionNormalized} normalized - Normalized position (0-1)
 * @property {{horizontal: string, vertical: string}} location - Descriptive region
 * @property {{isAtLeft: boolean, isAtRight: boolean, isAtTop: boolean, isAtBottom: boolean}} bounds - Boundary flags
 */

/**
 * Camera state object.
 *
 * @typedef {Object} CameraState
 *
 * @property {number} x - Camera X offset in pixels
 * @property {number} y - Camera Y offset in pixels
 * @property {number} speed - Camera movement smoothing speed
 */

/**
 * Game configuration state.
 *
 * @typedef {Object} GameState
 *
 * @property {Signal.State} world
 * @property {Signal.State} exploredMap
 * @property {Signal.State} plantStructures
 * @property {Signal.State} gameTime
 * @property {Signal.State} growthTimers
 * @property {Signal.State} selectedMaterialType
 * @property {Signal.State} selectedSeedType
 * @property {Signal.State} shouldReset
 * @property {Signal.State} viewMode
 * @property {Signal.State} waterPhysicsQueue
 * @property {Signal.State} seedInventory
 * @property {Signal.State} materialsInventory
 * @property {Signal.State} player
 * @property {Signal.State} camera
 */

/**
 * Primary game state store using reactive Signals.
 *
 * Contains world, player, camera, and inventory data.
 *
 * @type {GameState}
 *
 * @constant
 */
export const gameState = {
  // World data - initialized in initState() to avoid circular dependency
  world: new Signal.State(null),
  // Tracks which tiles have been explored for map fog
  exploredMap: new Signal.State(new FogMap(500, 300)),
  // Store plant growth data
  plantStructures: new Signal.State({}),
  gameTime: new Signal.State(0),
  growthTimers: new Signal.State({}),
  selectedMaterialType: new Signal.State(null),
  selectedSeedType: new Signal.State(null),
  shouldReset: new Signal.State(false),
  viewMode: new Signal.State("normal"),
  waterPhysicsQueue: new Signal.State(new Set()),
  seedInventory: new Signal.State({
    [TileNames.AGAVE]: 0,
    [TileNames.BAMBOO]: 0,
    [TileNames.BERRY_BUSH]: 0,
    [TileNames.BIRCH]: 0,
    [TileNames.CACTUS]: 0,
    [TileNames.CARROT]: 0,
    [TileNames.CORN]: 0,
    [TileNames.FERN]: 0,
    [TileNames.KELP]: 0,
    [TileNames.LAVENDER]: 0,
    [TileNames.LOTUS]: 0,
    [TileNames.MUSHROOM]: 0,
    [TileNames.PINE_TREE]: 0,
    [TileNames.PUMPKIN]: 0,
    [TileNames.ROSE]: 0,
    [TileNames.SUNFLOWER]: 0,
    [TileNames.TULIP]: 0,
    [TileNames.WALNUT]: 0,
    [TileNames.WHEAT]: 0,
    [TileNames.WILLOW_TREE]: 0,
  }),
  materialsInventory: new Signal.State({
    [TileNames.CLAY]: 0,
    [TileNames.CLOUD]: 0,
    [TileNames.COAL]: 0,
    [TileNames.DIRT]: 0,
    [TileNames.GOLD]: 0,
    [TileNames.GRASS]: 0,
    [TileNames.ICE]: 0,
    [TileNames.IRON]: 0,
    [TileNames.PUMICE]: 0,
    [TileNames.SAND]: 0,
    [TileNames.SNOW]: 0,
    [TileNames.STONE]: 0,
    [TileNames.WOOD]: 0,
  }),
  // Player character
  player: new Signal.State({
    x: 200,
    y: 50,
    width: 6,
    height: 8,
    velocityX: 0,
    velocityY: 0,
    speed: 2.75,
    jumpPower: 12,
    onGround: false,
    color: "#FF69B4",
    // Track last movement direction
    lastDirection: 0,
  }),
  // Camera system
  camera: new Signal.State({
    x: 0,
    y: 0,
    speed: 5,
  }),
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
  totalSeeds: new Signal.Computed(() => {
    const inventory = gameState.seedInventory.get();

    return Object.values(inventory).reduce((sum, count) => sum + count, 0);
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
 * @returns {Promise<{gameConfig: GameConfig, gameState: GameState}>} Object containing both config and state
 */
export async function initState(gThis, version) {
  gameConfig.version.set(version);

  // Initialize world map here to avoid circular dependency
  const { WorldMap } = await import("../map/world.mjs");
  gameState.world.set(new WorldMap(500, 300));

  // Expose reactive state through globalThis
  gThis.spriteGarden = {
    ...gThis?.spriteGarden,
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
    gameConfig,
    gameState,
  };
}

export const hasEnabledExtras = new Signal.State(false);
export const hasDismissedTutorial = new Signal.State(false);
export const tutorialToastShown = new Signal.State(false);
export const tutorialListener = new Signal.State(null);

export { gameConfig };
