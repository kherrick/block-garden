import localForage from "localforage";

import { initEffects } from "./effects.mjs";
import { initFog } from "./fog.mjs";
import { initMapEditor } from "../map/editor.mjs";
import { initNewWorld } from "./newWorld.mjs";

import {
  initDocumentEventListeners,
  initElementEventListeners,
  initGlobalEventListeners,
} from "./eventListeners.mjs";

import { initTouchControls } from "./touchControls.mjs";
import { initTileInspection } from "./tileInspection.mjs";

import {
  AUTO_SAVE_INTERVAL,
  autoSaveGame,
  checkAutoSave,
  getSaveMode,
} from "../dialog/storage.mjs";

import { applyColors } from "../dialog/colors/applyColors.mjs";
import { COLOR_STORAGE_KEY } from "../dialog/colors/index.mjs";
import { getCustomProperties } from "../dialog/colors/getCustomProperties.mjs";
import { getSavedColors } from "../dialog/colors/getSavedColors.mjs";
import { resizeCanvas } from "../util/resizeCanvas.mjs";

import {
  buildColorMapByStyleDeclaration,
  buildColorMapByStyleMap,
  buildColorMapWithoutPrefixesByPropNames,
  getTileNameByIdMap,
  sgColorPropList,
  sgTileColorPropList,
} from "../state/config/tiles.mjs";

import { computedSignals, initState } from "../state/state.mjs";
import { gameLoop } from "../state/gameLoop.mjs";

/**
 * Initialize game
 *
 * @param {any} gThis
 * @param {any} shadow
 * @param {any} cnvs
 *
 * @returns {Promise<void>}
 */
export async function initGame(gThis, shadow, cnvs) {
  shadow.dispatchEvent(
    new CustomEvent("sprite-garden-load", {
      detail: { isLoading: true, error: null },
      bubbles: true,
      composed: true,
    }),
  );

  if (!cnvs) {
    const missingCanvasError = "HTML canvas is required to init Sprite Garden.";

    console.error(missingCanvasError);

    shadow.dispatchEvent(
      new CustomEvent("sprite-garden-load", {
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

  let pkg = {};
  let version = "1";

  try {
    pkg = await (await fetch("package.json")).json();
    version = pkg.version;
  } catch (error) {
    console.log(`continuing with static version: ${version}`);
  }

  const { gameConfig, gameState } = initState(gThis, version);
  const doc = gThis.document;

  // Input handling
  shadow.host.keys = {};
  shadow.host.touchKeys = {};

  // init colors
  const savedColors = await getSavedColors(shadow, COLOR_STORAGE_KEY);
  const initialColors = getCustomProperties(gThis, shadow);
  const colors = savedColors ?? initialColors;

  applyColors(shadow, colors);

  initMapEditor(shadow, gameConfig.fogMode, gameState.viewMode);
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

  // Check for auto-save before generating new world
  const autoSaveLoaded = await checkAutoSave(gThis, shadow);
  if (!autoSaveLoaded) {
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
  }

  // Set up auto-save interval
  setInterval(async () => {
    const saveMode = await getSaveMode();

    if (saveMode === "auto") {
      await autoSaveGame(gThis);
    }
  }, AUTO_SAVE_INTERVAL);

  initTileInspection(
    cnvs,
    gameState.camera,
    gameConfig.canvasScale.get(),
    gameConfig.TILES,
    gameConfig.TILE_SIZE.get(),
    gameConfig.WORLD_HEIGHT.get(),
    gameConfig.WORLD_WIDTH.get(),
    gameState.world,
  );

  resizeCanvas(shadow, gameConfig);

  const ver = await localForage.setItem(`sprite-garden-version`, version);

  console.log(`Sprite Garden version: ${ver}`);

  shadow.addEventListener("sprite-garden-reset", async (e) => {
    const colors = e?.detail?.colors ?? {};

    // Build color map for tiles
    let gameColorMap;
    let tileColorMap;

    if (Object.keys(colors).length && colors.constructor === Object) {
      gameColorMap = buildColorMapByStyleMap(colors, "--sg-color-");
      tileColorMap = buildColorMapByStyleMap(colors, "--sg-tile-color-");
    } else {
      gameColorMap = buildColorMapByStyleMap(initialColors, "--sg-color-");
      tileColorMap = buildColorMapByStyleMap(initialColors, "--sg-tile-color-");
    }

    await gameLoop(
      cnvs,
      gThis,
      shadow,
      shadow.getElementById("currentBiome"),
      shadow.getElementById("currentDepth"),
      getTileNameByIdMap(gameConfig.TILES),
      tileColorMap,
      gameColorMap,
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
      gameState.shouldReset,
      gameState.viewMode,
      gameState.waterPhysicsQueue,
      gameState.world,
    );

    gameState.shouldReset.set(true);
  });

  // Build color map for tiles
  const styles = gThis.getComputedStyle(shadow.host);
  const gameColorMap = buildColorMapWithoutPrefixesByPropNames(
    styles,
    sgColorPropList,
    "--sg-color-",
  );

  const tileColorMap = buildColorMapWithoutPrefixesByPropNames(
    styles,
    sgTileColorPropList,
    "--sg-tile-color-",
  );

  await gameLoop(
    cnvs,
    gThis,
    shadow,
    shadow.getElementById("currentBiome"),
    shadow.getElementById("currentDepth"),
    getTileNameByIdMap(gameConfig.TILES),
    tileColorMap,
    gameColorMap,
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
    gameState.shouldReset,
    gameState.viewMode,
    gameState.waterPhysicsQueue,
    gameState.world,
  );

  // hide loading animation
  shadow.getElementById("loading").setAttribute("hidden", "hidden");
  shadow.dispatchEvent(
    new CustomEvent("sprite-garden-load", {
      detail: { isLoading: false, pkg, error: null },
      bubbles: true,
      composed: true,
    }),
  );
}
