import extrasHandler from "../../deps/konami-code-js.mjs";

import { copyToClipboard } from "../util/copyToClipboard.mjs";
import { createSaveState } from "../state/createSave.mjs";
import { gameConfig, gameState } from "../state/state.mjs";
import { getRandomSeed } from "../misc/getRandomSeed.mjs";
import { handleBreakBlockWithWaterPhysics } from "../misc/handleBreakBlock.mjs";
import { handleFarmAction } from "../misc/handleFarmAction.mjs";
import { handlePlaceBlock } from "../misc/handlePlaceBlock.mjs";
import { loadSaveState } from "../state/loadSave.mjs";
import { resizeCanvas } from "../util/resizeCanvas.mjs";
import { runCompress } from "../util/compression.mjs";
import { selectMaterial } from "../misc/selectMaterial.mjs";
import { selectSeed } from "../misc/selectSeed.mjs";
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

export function initGlobalEventListeners(gThis) {
  // Setup event listeners
  gThis.addEventListener("resize", () => {
    resizeCanvas(gThis.document, gameConfig);
  });

  // Input handling
  gThis.spriteGarden.keys = {};
  gThis.spriteGarden.touchKeys = {};

  setupDialogButtons(gThis);
  setupMovementScaleUI(gThis.document);

  updateRangeUI(gThis.document);
  updateMovementScaleUI(gThis.document);
}

function setupMovementScaleUI(doc) {
  const scaleKey = doc.querySelector('[data-key="x"].middle');

  if (scaleKey) {
    scaleKey.addEventListener(
      "click",
      async () => await updateMovementScaleValue(doc),
    );

    scaleKey.addEventListener(
      "touchstart",
      async () => await updateMovementScaleValue(doc),
    );
  }
}

function setupDialogButtons(gThis) {
  const doc = gThis.document;

  // About button
  const aboutBtn = doc.getElementById("aboutBtn");
  if (aboutBtn) {
    aboutBtn.addEventListener("click", async function () {
      try {
        await showAboutDialog(gThis);
      } catch (error) {
        console.error("Failed to open about dialog:", error);
        alert("Failed to open about dialog. Check console for details.");
      }
    });
  }

  // Examples button
  const examplesBtn = doc.getElementById("examplesBtn");
  if (examplesBtn) {
    examplesBtn.addEventListener("click", async function () {
      try {
        await showExamplesDialog(gThis);
      } catch (error) {
        console.error("Failed to open examples dialog:", error);
        alert("Failed to open examples dialog. Check console for details.");
      }
    });
  }

  // Privacy button
  const privacyBtn = doc.getElementById("privacyBtn");
  if (privacyBtn) {
    privacyBtn.addEventListener("click", async function () {
      try {
        await showPrivacyDialog(gThis);
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

export function initDocumentEventListeners(gThis) {
  const doc = gThis.document;

  // Extras
  new extrasHandler((handler) => {
    doc.getElementById("mapEditor").removeAttribute("hidden");
    doc.getElementById("examplesBtnContainer").removeAttribute("hidden");
    doc.querySelector('option[value="fullscreen"]').removeAttribute("hidden");

    const settingsContainer = doc.querySelector(
      '#settings > [class="ui-grid__corner--container"]',
    );
    settingsContainer.removeAttribute("hidden");

    handler.disable();
  });

  // Keyboard events
  doc.addEventListener("keydown", async (e) => {
    const lowercaseKey = e.key.toLowerCase();
    gThis.spriteGarden.keys[lowercaseKey] = true;

    // Allow digits 0-9, enter, and delete
    if (lowercaseKey === "enter") {
      if (e.target.getAttribute("id") === "worldSeedInput") {
        handleGenerateButton();
      }
    }
    if (
      (lowercaseKey >= "0" && lowercaseKey <= "9") ||
      lowercaseKey === "backspace" ||
      lowercaseKey === "delete"
    ) {
      return;
    }

    // Add 'R' key to regenerate world with random seed
    if (lowercaseKey === "r" && e.ctrlKey) {
      e.preventDefault();

      handleRandomSeedButton();
    }

    // Add 'S' key to show / hide the world generation panel
    if (lowercaseKey === "s" && e.ctrlKey) {
      e.preventDefault();

      document
        .querySelector('[class="seed-controls"]')
        .toggleAttribute("hidden");
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

      await updateMovementScaleValue(doc);
    }

    // Handle farming actions
    if (lowercaseKey === "f") {
      handleFarmAction({
        growthTimers: gameState.growthTimers,
        plantStructures: gameState.plantStructures,
        player: gameState.player.get(),
        seedInventory: gameState.seedInventory.get(),
        selectedSeedType: gameState.selectedSeedType.get(),
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

  const fogButton = doc.getElementById("toggleFog");
  fogButton.addEventListener("click", function toggleFog() {
    const fogModeText = doc.getElementById("fogModeText");

    if (fogModeText.textContent === "Clear") {
      gameConfig.fogMode.set("fog");

      return;
    }

    gameConfig.fogMode.set("clear");
  });

  function handleWorldStateButton() {
    doc.querySelector('[class="seed-controls"]').toggleAttribute("hidden");
  }

  const worldStateBtn = doc.getElementById("worldState");
  worldStateBtn.addEventListener("click", handleWorldStateButton);

  function handleGenerateButton() {
    const seedInput = doc.getElementById("worldSeedInput");
    const currentSeedDisplay = doc.getElementById("currentSeed");

    const worldHeight = gameConfig.WORLD_HEIGHT.get();
    const worldWidth = gameConfig.WORLD_WIDTH.get();

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
      worldHeight,
      worldWidth,
      worldSeed: gameConfig.worldSeed,
      newSeed: seedInput.value,
    });

    gameState.world.set(currentWorld);

    const currentFog = initFog(gameConfig.isFogScaled, worldHeight, worldWidth);

    // Set the fog in state
    gameState.exploredMap.set(currentFog);
    console.log(`Generated new world with seed: ${seedInput.value}`);

    currentSeedDisplay.textContent = seedInput.value;
  }

  function handleRandomSeedButton() {
    const currentSeedDisplay = doc.getElementById("currentSeed");
    const seedInput = doc.getElementById("worldSeedInput");
    const randomSeed = getRandomSeed();

    const worldHeight = gameConfig.WORLD_HEIGHT.get();
    const worldWidth = gameConfig.WORLD_WIDTH.get();

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
      worldHeight,
      worldWidth,
      worldSeed: gameConfig.worldSeed,
      newSeed: randomSeed,
    });

    gameState.world.set(currentWorld);

    const currentFog = initFog(gameConfig.isFogScaled, worldHeight, worldWidth);

    // Set the fog in state
    gameState.exploredMap.set(currentFog);
    console.log(`Generated new world with random seed: ${randomSeed}`);

    seedInput.value = randomSeed;
    currentSeedDisplay.textContent = randomSeed;
  }

  const generateBtn = doc.getElementById("generateWithSeed");
  generateBtn.addEventListener("click", handleGenerateButton);

  const randomBtn = doc.getElementById("randomSeed");
  randomBtn.addEventListener("click", handleRandomSeedButton);

  const copySeedBtn = doc.getElementById("copySeed");
  copySeedBtn.addEventListener("click", async function () {
    const seedInput = doc.getElementById("worldSeedInput");

    await copyToClipboard(gThis, seedInput.value);
  });

  const saveCompressedBtn = doc.getElementById("saveCompressedState");
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

  const loadCompressedBtn = doc.getElementById("loadCompressedState");
  loadCompressedBtn.addEventListener("click", async function () {
    try {
      const currentSeedDisplay = doc.getElementById("currentSeed");
      const seedInput = doc.getElementById("worldSeedInput");

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
        const input = doc.createElement("input");
        input.type = "file";
        input.accept = ".sgs";
        input.style.display = "none";

        doc.body.appendChild(input);

        const filePromise = new Promise((resolve) => {
          input.onchange = () => resolve(input.files[0]);
        });

        input.click();

        file = await filePromise;

        doc.body.removeChild(input);
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

      loadSaveState(gThis, saveState);

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
  const useStorageBtn = doc.getElementById("useStorageBtn");
  if (useStorageBtn) {
    useStorageBtn.addEventListener("click", async function () {
      try {
        await showStorageDialog(gThis);
      } catch (error) {
        console.error("Failed to open storage dialog:", error);
        alert("Failed to open storage dialog. Check console for details.");
      }
    });
  }

  const corners = doc.querySelectorAll(".ui-grid__corner");

  corners.forEach((corner) => {
    const heading = corner.querySelector(".ui-grid__corner--heading");

    heading.addEventListener("click", (e) => handleCornerClick(e));
  });
}

export function initElementEventListeners(doc) {
  doc.getElementById("controls").addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    doc.getElementById("touchControls").toggleAttribute("hidden");
  });

  const resolutionSelectEl = doc.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener("change", (e) => {
      gameConfig.currentResolution.set(e.currentTarget.value);

      resizeCanvas(doc, gameConfig);
    });
  }

  const genBtn = doc.getElementById("initNewWorld");
  if (genBtn)
    genBtn.addEventListener("click", () => {
      const seedInput = doc.getElementById("worldSeedInput");
      const currentSeedDisplay = doc.getElementById("currentSeed");
      currentSeedDisplay.textContent = seedInput.value;

      const worldHeight = gameConfig.WORLD_HEIGHT.get();
      const worldWidth = gameConfig.WORLD_WIDTH.get();

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
        worldHeight,
        worldWidth,
        worldSeed: gameConfig.worldSeed,
        newSeed: seedInput.value,
      });

      gameState.world.set(currentWorld);

      const currentFog = initFog(
        gameConfig.isFogScaled,
        worldHeight,
        worldWidth,
      );

      // Set the fog in state
      gameState.exploredMap.set(currentFog);
    });

  // Seed button event listeners
  doc.querySelectorAll(".seed-btn").forEach((seedBtn) => {
    seedBtn.addEventListener("click", (e) => {
      selectSeed(doc, gameState, e);

      const subSection = seedBtn?.parentElement?.parentElement;

      if (subSection) {
        subSection.scrollTo(0, 0);
      }
    });
  });

  // Material button event listeners
  doc.querySelectorAll(".material-btn").forEach((materialBtn) => {
    materialBtn.addEventListener("click", (e) => {
      selectMaterial(doc, gameState, e);

      const subSection = materialBtn?.parentElement?.parentElement;

      if (subSection) {
        subSection.scrollTo(0, 0);
      }
    });
  });

  const toggleBtn = doc.getElementById("toggleView");
  if (toggleBtn)
    toggleBtn.addEventListener("click", () =>
      gameState.viewMode.set(
        gameState.viewMode.get() === "normal" ? "xray" : "normal",
      ),
    );

  const toggleBreakBtn = doc.getElementById("toggleBreakMode");
  if (toggleBreakBtn)
    toggleBreakBtn.addEventListener("click", () => toggleBreakMode());

  // Set default to 400x400 and update the select element
  const sel = doc.getElementById("resolutionSelect");
  if (sel) sel.value = "400";
}
