import localForage from "localforage";

import { updateBiomeUI } from "../update/ui/biome.mjs";
import { updateCrops } from "../update/crops.mjs";
import { updateDepthUI } from "../update/ui/depth.mjs";
import { updatePlayer } from "../update/player.mjs";
import { updateWaterPhysics } from "../water/updateWaterPhysics.mjs";
import { render } from "./render.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../map/world.mjs').WorldMap} WorldMap */
/** @typedef {import('../state/config/biomes.mjs').BiomeMap} BiomeMap */
/** @typedef {import('../state/config/index.mjs').WaterPhysicsConfig} WaterPhysicsConfig */
/** @typedef {import('../state/config/tiles.mjs').TileIdMap} TileIdMap */
/** @typedef {import('../state/config/tiles.mjs').TileMap} TileMap */
/** @typedef {import('../util/colors/index.mjs').TileColorMap} TileColorMap */

// Fixed timestep configuration
const TARGET_FPS = 50;
const FIXED_TIMESTEP = 1000 / TARGET_FPS; // 16.67ms per update
const MAX_UPDATES_PER_FRAME = 20; // Prevent spiral

let lastFrameTime = performance.now();
let accumulatedTime = 0;

// Store previous state for interpolation
const previousState = {
  player: { x: 0, y: 0 },
  camera: { x: 0, y: 0 },
};

let scaleCache = null;
let lastFetchTime = 0;

const fetchInterval = 1000; // ms

/** @returns {Promise<number>} */
async function getScaleThrottled() {
  const now = Date.now();

  if (now - lastFetchTime > fetchInterval || scaleCache === null) {
    scaleCache = await localForage.getItem("sprite-garden-movement-scale");

    lastFetchTime = now;
  }

  return scaleCache;
}

/**
 * Main game loop - handles fixed timestep updates and rendering
 *
 * @param {HTMLCanvasElement} cnvs - Canvas element for rendering
 * @param {typeof globalThis} gThis - Global window object
 * @param {ShadowRoot} shadow - Shadow DOM root
 * @param {HTMLDivElement} biomeEl - Biome UI element
 * @param {HTMLDivElement} depthEl - Depth UI element
 * @param {TileIdMap} tileNameByIdMap - Map of tile IDs to names
 * @param {TileColorMap} tileColorMap - Map of tile names to colors
 * @param {BiomeMap} biomes - Array of biome configurations
 * @param {Signal.State} fogMode - Fog rendering mode
 * @param {Signal.State} fogScale - Fog scale factor
 * @param {number} friction - Player friction coefficient
 * @param {number} gravity - Gravity value
 * @param {Signal.State} isFogScaled - Whether fog is scaled
 * @param {number} maxFallSpeed - Maximum fall speed for player
 * @param {number} surfaceLevel - World surface level in tiles
 * @param {number} tileSize - Size of each tile in pixels
 * @param {TileMap} tiles - Map of all tile definitions
 * @param {WaterPhysicsConfig} waterPhysicsConfig - Water physics configuration
 * @param {number} worldHeight - Total world height in tiles
 * @param {number} worldWidth - Total world width in tiles
 * @param {Signal.State} worldSeed - Seed for world generation
 * @param {Signal.State} camera - Camera position state
 * @param {Signal.State} exploredMap - Map of explored tiles
 * @param {Signal.State} gameTime - Current game time state
 * @param {Signal.State} growthTimers - Growth timers for crops
 * @param {Signal.State} plantStructures - Plant structure data
 * @param {Signal.State} player - Player state
 * @param {Signal.State} shouldReset - Reset flag state
 * @param {Signal.State} viewMode - Current view mode state
 * @param {Signal.State} waterPhysicsQueue - Queue for water physics updates
 * @param {Signal.State} world - World state with tile methods
 *
 * @returns {Promise<void>}
 */
export async function gameLoop(
  cnvs,
  gThis,
  shadow,
  biomeEl,
  depthEl,
  tileNameByIdMap,
  tileColorMap,
  biomes,
  fogMode,
  fogScale,
  friction,
  gravity,
  isFogScaled,
  maxFallSpeed,
  surfaceLevel,
  tileSize,
  tiles,
  waterPhysicsConfig,
  worldHeight,
  worldWidth,
  worldSeed,
  camera,
  exploredMap,
  gameTime,
  growthTimers,
  plantStructures,
  player,
  shouldReset,
  viewMode,
  waterPhysicsQueue,
  world,
) {
  if (shouldReset.get()) {
    shouldReset.set(false);

    return;
  }

  const currentTime = performance.now();
  const frameTime = Math.min(currentTime - lastFrameTime, 250);

  lastFrameTime = currentTime;
  accumulatedTime += frameTime;

  // Fixed timestep updates - run physics at consistent rate
  let updates = 0;

  while (accumulatedTime >= FIXED_TIMESTEP && updates < MAX_UPDATES_PER_FRAME) {
    // Store previous state before update
    const currentPlayer = player.get();
    const currentCamera = camera.get();

    previousState.player.x = currentPlayer.x;
    previousState.player.y = currentPlayer.y;
    previousState.camera.x = currentCamera.x;
    previousState.camera.y = currentCamera.y;

    // Update game logic at fixed timestep
    updatePlayer(
      friction,
      gravity,
      maxFallSpeed,
      tileSize,
      worldHeight,
      worldWidth,
      world,
      camera,
      player,
      cnvs,
      shadow,
      await getScaleThrottled(),
    );

    updateCrops(
      growthTimers,
      plantStructures,
      tiles,
      world,
      worldHeight,
      worldWidth,
    );

    updateWaterPhysics(
      tiles,
      waterPhysicsConfig,
      waterPhysicsQueue,
      world,
      worldHeight,
      worldWidth,
    );

    updateBiomeUI(biomeEl, player, biomes, tileSize, worldWidth, worldSeed);
    updateDepthUI(depthEl, player, surfaceLevel, tileSize);

    // Advance game time
    gameTime.set(gameTime.get() + FIXED_TIMESTEP / 1000);

    accumulatedTime -= FIXED_TIMESTEP;
    updates++;
  }

  // Calculate interpolation factor for smooth rendering
  const interpolation = accumulatedTime / FIXED_TIMESTEP;

  render(
    cnvs,
    player,
    camera,
    tiles,
    tileSize,
    viewMode,
    world,
    worldHeight,
    worldWidth,
    fogMode,
    isFogScaled,
    fogScale,
    exploredMap,
    previousState,
    interpolation,
    tileColorMap,
    tileNameByIdMap,
  );

  // Continue game loop
  requestAnimationFrame(
    async () =>
      await gameLoop(
        cnvs,
        gThis,
        shadow,
        biomeEl,
        depthEl,
        tileNameByIdMap,
        tileColorMap,
        biomes,
        fogMode,
        fogScale,
        friction,
        gravity,
        isFogScaled,
        maxFallSpeed,
        surfaceLevel,
        tileSize,
        tiles,
        waterPhysicsConfig,
        worldHeight,
        worldWidth,
        worldSeed,
        camera,
        exploredMap,
        gameTime,
        growthTimers,
        plantStructures,
        player,
        shouldReset,
        viewMode,
        waterPhysicsQueue,
        world,
      ),
  );
}
