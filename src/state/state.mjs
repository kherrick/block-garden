import { Signal } from "signal-polyfill";
import { gameConfig } from "./config/index.mjs";
import { FogMap } from "../map/fog.mjs";

const { TileName } = gameConfig;

export const gameState = {
  // World data
  world: new Signal.State({
    setTile: (...deps) => {},
  }),
  // Tracks which tiles have been explored for map fog
  exploredMap: new Signal.State(new FogMap()),
  // Store plant growth data
  plantStructures: new Signal.State({}),
  gameTime: new Signal.State(0),
  growthTimers: new Signal.State({}),
  seeds: new Signal.State(0),
  selectedMaterialType: new Signal.State(null),
  selectedSeedType: new Signal.State(null),
  shouldReset: new Signal.State(false),
  viewMode: new Signal.State("normal"),
  waterPhysicsQueue: new Signal.State(new Set()),
  seedInventory: new Signal.State({
    [TileName.AGAVE]: 0,
    [TileName.BAMBOO]: 0,
    [TileName.BERRY_BUSH]: 0,
    [TileName.BIRCH]: 0,
    [TileName.CACTUS]: 0,
    [TileName.CARROT]: 0,
    [TileName.CORN]: 0,
    [TileName.FERN]: 0,
    [TileName.KELP]: 0,
    [TileName.LAVENDER]: 0,
    [TileName.LOTUS]: 0,
    [TileName.MUSHROOM]: 0,
    [TileName.PINE_TREE]: 0,
    [TileName.PUMPKIN]: 0,
    [TileName.ROSE]: 0,
    [TileName.SUNFLOWER]: 0,
    [TileName.TULIP]: 0,
    [TileName.WALNUT]: 0,
    [TileName.WHEAT]: 0,
    [TileName.WILLOW_TREE]: 0,
  }),
  materialsInventory: new Signal.State({
    [TileName.CLAY]: 0,
    [TileName.CLOUD]: 0,
    [TileName.COAL]: 0,
    [TileName.DIRT]: 0,
    [TileName.GOLD]: 0,
    [TileName.GRASS]: 0,
    [TileName.ICE]: 0,
    [TileName.IRON]: 0,
    [TileName.PUMICE]: 0,
    [TileName.SAND]: 0,
    [TileName.SNOW]: 0,
    [TileName.STONE]: 0,
    [TileName.WOOD]: 0,
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

export const computedSignals = {
  totalSeeds: new Signal.Computed(() => {
    const inventory = gameState.seedInventory.get();

    return Object.values(inventory).reduce((sum, count) => sum + count, 0);
  }),
};

/**
 * @param {any} key
 * @param {any} updater
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
 * @param {any} key
 * @param {any} updater
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
 * @param {any} key
 * @param {any} value
 *
 * @returns {any}
 */
export function setConfig(key, value) {
  return gameConfig[key]?.set(value);
}

/**
 * @param {any} key
 *
 * @returns {any}
 */
export function getConfig(key) {
  return gameConfig[key]?.get();
}

/**
 * @param {any} key
 * @param {any} value
 *
 * @returns {any}
 */
export function setState(key, value) {
  return gameState[key]?.set(value);
}

/**
 * @param {any} key
 *
 * @returns {any}
 */
export function getState(key) {
  return gameState[key]?.get();
}

/**
 * @param {any} gThis
 * @param {any} version
 *
 * @returns {{ gameConfig: any; gameState: any; }}
 */
export function initState(gThis, version) {
  gameConfig.version.set(version);

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

export { gameConfig };
