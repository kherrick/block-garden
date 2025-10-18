import { Signal } from "../../deps/signal.mjs";

import { gameConfig } from "./config.mjs";

export const gameState = {
  waterPhysicsQueue: new Signal.State(new Set()),
  // Tracks which tiles have been explored for map fog
  exploredMap: {},
  seedInventory: new Signal.State({
    [gameConfig.TILES.WHEAT]: 0,
    [gameConfig.TILES.CARROT]: 0,
    [gameConfig.TILES.MUSHROOM]: 0,
    [gameConfig.TILES.CACTUS]: 0,
    [gameConfig.TILES.WALNUT]: 0,
    [gameConfig.TILES.BERRY_BUSH]: 0,
    [gameConfig.TILES.BAMBOO]: 0,
    [gameConfig.TILES.SUNFLOWER]: 0,
    [gameConfig.TILES.CORN]: 0,
    [gameConfig.TILES.PINE_TREE]: 0,
    [gameConfig.TILES.WILLOW_TREE]: 0,
    [gameConfig.TILES.FERN]: 0,
  }),
  materialsInventory: new Signal.State({
    [gameConfig.TILES.DIRT]: 0,
    [gameConfig.TILES.STONE]: 0,
    [gameConfig.TILES.WOOD]: 0,
    [gameConfig.TILES.SAND]: 0,
    [gameConfig.TILES.CLAY]: 0,
    [gameConfig.TILES.COAL]: 0,
    [gameConfig.TILES.IRON]: 0,
    [gameConfig.TILES.GOLD]: 0,
    [gameConfig.TILES.PUMICE]: 0,
  }),
  selectedSeedType: new Signal.State(null),
  selectedMaterialType: new Signal.State(null),
  gameTime: new Signal.State(0),
  growthTimers: new Signal.State({}),
  // Store plant growth data
  plantStructures: new Signal.State({}),
  seeds: new Signal.State(0),
  viewMode: new Signal.State("normal"),
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
  // World data
  world: new Signal.State([]),
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

export function updateState(key, updater) {
  const current = gameState[key]?.get();

  if (current !== undefined) {
    gameState[key].set(updater(current));
  }
}

export function updateConfig(key, updater) {
  const current = gameConfig[key]?.get();

  if (current !== undefined) {
    gameConfig[key].set(updater(current));
  }
}

export function setConfig(key, value) {
  return gameConfig[key]?.set(value);
}

export function getConfig(key) {
  return gameConfig[key]?.get();
}

export function setState(key, value) {
  return gameState[key]?.set(value);
}

export function getState(key) {
  return gameState[key]?.get();
}

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
