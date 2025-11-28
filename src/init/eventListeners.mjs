import extrasHandler from "konami-code-js";

import { copyToClipboard } from "../util/copyToClipboard.mjs";
import { createSaveState } from "../state/createSave.mjs";
import { debounce } from "../util/debounce.mjs";
import { gameConfig, gameState } from "../state/state.mjs";
import { getCustomProperties } from "../util/colors/getCustomProperties.mjs";
import { getRandomSeed } from "../misc/getRandomSeed.mjs";
import { handleBreakBlockWithWaterPhysics } from "../misc/handleBreakBlock.mjs";
import { handleFarmAction } from "../misc/handleFarmAction.mjs";
import { handlePlaceBlock } from "../misc/handlePlaceBlock.mjs";
import { loadSaveState } from "../state/loadSave.mjs";
import { resizeCanvas } from "../util/resizeCanvas.mjs";
import { runCompress } from "../util/compression.mjs";
import { selectMaterial } from "../misc/selectMaterial.mjs";
import { selectSeed } from "../misc/selectSeed.mjs";
import { showColorCustomizationDialog } from "../misc/customColors.mjs";
import { toggleBreakMode } from "../misc/toggleBreakMode.mjs";

import {
  updateMovementScaleUI,
  updateMovementScaleValue,
} from "../update/ui/movementScale.mjs";

import { updateRangeUI } from "../update/ui/range.mjs";
import { showAboutDialog } from "../dialog/about.mjs";
import { showExamplesDialog } from "../dialog/examples.mjs";
import { showPrivacyDialog } from "../dialog/privacy.mjs";

import {
  autoSaveGame,
  getSaveMode,
  setSaveMode,
  showStorageDialog,
} from "../dialog/storage.mjs";

import { initFog } from "./fog.mjs";
import { initNewWorld } from "./newWorld.mjs";

/** @typedef {import('./game.mjs').CustomShadowHost} CustomShadowHost */

/**
 * @param {typeof globalThis} gThis - The global `this` context (global object), typically `window` in browsers.
 * @param {ShadowRoot} shadow - The shadow DOM root element where the game components are rendered.
 *
 * @returns {void}
 */
export function initGlobalEventListeners(gThis, shadow) {
  const debouncedResize = debounce(() => {
    resizeCanvas(shadow, gameConfig);
  }, 200);

  const resizeObserver = new ResizeObserver((entries) => {
    debouncedResize();
  });

  resizeObserver.observe(shadow.host);

  setupDialogButtons(gThis, shadow);
  setupMovementScaleUI(shadow);

  updateRangeUI(shadow);
  updateMovementScaleUI(shadow);

  const customizeColors = shadow.getElementById("customizeColorsBtn");
  if (customizeColors) {
    const config = gThis.spriteGarden.config;
    customizeColors.addEventListener("click", async () => {
      const initialResolution = config.currentResolution.get();

      if (initialResolution === "400") {
        config.currentResolution.set("800");
        resizeCanvas(shadow, config);

        const colorDialog = await showColorCustomizationDialog(gThis);
        colorDialog.dialog.addEventListener("close", () => {
          config.currentResolution.set(initialResolution);

          resizeCanvas(shadow, config);
        });

        return;
      }

      await showColorCustomizationDialog(gThis);
    });
  }
}

/**
 * @param {ShadowRoot} shadow
 *
 * @returns {void}
 */
function setupMovementScaleUI(shadow) {
  const scaleKey = shadow.querySelector('[data-key="x"].middle');

  if (scaleKey) {
    scaleKey.addEventListener(
      "click",
      async () => await updateMovementScaleValue(shadow),
    );

    scaleKey.addEventListener(
      "touchstart",
      async () => await updateMovementScaleValue(shadow),
    );
  }
}

/**
 * @param {typeof globalThis} gThis
 * @param {ShadowRoot} shadow
 *
 * @returns {void}
 */
function setupDialogButtons(gThis, shadow) {
  const aboutBtn = shadow.getElementById("aboutBtn");

  if (aboutBtn) {
    aboutBtn.addEventListener("click", async function () {
      try {
        await showAboutDialog(gThis.document, shadow);
      } catch (error) {
        console.error("Failed to open about dialog:", error);

        alert("Failed to open about dialog. Check console for details.");
      }
    });
  }

  // Examples button
  const examplesBtn = shadow.getElementById("examplesBtn");
  if (examplesBtn) {
    examplesBtn.addEventListener("click", async function () {
      try {
        await showExamplesDialog(gThis.document, shadow);
      } catch (error) {
        console.error("Failed to open examples dialog:", error);

        alert("Failed to open examples dialog. Check console for details.");
      }
    });
  }

  // Privacy button
  const privacyBtn = shadow.getElementById("privacyBtn");
  if (privacyBtn) {
    privacyBtn.addEventListener("click", async function () {
      try {
        await showPrivacyDialog(gThis.document, shadow);
      } catch (error) {
        console.error("Failed to open privacy dialog:", error);

        alert("Failed to open privacy dialog. Check console for details.");
      }
    });
  }
}

/**
 * @param {MouseEvent} e
 *
 * @returns {void}
 */
function handleCornerClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const heading = e.currentTarget;
  if (heading instanceof HTMLDivElement) {
    const cornerContainer = heading.nextElementSibling;

    if (cornerContainer.getAttribute("hidden") !== null) {
      cornerContainer.removeAttribute("hidden");

      return;
    }

    cornerContainer.setAttribute("hidden", "hidden");
  }
}

/**
 * @param {typeof globalThis} gThis
 * @param {ShadowRoot} shadow
 *
 * @returns {void}
 */
export function initDocumentEventListeners(gThis, shadow) {
  // Extras
  new extrasHandler((handler) => {
    shadow.getElementById("mapEditor").removeAttribute("hidden");
    shadow
      .getElementById("customizeColorsBtnContainer")
      .removeAttribute("hidden");
    shadow.getElementById("examplesBtnContainer").removeAttribute("hidden");
    shadow
      .querySelector('option[value="fullscreen"]')
      .removeAttribute("hidden");

    const customizeColorsDialog = shadow.getElementById(
      "customizeColorsDialog",
    );
    if (customizeColorsDialog) {
      customizeColorsDialog
        .querySelectorAll("[hidden]")
        .forEach((node) => node.removeAttribute("hidden"));
    }

    const settingsContainer = shadow.querySelector(
      '#settings > [class="ui-grid__corner--container"]',
    );

    settingsContainer.removeAttribute("hidden");

    handler.disable();
  });

  // Keyboard events
  shadow.addEventListener(
    "keydown",
    /** @param {KeyboardEvent} e */
    async (e) => {
      const lowercaseKey = e.key.toLowerCase();

      const host =
        /** @type {CustomShadowHost} */
        (shadow.host);
      host.keys[lowercaseKey] = true;

      // Allow digits 0-9, enter, and delete
      if (lowercaseKey === "enter") {
        if (
          e.target instanceof HTMLInputElement &&
          e.target.getAttribute("id") === "worldSeedInput"
        ) {
          handleGenerateButton();
        }
      }

      // Always hide the world generation panel with escape
      if (lowercaseKey === "escape") {
        shadow
          .querySelector('[class="seed-controls"]')
          .setAttribute("hidden", "hidden");
      }

      // Add 'S' key to show / hide the world generation panel
      if (lowercaseKey === "s" && e.ctrlKey) {
        e.preventDefault();

        shadow
          .querySelector('[class="seed-controls"]')
          .toggleAttribute("hidden");
      }

      if (
        (lowercaseKey >= "0" && lowercaseKey <= "9") ||
        lowercaseKey === "backspace" ||
        lowercaseKey === "delete" ||
        lowercaseKey === "escape"
      ) {
        return;
      }

      // Add 'R' key to regenerate world with random seed
      if (lowercaseKey === "r" && e.ctrlKey) {
        e.preventDefault();

        handleRandomSeedButton();
      }

      // Add 'G' key to regenerate world with current seed (to see changes)
      if (lowercaseKey === "g" && e.ctrlKey) {
        e.preventDefault();

        handleGenerateButton();
      }

      // Add 'E' key to handle toggling the break mode
      if (lowercaseKey === "e") {
        e.preventDefault();

        toggleBreakMode();
      }

      // Add 'X' key to handle movement scale actions
      if (lowercaseKey === "x") {
        e.preventDefault();

        await updateMovementScaleValue(shadow);
      }

      // Handle farming actions
      if (lowercaseKey === "f") {
        handleFarmAction(
          gameState.growthTimers,
          gameState.plantStructures,
          gameState.player.get(),
          gameState.seedInventory.get(),
          gameState.selectedSeedType.get(),
          gameConfig.TILES,
          gameConfig.TILE_SIZE.get(),
          gameState.world.get(),
          gameConfig.WORLD_HEIGHT.get(),
          gameConfig.WORLD_WIDTH.get(),
        );
      }

      if (lowercaseKey === "r") {
        handleBreakBlockWithWaterPhysics(
          gameState.growthTimers,
          gameState.plantStructures,
          gameState.player,
          gameConfig.TILES,
          gameConfig.TILE_SIZE.get(),
          gameState.world,
          gameConfig.WORLD_HEIGHT.get(),
          gameConfig.WORLD_WIDTH.get(),
          gameState.waterPhysicsQueue,
          gameConfig.breakMode.get(),
        );
      }

      // Handle block placement keys
      const blockKeys = ["u", "i", "o", "j", "k", "l", "m", ",", "."];

      if (blockKeys.includes(lowercaseKey)) {
        await handlePlaceBlock(
          lowercaseKey,
          gameState.materialsInventory.get(),
          gameState.player.get(),
          gameState.selectedMaterialType.get(),
          gameConfig.TILES,
          gameConfig.TILE_SIZE.get(),
          gameState.world.get(),
          gameConfig.WORLD_HEIGHT.get(),
          gameConfig.WORLD_WIDTH.get(),
        );
      }

      e.preventDefault();
    },
  );

  const fogButton = shadow.getElementById("toggleFog");

  fogButton.addEventListener("click", function toggleFog() {
    const fogModeText = shadow.getElementById("fogModeText");

    if (fogModeText.textContent === "Clear") {
      gameConfig.fogMode.set("fog");

      return;
    }

    gameConfig.fogMode.set("clear");
  });

  function handleWorldStateButton() {
    shadow.querySelector('[class="seed-controls"]').toggleAttribute("hidden");
  }

  const worldStateBtn = shadow.getElementById("worldState");
  worldStateBtn.addEventListener("click", handleWorldStateButton);

  function handleGenerateButton() {
    /** @type string | null */
    let seedInputValue = null;
    const seedInput = shadow.getElementById("worldSeedInput");
    if (seedInput instanceof HTMLInputElement) {
      seedInputValue = seedInput.value;
    }

    const currentSeedDisplay = shadow.getElementById("currentSeed");

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
      Number(seedInputValue),
    );

    gameState.world.set(currentWorld);

    const colors = getCustomProperties(gThis, shadow);
    const currentFog = initFog(
      gameConfig.isFogScaled,
      worldHeight,
      worldWidth,
      colors,
    );

    // Set the fog in state
    gameState.exploredMap.set(currentFog);

    console.log(`Generated new world with seed: ${seedInputValue}`);

    currentSeedDisplay.textContent = seedInputValue;
  }

  function handleRandomSeedButton() {
    const currentSeedDisplay = shadow.getElementById("currentSeed");
    const seedInput = shadow.getElementById("worldSeedInput");

    const randomSeed = getRandomSeed();

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
      randomSeed,
    );

    gameState.world.set(currentWorld);

    const colors = getCustomProperties(gThis, shadow);
    const currentFog = initFog(
      gameConfig.isFogScaled,
      worldHeight,
      worldWidth,
      colors,
    );

    // Set the fog in state
    gameState.exploredMap.set(currentFog);

    console.log(`Generated new world with random seed: ${randomSeed}`);

    if (seedInput instanceof HTMLInputElement) {
      seedInput.value = String(randomSeed);
    }

    currentSeedDisplay.textContent = String(randomSeed);
  }

  const generateBtn = shadow.getElementById("generateWithSeed");
  generateBtn.addEventListener("click", handleGenerateButton);

  const randomBtn = shadow.getElementById("randomSeed");
  randomBtn.addEventListener("click", handleRandomSeedButton);

  const copySeedBtn = shadow.getElementById("copySeed");
  copySeedBtn.addEventListener("click", async function () {
    const seedInput = shadow.getElementById("worldSeedInput");

    if (seedInput instanceof HTMLInputElement) {
      await copyToClipboard(gThis, seedInput.value);
    }
  });

  const saveMode = shadow.getElementById("saveModeToggle");
  getSaveMode().then(async (mode) => {
    const resolvedMode = mode === "auto" ? "auto" : "manual";

    console.log("Save Mode:", resolvedMode);

    if (resolvedMode === "auto") {
      saveMode.innerText = "Save Mode Auto";
      saveMode.style.backgroundColor = "var(--sg-color-green-500)";

      return;
    }

    saveMode.innerText = "Save Mode Manual";
    saveMode.style.backgroundColor = "var(--sg-color-red-500)";
  });

  saveMode.addEventListener("click", async function () {
    const mode = await getSaveMode();
    const resolvedMode = mode === "auto" ? "auto" : "manual";

    if (resolvedMode === "manual") {
      saveMode.innerText = "Save Mode Auto";
      saveMode.style.backgroundColor = "var(--sg-color-green-500)";

      await setSaveMode("auto");
      await autoSaveGame(gThis);

      return;
    }

    if (resolvedMode === "auto") {
      saveMode.innerText = "Save Mode Manual";
      saveMode.style.backgroundColor = "var(--sg-color-red-500)";

      await setSaveMode("manual");
    }
  });

  const saveCompressedBtn = shadow.getElementById("saveCompressedState");
  saveCompressedBtn.addEventListener("click", async function () {
    try {
      const saveState = createSaveState(gThis);
      const stateJSON = JSON.stringify(saveState);

      await runCompress(gThis, stateJSON);

      console.log("Game state saved successfully");
    } catch (error) {
      console.error("Failed to save game state:", error);

      alert("Failed to save game state. Check console for details.");
    }
  });

  const loadCompressedBtn = shadow.getElementById("loadCompressedState");
  loadCompressedBtn.addEventListener("click", async function () {
    try {
      const currentSeedDisplay = shadow.getElementById("currentSeed");
      const seedInput = shadow.getElementById("worldSeedInput");

      let file;

      // Feature detection for showOpenFilePicker
      if (gThis.showOpenFilePicker) {
        const [fileHandle] = await gThis.showOpenFilePicker({
          types: [
            {
              description: "Sprite Garden Save Game Files",
              accept: { "application/gzip": [".sgs"] },
            },
          ],
        });

        file = await fileHandle.getFile();
      } else {
        // Fallback for browsers without showOpenFilePicker
        const input = gThis.document.createElement("input");
        input.type = "file";
        input.accept = ".sgs";
        input.style.display = "none";

        shadow.append(input);

        const filePromise = new Promise((resolve) => {
          input.onchange = () => resolve(input.files[0]);
        });

        input.click();

        file = await filePromise;
        shadow.removeChild(input);
      }

      let stateJSON;

      // Feature detection for DecompressionStream
      if ("DecompressionStream" in gThis) {
        const decompressedStream = file
          .stream()
          .pipeThrough(new DecompressionStream("gzip"));

        const decompressedBlob = await new Response(decompressedStream).blob();

        stateJSON = await decompressedBlob.text();
      }

      const saveState = JSON.parse(stateJSON);

      loadSaveState(gThis, shadow, saveState);

      const { worldSeed } = saveState.config;

      if (seedInput instanceof HTMLInputElement) {
        seedInput.value = worldSeed;
      }

      currentSeedDisplay.textContent = worldSeed;

      console.log("Game state loaded successfully");
    } catch (error) {
      console.error("Failed to load game state:", error);
      alert("Failed to load game state. Check console for details.");
    }
  });

  // Add event listener for storage dialog button
  const useStorageBtn = shadow.getElementById("useStorageBtn");
  if (useStorageBtn) {
    useStorageBtn.addEventListener("click", async function () {
      try {
        await showStorageDialog(gThis, gThis.document, shadow);
      } catch (error) {
        console.error("Failed to open storage dialog:", error);

        alert("Failed to open storage dialog. Check console for details.");
      }
    });
  }

  const corners = shadow.querySelectorAll(".ui-grid__corner");
  corners.forEach((corner) => {
    const heading = corner.querySelector(".ui-grid__corner--heading");

    heading.addEventListener(
      "click",
      (
        /** @type MouseEvent */
        e,
      ) => handleCornerClick(e),
    );
  });
}

/**
 * @param {typeof globalThis} gThis
 * @param {ShadowRoot} shadow
 *
 * @returns {void}
 */
export function initElementEventListeners(gThis, shadow) {
  shadow.getElementById("controls").addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

    shadow.querySelector(".touch-controls").toggleAttribute("hidden");
  });

  const resolutionSelectEl = shadow.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener("change", (e) => {
      if (e.currentTarget instanceof HTMLSelectElement) {
        gameConfig.currentResolution.set(e.currentTarget.value);

        resizeCanvas(shadow, gameConfig);
      }
    });
  }

  const genBtn = shadow.getElementById("initNewWorld");
  if (genBtn) {
    genBtn.addEventListener("click", () => {
      /** @type string | null */
      let seedInputValue = null;
      const seedInput = shadow.getElementById("worldSeedInput");
      if (seedInput instanceof HTMLInputElement) {
        seedInputValue = seedInput.value;
      }

      const currentSeedDisplay = shadow.getElementById("currentSeed");
      currentSeedDisplay.textContent = seedInputValue;

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
        Number(seedInputValue),
      );

      gameState.world.set(currentWorld);

      const colors = getCustomProperties(gThis, shadow);
      const currentFog = initFog(
        gameConfig.isFogScaled,
        worldHeight,
        worldWidth,
        colors,
      );

      // Set the fog in state
      gameState.exploredMap.set(currentFog);
    });

    // Seed button event listeners
    shadow.querySelectorAll(".seed-btn").forEach((seedBtn) => {
      seedBtn.addEventListener("click", (e) => {
        selectSeed(gameState, e);
      });
    });

    // Material button event listeners
    shadow.querySelectorAll(".material-btn").forEach((materialBtn) => {
      materialBtn.addEventListener("click", (e) => {
        selectMaterial(gameState, e);
      });
    });
  }

  const toggleBtn = shadow.getElementById("toggleView");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () =>
      gameState.viewMode.set(
        gameState.viewMode.get() === "normal" ? "xray" : "normal",
      ),
    );
  }

  const toggleBreakBtn = shadow.getElementById("toggleBreakMode");
  if (toggleBreakBtn) {
    toggleBreakBtn.addEventListener("click", () => toggleBreakMode());
  }

  // Set default to 400x400 and update the select element
  const sel = shadow.getElementById("resolutionSelect");
  if (sel instanceof HTMLSelectElement) {
    sel.value = "400";
  }
}
