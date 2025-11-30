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
  checkSharedSave,
  getSaveMode,
} from "../dialog/storage.mjs";

import { applyColorsToShadowHost } from "../util/colors/applyColorsToShadowHost.mjs";
import { COLOR_STORAGE_KEY } from "../dialog/colors/index.mjs";
import { getSavedColors } from "../dialog/colors/getSavedColors.mjs";

import { resizeCanvas } from "../util/resizeCanvas.mjs";

import { computedSignals, initState } from "../state/state.mjs";
import { colors as spriteGardenColors } from "../state/config/colors.mjs";
import { gameLoop } from "../state/gameLoop.mjs";
import { getTileNameByIdMap } from "../state/config/tiles.mjs";

import { buildStyleMapByPropNamesWithoutPrefixesOrSuffixes } from "../util/colors/buildStyleMapByPropNamesWithoutPrefixesOrSuffixes.mjs";
import { getCustomProperties } from "../util/colors/getCustomProperties.mjs";
import { transformStyleMap } from "../util/colors/transformStyleMap.mjs";

/**
 * @typedef {Element & { keys: object, touchKeys: object }} CustomShadowHost
 */

/**
 * Initializes the environment for the game, including input handling, game state, world generation, colors, and other
 * functionality like setting up tile inspection.
 *
 * @param {typeof globalThis} gThis - The global `this` context (global object), typically `window` in browsers.
 * @param {ShadowRoot} shadow - The shadow DOM root element where the game components are rendered.
 * @param {HTMLCanvasElement | null} cnvs - The HTML canvas element used for rendering the game, or null if missing.
 *
 * @returns {Promise<void>} A promise that resolves once the game initialization completes.
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

  const { gameConfig, gameState } = await initState(gThis, version);
  const doc = gThis.document;

  const host =
    /** @type {CustomShadowHost} */
    (shadow.host);

  host.keys = {};
  host.touchKeys = {};

  // init colors
  const savedColors = await getSavedColors(COLOR_STORAGE_KEY);
  const initialColors = getCustomProperties(gThis, shadow);
  const colors = savedColors ?? initialColors;

  applyColorsToShadowHost(shadow, colors);

  initMapEditor(shadow, gameConfig.fogMode, gameState.viewMode);
  initGlobalEventListeners(gThis, shadow);
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

  // Check for shared save first (takes priority)
  let sharedSaveLoaded = await checkSharedSave(gThis, shadow);

  // If no shared save, check for auto-save
  let autoSaveLoaded = false;
  if (!sharedSaveLoaded) {
    autoSaveLoaded = await checkAutoSave(gThis, shadow);
  }

  if (!sharedSaveLoaded && !autoSaveLoaded) {
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
    let colors;

    if (e instanceof CustomEvent) {
      colors = e?.detail?.colors ?? {};
    }

    // Build color map for tiles
    let tileColorMap;
    if (Object.keys(colors).length && colors.constructor === Object) {
      tileColorMap = transformStyleMap(colors, "--sg-tile-", "-color");
    } else {
      tileColorMap = transformStyleMap(initialColors, "--sg-tile-", "-color");
    }

    await gameLoop(
      cnvs,
      gThis,
      shadow,
      /** @type HTMLDivElement */
      (shadow.getElementById("currentBiome")),
      /** @type HTMLDivElement */
      (shadow.getElementById("currentDepth")),
      getTileNameByIdMap(gameConfig.TILES),
      tileColorMap,
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

  // Build color maps
  const styles = gThis.getComputedStyle(shadow.host);
  const tileColorMap = buildStyleMapByPropNamesWithoutPrefixesOrSuffixes(
    styles,
    Object.keys(spriteGardenColors["tile"]).map((v) => `--sg-tile-${v}-color`),
    "--sg-tile-",
    "-color",
  );

  await gameLoop(
    cnvs,
    gThis,
    shadow,
    /** @type HTMLDivElement */
    (shadow.getElementById("currentBiome")),
    /** @type HTMLDivElement */
    (shadow.getElementById("currentDepth")),
    getTileNameByIdMap(gameConfig.TILES),
    tileColorMap,
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
