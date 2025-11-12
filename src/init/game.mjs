import localForage from "../../deps/localForage.mjs";

import { initEffects } from "./effects.mjs";
import { initFog } from "./fog.mjs";
import { initMapEditor } from "../map/editor.mjs";
import { initNewWorld } from "./newWorld.mjs";

import { initColors } from "../dialog/colors/index.mjs";

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
export async function initGame(gThis, shadow, cnvs) {
  shadow.dispatchEvent(
    new CustomEvent("loading", {
      detail: { isLoading: false, error: null },
      bubbles: true,
      composed: true,
    }),
  );

  if (!cnvs) {
    const missingCanvasError = "HTML canvas is required to init Sprite Garden.";
    console.error(missingCanvasError);

    shadow.dispatchEvent(
      new CustomEvent("loading", {
        detail: { isLoading: false, error: missingCanvasError },
        bubbles: true,
        composed: true,
      }),
    );

    return;
  }

  shadow.addEventListener("focusout", (e) => {
    cnvs.focus();
  });

  cnvs.focus();

  let version = "1";

  try {
    version = (await (await fetch("package.json")).json()).version;
  } catch (error) {
    console.log(`continuing with static version: ${version}`);
  }

  const { gameConfig, gameState } = initState(gThis, version);
  const doc = gThis.document;

  // Input handling
  shadow.host.keys = {};
  shadow.host.touchKeys = {};

  const colors = await initColors(gThis, shadow);

  initMapEditor(doc, shadow, gameConfig.fogMode, gameState.viewMode);

  initGlobalEventListeners(gThis, doc, shadow);
  initDocumentEventListeners(gThis, shadow);
  initElementEventListeners(gThis, shadow);
  initTouchControls(shadow);

  initEffects(
    shadow,
    computedSignals.totalSeeds,
    gameConfig.breakMode,
    gameConfig.fogMode,
    gameConfig.worldSeed,
    gameState.gameTime,
    gameState.materialsInventory,
    gameState.seedInventory,
    gameState.selectedMaterialType,
    gameState.selectedSeedType,
    gameState.viewMode,
  );

  const worldHeight = gameConfig.WORLD_HEIGHT.get();
  const worldWidth = gameConfig.WORLD_WIDTH.get();

  const currentWorld = initNewWorld(
    gameConfig.BIOMES,
    gameConfig.SURFACE_LEVEL.get(),
    gameConfig.TILE_SIZE.get(),
    gameConfig.TILES,
    worldHeight,
    worldWidth,
    gameConfig.worldSeed,
    gameState.gameTime,
    gameState.growthTimers,
    gameState.plantStructures,
    gameState.player,
    gameState.seedInventory,
  );

  // Set the world in state
  gameState.world.set(currentWorld);

  const currentFog = initFog(
    gameConfig.isFogScaled,
    worldHeight,
    worldWidth,
    colors,
  );

  // Set the fog in state
  gameState.exploredMap.set(currentFog);

  initTileInspection({
    cnvs,
    camera: gameState.camera,
    scale: gameConfig.canvasScale.get(),
    tiles: gameConfig.TILES,
    tileSize: gameConfig.TILE_SIZE.get(),
    worldHeight: gameConfig.WORLD_HEIGHT.get(),
    worldWidth: gameConfig.WORLD_WIDTH.get(),
    world: gameState.world,
  });

  resizeCanvas(shadow, gameConfig);

  const ver = await localForage.setItem(`sprite-garden-version`, version);
  console.log(`Sprite Garden version: ${ver}`);

  await gameLoop(
    gThis,
    shadow,
    shadow.getElementById("currentBiome"),
    shadow.getElementById("currentDepth"),
    cnvs,
    gameConfig.BIOMES,
    gameConfig.fogMode,
    gameConfig.fogScale,
    gameConfig.FRICTION.get(),
    gameConfig.GRAVITY.get(),
    gameConfig.isFogScaled,
    gameConfig.MAX_FALL_SPEED.get(),
    gameConfig.SURFACE_LEVEL.get(),
    gameConfig.TILE_SIZE.get(),
    gameConfig.TILES,
    gameConfig.waterPhysics,
    gameConfig.WORLD_HEIGHT.get(),
    gameConfig.WORLD_WIDTH.get(),
    gameConfig.worldSeed,
    gameState.camera,
    gameState.exploredMap,
    gameState.gameTime,
    gameState.growthTimers,
    gameState.plantStructures,
    gameState.player,
    gameState.viewMode,
    gameState.waterPhysicsQueue,
    gameState.world,
  );

  // hide loading animation
  shadow.getElementById("loading").setAttribute("hidden", "hidden");
  shadow.dispatchEvent(
    new CustomEvent("loading", {
      detail: { isLoading: false, error: null },
      bubbles: true,
      composed: true,
    }),
  );
}
