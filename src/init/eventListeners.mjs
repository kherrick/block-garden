import extrasHandler from "../../deps/konami-code-js.mjs";

import { copyToClipboard } from "../util/copyToClipboard.mjs";
import { createSaveState } from "../state/createSave.mjs";
import { gameConfig, gameState } from "../state/state.mjs";
import { getCustomProperties } from "../dialog/colors/getCustomProperties.mjs";
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
import { showStorageDialog } from "../dialog/storage.mjs";

import { initFog } from "./fog.mjs";
import { initNewWorld } from "./newWorld.mjs";

export function initGlobalEventListeners(gThis, doc, shadow) {
  function debounce(func, delay) {
    let timeout;

    return function (...args) {
      clearTimeout(timeout);

      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const debouncedResize = debounce(() => {
    resizeCanvas(doc, gameConfig);
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
    customizeColors.addEventListener("click", () => {
      showColorCustomizationDialog(gThis, doc, shadow);
    });
  }
}

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

function handleCornerClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const heading = e.currentTarget;

  const cornerContainer = heading.nextElementSibling;
  if (cornerContainer.getAttribute("hidden") !== null) {
    cornerContainer.removeAttribute("hidden");

    return;
  }

  cornerContainer.setAttribute("hidden", "hidden");
}

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

    const settingsContainer = shadow.querySelector(
      '#settings > [class="ui-grid__corner--container"]',
    );
    settingsContainer.removeAttribute("hidden");

    handler.disable();
  });

  // Keyboard events
  shadow.addEventListener("keydown", async (e) => {
    const lowercaseKey = e.key.toLowerCase();
    shadow.host.keys[lowercaseKey] = true;

    // Allow digits 0-9, enter, and delete
    if (lowercaseKey === "enter") {
      if (e.target.getAttribute("id") === "worldSeedInput") {
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

      shadow.querySelector('[class="seed-controls"]').toggleAttribute("hidden");
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
      handleFarmAction({
        growthTimers: gameState.growthTimers,
        plantStructures: gameState.plantStructures,
        player: gameState.player.get(),
        seedInventory: gameState.seedInventory.get(),
        selectedSeedType: gameState.selectedSeedType.get(),
        tileName: gameConfig.TileName,
        tiles: gameConfig.TILES,
        tileSize: gameConfig.TILE_SIZE.get(),
        world: gameState.world.get(),
        worldHeight: gameConfig.WORLD_HEIGHT.get(),
        worldWidth: gameConfig.WORLD_WIDTH.get(),
      });
    }

    if (lowercaseKey === "r") {
      handleBreakBlockWithWaterPhysics({
        growthTimers: gameState.growthTimers,
        plantStructures: gameState.plantStructures,
        player: gameState.player,
        tiles: gameConfig.TILES,
        tileSize: gameConfig.TILE_SIZE.get(),
        world: gameState.world,
        worldHeight: gameConfig.WORLD_HEIGHT.get(),
        worldWidth: gameConfig.WORLD_WIDTH.get(),
        mode: gameConfig.breakMode.get(),
        queue: gameState.waterPhysicsQueue,
      });
    }

    // Handle block placement keys
    const blockKeys = ["u", "i", "o", "j", "k", "l", "m", ",", "."];
    if (blockKeys.includes(lowercaseKey)) {
      await handlePlaceBlock({
        key: lowercaseKey,
        materialsInventory: gameState.materialsInventory.get(),
        player: gameState.player.get(),
        selectedMaterialType: gameState.selectedMaterialType.get(),
        tiles: gameConfig.TILES,
        tileSize: gameConfig.TILE_SIZE.get(),
        world: gameState.world.get(),
        worldHeight: gameConfig.WORLD_HEIGHT.get(),
        worldWidth: gameConfig.WORLD_WIDTH.get(),
      });
    }

    e.preventDefault();
  });

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
    const seedInput = shadow.getElementById("worldSeedInput");
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
      seedInput.value,
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
    console.log(`Generated new world with seed: ${seedInput.value}`);

    currentSeedDisplay.textContent = seedInput.value;
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

    seedInput.value = randomSeed;
    currentSeedDisplay.textContent = randomSeed;
  }

  const generateBtn = shadow.getElementById("generateWithSeed");
  generateBtn.addEventListener("click", handleGenerateButton);

  const randomBtn = shadow.getElementById("randomSeed");
  randomBtn.addEventListener("click", handleRandomSeedButton);

  const copySeedBtn = shadow.getElementById("copySeed");
  copySeedBtn.addEventListener("click", async function () {
    const seedInput = shadow.getElementById("worldSeedInput");

    await copyToClipboard(gThis, seedInput.value);
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
        const input = shadow.createElement("input");
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
      seedInput.value = worldSeed;
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

    heading.addEventListener("click", (e) => handleCornerClick(e));
  });
}

export function initElementEventListeners(gThis, shadow) {
  shadow.getElementById("controls").addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

    shadow.querySelector(".touch-controls").toggleAttribute("hidden");
  });

  const resolutionSelectEl = shadow.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener("change", (e) => {
      gameConfig.currentResolution.set(e.currentTarget.value);

      resizeCanvas(shadow, gameConfig);
    });
  }

  const genBtn = shadow.getElementById("initNewWorld");
  if (genBtn) {
    genBtn.addEventListener("click", () => {
      const seedInput = shadow.getElementById("worldSeedInput");
      const currentSeedDisplay = shadow.getElementById("currentSeed");
      currentSeedDisplay.textContent = seedInput.value;

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
        seedInput.value,
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
        selectMaterial(shadow, gameState, e);
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
  if (sel) {
    sel.value = "400";
  }
}
