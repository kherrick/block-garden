import Hammer from "hammerjs";
import localForage from "localforage";

import { initTouchControls } from "./touchControls.mjs";
import { initHammerControls } from "./hammerControls.mjs";
import { initNewWorld } from "./newWorld.mjs";
import {
  initCanvasEventListeners,
  initElementEventListeners,
} from "./eventListeners.mjs";
import { initEffects } from "./effects.mjs";
import { initGameDependencies } from "./gameDependencies.mjs";

import {
  AUTO_SAVE_INTERVAL,
  autoSaveGame,
  checkAutoSave,
  checkSharedSave,
  getSaveMode,
} from "../dialog/storage.mjs";

import { initState } from "../state/state.mjs";
import { cancelGameLoop, gameLoop } from "../state/gameLoop.mjs";
import { getBlockIdByName } from "../state/config/getBlockIdByName.mjs";

import { generateFlatWorld } from "../generate/world.mjs";

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

  initTouchControls(shadow);
  initHammerControls(Hammer(shadow.host), shadow, gameState);

  initEffects(shadow, computedSignals.currentBlock);
  initElementEventListeners(shadow, cnvs, gameConfig.currentResolution);
  initCanvasEventListeners(shadow, cnvs, gameConfig.blocks, gameState.curBlock);

  // Only pass cnvs to initGameDependencies, and call it once
  const { gl, cbuf, cube, uL, uM, uMVP } = initGameDependencies(cnvs);

  // Check for shared save first (takes priority)
  let sharedSaveLoaded = await checkSharedSave(gThis, shadow);

  // If no shared save, check for auto-save
  let autoSaveLoaded = false;
  if (!sharedSaveLoaded) {
    autoSaveLoaded = await checkAutoSave(gThis, shadow);
  }

  if (!autoSaveLoaded) {
    initNewWorld(gameState.seed);
  }

  // Get required UI buttons for flight controls
  const ui = {
    descendButton: shadow.getElementById("descend"),
    flyButton: shadow.getElementById("fly"),
  };

  // Set current block to id of dirt
  gameState.curBlock.set(getBlockIdByName("Dirt"));

  // Set up auto-save interval
  setInterval(async () => {
    const saveMode = await getSaveMode();

    if (saveMode === "auto") {
      await autoSaveGame(gThis);
    }
  }, AUTO_SAVE_INTERVAL);

  const ver = await localForage.setItem(`block-garden-version`, version);

  console.log(`Block Garden version: ${ver}`);

  shadow.addEventListener("block-garden-reset", () => {
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

    // Only call gameLoop, do not re-init dependencies
    gameLoop(
      shadow,
      cnvs,
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

  gameLoop(
    shadow,
    cnvs,
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
