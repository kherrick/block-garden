import localForage from "../../deps/localForage.mjs";

import { initMapEditor } from "../map/editor.mjs";
import { initNewWorld } from "./newWorld.mjs";
import { initEffects } from "./effects.mjs";

import {
  initDocumentEventListeners,
  initElementEventListeners,
  initGlobalEventListeners,
} from "./eventListeners.mjs";

import { initTouchControls } from "./touchControls.mjs";
import { initTileInspection } from "./tileInspection.mjs";

import { resizeCanvas } from "../util/resizeCanvas.mjs";

import { computedSignals, initState } from "../state/state.mjs";
import { gameLoop } from "../state/gameLoop.mjs";

// Initialize game
export async function initGame(gThis, doc, cnvs) {
  let version = "1";

  try {
    version = (await (await fetch("package.json")).json()).version;
  } catch (error) {
    console.log(`continuing with static version: ${version}`);
  }

  const { gameConfig, gameState } = initState(gThis, version);

  initMapEditor(doc, gameConfig.fogMode, gameState.viewMode);

  initGlobalEventListeners(gThis);
  initDocumentEventListeners(gThis);
  initElementEventListeners(doc);
  initTouchControls(doc);

  initEffects({
    doc,
    breakMode: gameConfig.breakMode,
    fogMode: gameConfig.fogMode,
    gameTime: gameState.gameTime,
    materialsInventory: gameState.materialsInventory,
    seedInventory: gameState.seedInventory,
    selectedMaterialType: gameState.selectedMaterialType,
    selectedSeedType: gameState.selectedSeedType,
    totalSeeds: computedSignals.totalSeeds,
    viewMode: gameState.viewMode,
    worldSeed: gameConfig.worldSeed,
  });

  const currentWorld = initNewWorld({
    biomes: gameConfig.BIOMES,
    gameTime: gameState.gameTime,
    growthTimers: gameState.growthTimers,
    plantStructures: gameState.plantStructures,
    player: gameState.player,
    seedInventory: gameState.seedInventory,
    surfaceLevel: gameConfig.SURFACE_LEVEL.get(),
    tiles: gameConfig.TILES,
    tileSize: gameConfig.TILE_SIZE.get(),
    worldHeight: gameConfig.WORLD_HEIGHT.get(),
    worldWidth: gameConfig.WORLD_WIDTH.get(),
    worldSeed: gameConfig.worldSeed,
  });

  // Set the world in state
  gameState.world.set(currentWorld);

  initTileInspection({
    cnvs,
    camera: gameState.camera.get(),
    scale: gameConfig.canvasScale.get(),
    tiles: gameConfig.TILES,
    tileSize: gameConfig.TILE_SIZE.get(),
    worldHeight: gameConfig.WORLD_HEIGHT.get(),
    worldWidth: gameConfig.WORLD_WIDTH.get(),
    world: gameState.world.get(),
  });

  resizeCanvas(doc, gameConfig);

  const ver = await localForage.setItem(`sprite-garden-version`, version);
  console.log(`Sprite Garden version: ${ver}`);

  await gameLoop(
    gThis,
    gameConfig.worldSeed,
    gameConfig.BIOMES,
    gameConfig.SURFACE_LEVEL.get(),
    gameConfig.FRICTION.get(),
    gameConfig.GRAVITY.get(),
    gameConfig.MAX_FALL_SPEED.get(),
    gameConfig.TILE_SIZE.get(),
    gameConfig.TILES,
    gameConfig.WORLD_HEIGHT.get(),
    gameConfig.WORLD_WIDTH.get(),
    gameState.growthTimers,
    gameState.plantStructures,
    gameState.waterPhysicsQueue,
    gameConfig.waterPhysics,
    gameState.world,
    gameState.camera,
    gameState.player,
    gameState.viewMode,
    gameConfig.fogMode,
    gameConfig.isFogScaled,
    gameConfig.fogScale,
    gameState.exploredMap,
    gameState.gameTime,
    doc.getElementById("currentBiome"),
    doc.getElementById("currentDepth"),
  );

  doc.getElementById("loading").setAttribute("hidden", "hidden");
}
