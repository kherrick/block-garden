import Hammer from "hammerjs";
import localForage from "localforage";

import { applyColorsToShadowHost } from "../util/colors/applyColorsToShadowHost.mjs";
import { buildStyleMapByPropNamesWithoutPrefixesOrSuffixes } from "../util/colors/buildStyleMapByPropNamesWithoutPrefixesOrSuffixes.mjs";
import { cssColorToRGB } from "../util/colors/cssColorToRGB.mjs";
import { getCustomProperties } from "../util/colors/getCustomProperties.mjs";
import { normalizeRGBToRGBA } from "../util/colors/normalizeRGB.mjs";
import { transformStyleMap } from "../util/colors/transformStyleMap.mjs";

import {
  AUTO_SAVE_INTERVAL,
  autoSaveGame,
  checkAutoSave,
  checkSharedSave,
  getSaveMode,
} from "../dialog/storage.mjs";

import { COLOR_STORAGE_KEY } from "../dialog/colors/index.mjs";
import { getSavedColors } from "../dialog/colors/getSavedColors.mjs";

import { cancelGameLoop, gameLoop } from "../state/gameLoop.mjs";
import { colors as gameColors } from "../state/config/colors.mjs";
import { initState } from "../state/state.mjs";

import {
  initCanvasEventListeners,
  initElementEventListeners,
  initMaterialBarEventListeners,
} from "./eventListeners.mjs";

import { initEffects, initMaterialBarEffects } from "./effects.mjs";
import { initGameDependencies } from "./gameDependencies.mjs";
import { initHammerControls } from "./hammerControls.mjs";
import { initMaterialBar } from "./materialBar.mjs";
import { initNewWorld } from "./newWorld.mjs";
import { initTouchControls } from "./touchControls.mjs";

/**
 * @typedef {Element & { keys: object, touchKeys: object }} CustomShadowHost
 */

/**
 * Initializes the environment for the game.
 *
 * @param {typeof globalThis} gThis
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 *
 * @returns {Promise<void>} A promise that resolves once the game initialization completes.
 */
export async function initGame(gThis, shadow, cnvs) {
  cancelGameLoop();

  shadow.dispatchEvent(
    new CustomEvent("block-garden-load", {
      detail: { isLoading: true, error: null },
      bubbles: true,
      composed: true,
    }),
  );

  if (!cnvs) {
    const missingCanvasError = "HTML canvas is required to init Block Garden.";

    console.error(missingCanvasError);

    shadow.dispatchEvent(
      new CustomEvent("block-garden-load", {
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

  const { computedSignals, gameConfig, gameState } = await initState(
    gThis,
    version,
  );

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

  // Build color maps
  const styles = gThis.getComputedStyle(shadow.host);
  const blockColorMap = Object.fromEntries(
    Object.entries(
      buildStyleMapByPropNamesWithoutPrefixesOrSuffixes(
        styles,
        Object.keys(gameColors["block"]).map((v) => `--bg-block-${v}-color`),
        "--bg-block-",
        "-color",
      ),
    ).map(([k, v]) => [
      k
        .replaceAll("-", " ")
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      normalizeRGBToRGBA(cssColorToRGB(gThis.document, v)),
    ]),
  );

  initEffects(shadow, computedSignals.currentBlock);
  initElementEventListeners(shadow, cnvs, gameConfig.currentResolution);
  initCanvasEventListeners(shadow, cnvs, gameConfig.blocks, gameState.curBlock);
  initHammerControls(Hammer(shadow.host), shadow, gameState);
  initTouchControls(shadow);

  initMaterialBarEffects(shadow, initMaterialBar(gameColors));

  initMaterialBarEventListeners(shadow);

  // Only pass cnvs to initGameDependencies, and call it once
  const { gl, cbuf, cube, uL, uM, uMVP } = initGameDependencies(cnvs);

  // Get required UI buttons for flight controls
  const ui = {
    playerX: shadow.getElementById("playerX"),
    playerY: shadow.getElementById("playerY"),
    playerZ: shadow.getElementById("playerZ"),
  };

  // Attach reset event listener loading saves so it is ready for auto-save loading
  shadow.addEventListener("block-garden-reset", (e) => {
    // Set all growthTimers to FAST_GROWTH_TIME if enabled else restore to block default
    const { blocks } = gameConfig;
    const { growthTimers, plantStructures } = gameState;
    const FAST_GROWTH_TIME = blocks.FAST_GROWTH_TIME || 30;

    Object.keys(growthTimers).forEach((key) => {
      if (gameState.fastGrowth) {
        growthTimers[key] = FAST_GROWTH_TIME;
      } else {
        // Restore to block default
        const plantType = plantStructures[key]?.type;
        const block = blocks.find((b) => b.name === plantType);
        growthTimers[key] = block?.growthTime || 10.0;
      }
    });

    let colors;

    if (e instanceof CustomEvent) {
      colors = e?.detail?.colors ?? {};
    }

    // Build color map for blocks
    let colorMap;
    if (Object.keys(colors).length && colors.constructor === Object) {
      colorMap = transformStyleMap(colors, "--bg-block-", "-color");
    } else {
      colorMap = transformStyleMap(initialColors, "--bg-block-", "-color");
    }

    // Build color maps
    const bm = Object.fromEntries(
      Object.entries(colorMap).map(([k, v]) => [
        k
          .replaceAll("-", " ")
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        normalizeRGBToRGBA(cssColorToRGB(gThis.document, v)),
      ]),
    );

    gameLoop(
      shadow,
      cnvs,
      bm,
      gameState,
      gameConfig,
      ui,
      gl,
      cbuf,
      cube,
      uL,
      uM,
      uMVP,
    );

    gameState.shouldReset.set(true);
  });

  // Check for shared save first (takes priority)
  let sharedSaveLoaded = await checkSharedSave(gThis, shadow);

  // If no shared save, check for auto-save
  let autoSaveLoaded = false;
  if (!sharedSaveLoaded) {
    autoSaveLoaded = await checkAutoSave(gThis, shadow);
  }

  if (!sharedSaveLoaded && !autoSaveLoaded) {
    initNewWorld(gameState.seed);
  }

  // Set up auto-save interval
  setInterval(async () => {
    const saveMode = await getSaveMode();

    if (saveMode === "auto") {
      await autoSaveGame(gThis);
    }
  }, AUTO_SAVE_INTERVAL);

  const ver = await localForage.setItem(`block-garden-version`, version);

  console.log(`Block Garden version: ${ver}`);

  gameLoop(
    shadow,
    cnvs,
    blockColorMap,
    gameState,
    gameConfig,
    ui,
    gl,
    cbuf,
    cube,
    uL,
    uM,
    uMVP,
  );

  shadow.dispatchEvent(
    new CustomEvent("block-garden-load", {
      detail: { isLoading: false, pkg, error: null },
      bubbles: true,
      composed: true,
    }),
  );
}
