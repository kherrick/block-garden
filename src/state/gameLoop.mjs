import localForage from "localforage";

import { updateBiomeUI } from "../update/ui/biome.mjs";
import { updateCrops } from "../update/crops.mjs";
import { updateDepthUI } from "../update/ui/depth.mjs";
import { updatePlayer } from "../update/player.mjs";
import { updateWaterPhysics } from "../water/updateWaterPhysics.mjs";
import { render } from "./render.mjs";

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

/** @returns {Promise<any>} */
async function getScaleThrottled() {
  const now = Date.now();

  if (now - lastFetchTime > fetchInterval || scaleCache === null) {
    scaleCache = await localForage.getItem("sprite-garden-movement-scale");

    lastFetchTime = now;
  }

  return scaleCache;
}

/**
 * Game loop
 *
 * @param {any} cnvs
 * @param {any} gThis
 * @param {any} shadow
 * @param {any} biomeEl
 * @param {any} depthEl
 * @param {any} tileNameByIdMap
 * @param {any} tileColorMap
 * @param {any} gameColorMap
 * @param {any} biomes
 * @param {any} fogMode
 * @param {any} fogScale
 * @param {any} friction
 * @param {any} gravity
 * @param {any} isFogScaled
 * @param {any} maxFallSpeed
 * @param {any} surfaceLevel
 * @param {any} tileSize
 * @param {any} tiles
 * @param {any} waterPhysicsConfig
 * @param {any} worldHeight
 * @param {any} worldWidth
 * @param {any} worldSeed
 * @param {any} camera
 * @param {any} exploredMap
 * @param {any} gameTime
 * @param {any} growthTimers
 * @param {any} plantStructures
 * @param {any} player
 * @param {any} shouldReset
 * @param {any} viewMode
 * @param {any} waterPhysicsQueue
 * @param {any} world
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
  gameColorMap,
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
    gameColorMap,
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
        gameColorMap,
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
