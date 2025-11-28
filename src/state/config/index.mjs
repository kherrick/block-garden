import { Signal } from "signal-polyfill";

import { getRandomSeed } from "../../misc/getRandomSeed.mjs";

import { BIOMES } from "./biomes.mjs";
import { TILES, TileName } from "./tiles.mjs";

/** @typedef {import('./biomes.mjs').BiomeMap} BiomeMap */
/** @typedef {import('./tiles.mjs').TileMap} TileMap */
/** @typedef {import('./tiles.mjs').TileNameMap} TileNameMap */

/**
 * Water physics configuration object.
 *
 * @typedef {Object} WaterPhysicsConfig
 *
 * @property {number} updateInterval - Frame count between water physics updates
 * @property {number} frameCounter - Current frame counter for water updates
 * @property {number} maxIterationsPerUpdate - Max iterations per update cycle
 * @property {number} checkRadius - Tile radius around dirty regions to check
 * @property {Set<string>} dirtyRegions - Set of regions needing water updates
 */

/**
 * Game configuration store.
 *
 * @typedef {Object} GameConfig
 *
 * @property {Signal.State} fogMode - Signal State holding fog mode setting
 * @property {Signal.State} fogScale - Signal State for fog rendering scale in tiles
 * @property {Signal.State} isFogScaled - Signal State for fog scaling flag
 * @property {Signal.State} breakMode - Signal State for break mode setting
 * @property {Signal.State} canvasScale - Signal State for canvas scaling factor
 * @property {Signal.State} currentResolution - Signal State for current resolution
 * @property {Signal.State} version - Signal State for game version string
 * @property {Signal.State} worldSeed - Signal State for world generation seed
 * @property {Signal.State} TILE_SIZE - Signal State for tile size in pixels
 * @property {Signal.State} WORLD_WIDTH - Signal State for total world width in tiles
 * @property {Signal.State} WORLD_HEIGHT - Signal State for total world height in tiles
 * @property {Signal.State} SURFACE_LEVEL - Signal State for surface Y-coordinate
 * @property {Signal.State} GRAVITY - Signal State for gravitational acceleration
 * @property {Signal.State} FRICTION - Signal State for friction coefficient
 * @property {Signal.State} MAX_FALL_SPEED - Signal State for terminal velocity
 * @property {WaterPhysicsConfig} waterPhysics - Water simulation config
 * @property {BiomeMap} BIOMES - All biome definitions
 * @property {TileMap} TILES - All tile definitions
 * @property {TileNameMap} TileName - Tile name constants
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
 * Global game configuration and constants.
 *
 * Uses Signal for reactive updates on mutable config values.
 *
 * @type {GameConfig}
 *
 * @constant
 */
export const gameConfig = {
  // Fog mode setting - "fog" || "clear"
  fogMode: new Signal.State("fog"),
  fogScale: new Signal.State(8),
  isFogScaled: new Signal.State(true),
  // Break mode setting
  breakMode: new Signal.State("regular"),
  canvasScale: new Signal.State(1),
  currentResolution: new Signal.State("400"),
  version: new Signal.State("1"),
  worldSeed: new Signal.State(initialWorldSeed),
  waterPhysics: {
    // Update every 10 frames
    updateInterval: 10,
    // Count for water updates
    frameCounter: 0,
    // Maximum iterations per update to prevent CPU overload
    maxIterationsPerUpdate: 5,
    // How many tiles around changed areas to check
    checkRadius: 15,
    // Track areas that need water physics updates
    dirtyRegions: new Set(),
  },
  TILE_SIZE: new Signal.State(8),
  WORLD_WIDTH: new Signal.State(500),
  WORLD_HEIGHT: new Signal.State(300),
  SURFACE_LEVEL: new Signal.State(90),
  // Physics constants
  GRAVITY: new Signal.State(0.7),
  FRICTION: new Signal.State(0.8),
  MAX_FALL_SPEED: new Signal.State(15),
  BIOMES,
  TILES,
  TileName,
};
