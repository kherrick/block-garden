import extrasHandler from "konami-code-js";

import { copyToClipboard } from "../util/copyToClipboard.mjs";
import { debounce } from "../util/debounce.mjs";
import { effect } from "../util/effect.mjs";
import { extractAttachments } from "../util/extractAttachments.mjs";
import { extractJsonFromPng } from "../util/canvasToPngWithState.mjs";
import { getRandomSeed } from "../util/getRandomSeed.mjs";
import { raycastFromCanvasCoords } from "../util/raycastFromCanvasCoords.mjs";
import { removeBlock } from "../util/interaction.mjs";
import { runCompress } from "../util/compression.mjs";
import { showColorCustomizationDialog } from "../util/customColors.mjs";

import { gameConfig } from "../state/config/index.mjs";
import { createSaveState } from "../state/createSave.mjs";
import { loadSaveState } from "../state/loadSave.mjs";
import { selectMaterialBarSlot, setMaterialBarItem } from "../state/state.mjs";

import { generateProceduralWorld } from "../generate/world.mjs";

import { showAboutDialog } from "../dialog/about.mjs";
import { showExamplesDialog } from "../dialog/examples.mjs";
import { showPrivacyDialog } from "../dialog/privacy.mjs";

import { resizeCanvas } from "../api/ui/resizeCanvas.mjs";
import { showToast } from "../api/ui/toast.mjs";

import {
  autoSaveGame,
  getSaveMode,
  setSaveMode,
  showStorageDialog,
} from "../dialog/storage.mjs";

import { InventoryDialog } from "../dialog/inventory.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('./game.mjs').CustomShadowHost} CustomShadowHost */

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
    const isCornerContainerHidden = cornerContainer?.getAttribute("hidden");
    if (isCornerContainerHidden && isCornerContainerHidden !== null) {
      cornerContainer.removeAttribute("hidden");

      return;
    }

    cornerContainer?.setAttribute("hidden", "hidden");
  }
}

/**
 *
 * @param {number} currentBlock
 * @param {number} blockCount
 * @param {boolean} isForward
 *
 * @returns {number}
 */
function getNewIndex(currentBlock, blockCount, isForward) {
  return isForward
    ? currentBlock === blockCount - 1
      ? 1
      : currentBlock + 1
    : currentBlock === 1
      ? blockCount - 1
      : currentBlock - 1;
}

/**
 * Update the flight toggle when flying or not
 *
 * @param {HTMLElement} flightToggle
 * @param {boolean} isFlying
 *
 * @returns {void}
 */
export function updateFlightToggleButton(flightToggle, isFlying) {
  flightToggle.style.color = "var(--bg-color-white)";

  if (isFlying) {
    flightToggle.textContent = "🪽 Disable Flight";
    flightToggle.style.backgroundColor = "var(--bg-color-red-500)";

    return;
  }

  flightToggle.textContent = "🪽 Enable Flight";
  flightToggle.style.backgroundColor = "var(--bg-color-green-500)";
}

/**
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Signal.State} currentResolution - Signal State for current resolution
 *
 * @returns {void}
 */
// Shared state to track touch interactions
let lastTouchTime = 0;

/**
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Signal.State} currentResolution - Signal State for current resolution
 *
 * @returns {void}
 */
export function initElementEventListeners(shadow, cnvs, currentResolution) {
  const gameState = globalThis.blockGarden.state;

  const host =
    /** @type {CustomShadowHost} */
    (shadow.host);

  const inventoryDialog = new InventoryDialog(
    globalThis,
    globalThis.document,
    shadow,
  );

  // Extras
  new extrasHandler((handler) => {
    shadow
      .getElementById("customizeColorsBtnContainer")
      .removeAttribute("hidden");

    shadow.getElementById("examplesBtnContainer").removeAttribute("hidden");

    shadow
      .querySelector('block-garden-option[value="fullscreen"]')
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

    gameState.hasEnabledExtras.set(true);
    handler.disable();
  });

  initRadiusControlListeners(shadow);

  const material = shadow.querySelector("#material .ui-grid__corner--heading");
  material.addEventListener("click", (e) => {
    shadow.getElementById("materialBar").toggleAttribute("hidden");

    if (shadow.getElementById("materialBar").hasAttribute("hidden")) {
      material.textContent = "🔍 Material";
    } else {
      material.textContent = "❌ Material";
    }
  });

  // Fast Growth Button
  const fastGrowthButton = shadow.getElementById("fastGrowthButton");
  if (fastGrowthButton) {
    fastGrowthButton.addEventListener("click", () => {
      gameState.fastGrowth = !gameState.fastGrowth;

      fastGrowthButton.textContent = gameState.fastGrowth
        ? "Disable Fast Growth"
        : "Enable Fast Growth";
      fastGrowthButton.style.backgroundColor = gameState.fastGrowth
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";
      fastGrowthButton.style.color = "var(--bg-color-white)";

      shadow.dispatchEvent(new CustomEvent("block-garden-reset"));
    });

    // Set initial button state
    fastGrowthButton.textContent = "Enable Fast Growth";
    fastGrowthButton.style.backgroundColor = "var(--bg-color-green-500)";
    fastGrowthButton.style.color = "var(--bg-color-white)";
  }

  // Split Controls Toggle
  const toggleSplitControls = shadow.getElementById("toggleSplitControls");
  if (toggleSplitControls) {
    const config = globalThis.blockGarden.config;

    const updateToggleSplitControlsButton = () => {
      const isEnabled = config.useSplitControls.get();
      toggleSplitControls.textContent = isEnabled
        ? "Disable Split Controls"
        : "Enable Split Controls";
      toggleSplitControls.style.backgroundColor = isEnabled
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";
      toggleSplitControls.style.color = "var(--bg-color-white)";
    };

    toggleSplitControls.addEventListener("click", () => {
      config.useSplitControls.set(!config.useSplitControls.get());

      updateToggleSplitControlsButton();
    });

    // Initial state
    updateToggleSplitControlsButton();
  }

  // Flight Toggle
  /** @type {HTMLElement} */
  const flightToggle = shadow.querySelector("#toggleFlight");
  if (flightToggle) {
    flightToggle.addEventListener("click", () => {
      const isFlying = gameState.flying.get();
      gameState.flying.set(!isFlying);

      updateFlightToggleButton(flightToggle, !isFlying);
    });

    updateFlightToggleButton(flightToggle, gameState.flying.get());
  }

  // Random Plant Again Button
  const randomPlantButton = shadow.getElementById("randomPlantButton");
  if (randomPlantButton) {
    randomPlantButton.addEventListener("click", () => {
      // Call the random planting logic again on the current world
      if (typeof randomPlantSeeds === "function") {
        randomPlantSeeds();

        showToast(shadow, "Random planting at spawn point complete!");
      }
    });
  }

  function handleInventoryClick() {
    return () => {
      inventoryDialog.toggle();
    };
  }

  const inventoryButton = shadow.querySelector('[data-key="e"]');

  inventoryButton.addEventListener("click", handleInventoryClick());
  inventoryButton.addEventListener("touchstart", handleInventoryClick());

  shadow.addEventListener(
    "keyup",
    /** @param {KeyboardEvent} e */
    (e) => {
      host.keys[e.key.toLowerCase()] = false;

      e.preventDefault();
    },
  );

  const closeWorldGenerationBtn = shadow.getElementById("closeWorldGeneration");
  if (closeWorldGenerationBtn) {
    closeWorldGenerationBtn.addEventListener("click", () => {
      shadow
        .querySelector('[class="seed-controls"]')
        .setAttribute("hidden", "hidden");

      setTimeout(() => {
        globalThis.blockGarden.state.isCanvasActionDisabled = false;
      }, 500);
    });
  }

  // About button
  const aboutBtn = shadow.getElementById("aboutBtn");

  if (aboutBtn) {
    aboutBtn.addEventListener("click", async function () {
      try {
        await showAboutDialog(globalThis.document, shadow);
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
        await showExamplesDialog(globalThis.document, shadow);
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
        await showPrivacyDialog(globalThis.document, shadow);
      } catch (error) {
        console.error("Failed to open privacy dialog:", error);

        alert("Failed to open privacy dialog. Check console for details.");
      }
    });
  }

  const customizeColors = shadow.getElementById("customizeColorsBtn");
  if (customizeColors) {
    const config = globalThis.blockGarden.config;
    customizeColors.addEventListener("click", async () => {
      const initialResolution = config.currentResolution.get();

      if (initialResolution === "400") {
        config.currentResolution.set("800");
        resizeCanvas(shadow, config.currentResolution);

        const colorDialog = await showColorCustomizationDialog(globalThis);
        colorDialog.dialog.addEventListener("close", () => {
          config.currentResolution.set(initialResolution);

          resizeCanvas(shadow, config.currentResolution);
        });

        return;
      }

      await showColorCustomizationDialog(globalThis);
    });
  }

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

        const seedControls = shadow.querySelector('[class="seed-controls"]');
        seedControls.toggleAttribute("hidden");

        if (seedControls.hasAttribute("hidden")) {
          setTimeout(() => {
            globalThis.blockGarden.state.isCanvasActionDisabled = false;
          }, 500);
        } else {
          globalThis.blockGarden.state.isCanvasActionDisabled = true;
        }

        globalThis.document.exitPointerLock();
      }

      if (
        lowercaseKey === "backspace" ||
        lowercaseKey === "delete" ||
        lowercaseKey === "escape"
      ) {
        return;
      }

      if (lowercaseKey === "e") {
        e.preventDefault();

        inventoryDialog.toggle();

        return;
      }

      if (lowercaseKey >= "1" && lowercaseKey <= "9") {
        e.preventDefault();

        selectMaterialBarSlot(parseInt(lowercaseKey) - 1);

        return;
      }

      if (lowercaseKey === "`" || lowercaseKey === "~") {
        e.preventDefault();

        if (e.code === "Backquote" || e.code === "Accent") {
          const newIndex = getNewIndex(
            gameState.curBlock.get(),
            gameConfig.blocks.length,
            !e.shiftKey,
          );

          gameState.curBlock.set(newIndex);

          setMaterialBarItem(newIndex);
        }
      }
    },
  );

  const resolutionSelectEl = shadow.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener(
      "change",
      (
        /** @type {CustomEvent} */
        e,
      ) => {
        gameConfig.currentResolution.set(e.detail.value);

        resizeCanvas(shadow, gameConfig.currentResolution);
      },
    );
  }

  shadow.addEventListener(
    "mousemove",
    (
      /** @type MouseEvent */
      e,
    ) => {
      if (
        shadow.pointerLockElement === cnvs ||
        shadow.pointerLockElement === shadow.host ||
        globalThis.document.pointerLockElement === cnvs ||
        globalThis.document.pointerLockElement === shadow.host
      ) {
        gameState.yaw -= e.movementX * 0.0025;
        const MAX_PITCH = Math.PI / 2 - 0.01;
        gameState.pitch = Math.max(
          -MAX_PITCH,
          Math.min(MAX_PITCH, gameState.pitch - e.movementY * 0.0025),
        );
      }
    },
  );

  // Prevent default touch behaviors and track touch time
  shadow.addEventListener(
    "touchstart",
    (e) => {
      lastTouchTime = Date.now();
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false },
  );

  shadow.addEventListener(
    "touchmove",
    (e) => {
      lastTouchTime = Date.now();
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false },
  );

  shadow.addEventListener(
    "touchend",
    (e) => {
      lastTouchTime = Date.now();
      if (
        (e.target instanceof HTMLDivElement &&
          e.target.closest(".touch-controls")) ||
        e.target === shadow.getElementById("canvas")
      ) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    { passive: false },
  );

  // Prevent context menu on long press
  shadow.addEventListener("contextmenu", (e) => {
    if (
      (e.target instanceof HTMLDivElement &&
        e.target.closest(".touch-controls")) ||
      e.target === shadow.getElementById("canvas")
    ) {
      e.preventDefault();
    }
  });

  cnvs.addEventListener("mousedown", (e) => {
    // Ignore mousedown if it happened shortly after a touch event
    if (Date.now() - lastTouchTime < 1000) {
      return;
    }

    const gameState = globalThis.blockGarden.state;
    // @ts-ignore
    const gameConfig = globalThis.blockGarden.config;

    let hit = gameState.hit;
    const useSplit = gameConfig.useSplitControls.get();

    if (!useSplit) {
      const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;

      const { hit: rayHit } = raycastFromCanvasCoords(
        cnvs,
        e.clientX,
        e.clientY,
        gameState.world,
        {
          x: gameState.x,
          y: eyeY,
          z: gameState.z,
        },
        {
          yaw: gameState.yaw,
          pitch: gameState.pitch,
        },
      );
      hit = rayHit;
    }

    /**
     * Perform action -- defer to hammer.js "tap" event for placement, and "press" event
     * for removal. Here, removal with button 2 from mousedown event
     */
    if (e.button === 2) {
      removeBlock(gameState, hit);
    }
  });

  // Prevent zoom on double tap
  shadow.addEventListener("dblclick", (e) => {
    if (
      (e.target instanceof HTMLDivElement &&
        e.target.closest(".touch-controls")) ||
      e.target === shadow.getElementById("canvas")
    ) {
      e.preventDefault();
    }
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

    generateProceduralWorld(
      Number(seedInputValue),
      globalThis.blockGarden.state,
    );

    console.log(`Generated new world with seed: ${seedInputValue}`);

    currentSeedDisplay.textContent = seedInputValue;
  }

  function handleRandomSeedButton() {
    const currentSeedDisplay = shadow.getElementById("currentSeed");
    const seedInput = shadow.getElementById("worldSeedInput");
    const randomSeed = getRandomSeed();

    if (seedInput instanceof HTMLInputElement) {
      seedInput.value = String(randomSeed);
    }

    currentSeedDisplay.textContent = String(randomSeed);

    generateProceduralWorld(randomSeed, globalThis.blockGarden.state);

    console.log(`Generated new world with random seed: ${randomSeed}`);
  }

  const generateBtn = shadow.getElementById("generateWithSeed");
  generateBtn.addEventListener("click", handleGenerateButton);

  const randomBtn = shadow.getElementById("randomSeed");
  randomBtn.addEventListener("click", handleRandomSeedButton);

  const copySeedBtn = shadow.getElementById("copySeed");
  copySeedBtn.addEventListener("click", async function () {
    const seedInput = shadow.getElementById("worldSeedInput");

    if (seedInput instanceof HTMLInputElement) {
      await copyToClipboard(globalThis, seedInput.value);
    }
  });

  const saveMode = shadow.getElementById("saveModeToggle");
  getSaveMode().then(async (mode) => {
    const resolvedMode = mode === "auto" ? "auto" : "manual";

    console.log("Save Mode:", resolvedMode);

    if (resolvedMode === "auto") {
      saveMode.innerText = "Save Mode Auto";
      saveMode.style.backgroundColor = "var(--bg-color-green-500)";

      return;
    }

    saveMode.innerText = "Save Mode Manual";
    saveMode.style.backgroundColor = "var(--bg-color-red-500)";
  });

  saveMode.addEventListener("click", async function () {
    const mode = await getSaveMode();
    const resolvedMode = mode === "auto" ? "auto" : "manual";

    if (resolvedMode === "manual") {
      saveMode.innerText = "Save Mode Auto";
      saveMode.style.backgroundColor = "var(--bg-color-green-500)";

      await setSaveMode("auto");
      await autoSaveGame(globalThis);

      return;
    }

    if (resolvedMode === "auto") {
      saveMode.innerText = "Save Mode Manual";
      saveMode.style.backgroundColor = "var(--bg-color-red-500)";

      await setSaveMode("manual");
    }
  });

  const saveCompressedBtn = shadow.getElementById("saveExternalGameFile");
  saveCompressedBtn.addEventListener("click", async function () {
    try {
      const saveState = createSaveState(globalThis.blockGarden.state.world);
      const stateJSON = JSON.stringify(saveState);

      await runCompress(globalThis, stateJSON);

      console.log("Game state saved successfully");
    } catch (error) {
      console.error("Failed to save game state:", error);

      alert("Failed to save game state. Check console for details.");
    }
  });

  const loadExternalGameFileBtn = shadow.getElementById("loadExternalGameFile");
  loadExternalGameFileBtn.addEventListener("click", async function () {
    // try {
    const currentSeedDisplay = shadow.getElementById("currentSeed");
    const seedInput = shadow.getElementById("worldSeedInput");

    let file;

    // Feature detection for showOpenFilePicker
    if (globalThis.showOpenFilePicker) {
      const [fileHandle] = await globalThis.showOpenFilePicker({
        types: [
          {
            description: "Block Garden Save Game Files",
            accept: {
              "application/*": [".bgs"],
              "application/pdf": [".pdf"],
              "text/plain": [".txt"],
            },
          },
        ],
      });

      file = await fileHandle.getFile();
    } else {
      // Fallback for browsers without showOpenFilePicker
      const input = globalThis.document.createElement("input");
      input.type = "file";
      input.accept =
        ".bgs,.pdf,.txt,text/plain,application/pdf,application/gzip,application/*";
      input.style.display = "none";

      shadow.append(input);

      const filePromise = new Promise((resolve) => {
        input.onchange = () => resolve(input.files[0]);
      });

      input.click();

      file = await filePromise;
      shadow.removeChild(input);
    }

    let stateJSON = "{}";

    if (file.name.endsWith(".txt")) {
      stateJSON = (await file.text()).replace(/\s+/g, "");
    }

    if (file.name.endsWith(".pdf")) {
      const [results] = await extractAttachments(file);
      stateJSON = await extractJsonFromPng(new Blob([results.data]));
    }

    if (file.name.endsWith(".bgs")) {
      const decompressedStream = file
        .stream()
        .pipeThrough(new globalThis.DecompressionStream("gzip"));

      const decompressedBlob = await new globalThis.Response(
        decompressedStream,
      ).blob();

      stateJSON = await decompressedBlob.text();
    }

    // Validate the file is a valid game state before sharing
    /** @type {Object} */
    let saveState;

    try {
      saveState = JSON.parse(stateJSON);
    } catch (parseError) {
      throw new Error("Invalid game state file: not valid JSON.");
    }

    await loadSaveState(globalThis, shadow, saveState);
  });

  let canShareFiles = false;
  const shareExternalGameFileBtn = shadow.getElementById(
    "shareExternalGameFile",
  );

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare !== "undefined"
  ) {
    // Test if we can actually share files
    try {
      canShareFiles = navigator.canShare({ files: [new File([], "test")] });
    } catch (e) {
      console.info(`File sharing is not enabled. ${JSON.stringify(e)}`);
    }
  }

  if (canShareFiles) {
    shadow
      .querySelectorAll(".seed-controls--share")
      .forEach((s) => s.removeAttribute("hidden"));

    shareExternalGameFileBtn.addEventListener("click", async function () {
      try {
        let file;

        if (globalThis.showOpenFilePicker) {
          // Modern File System Access API
          const [fileHandle] = await globalThis.showOpenFilePicker({
            types: [
              {
                description: "Block Garden Save Game Files",
                accept: {
                  "application/octet-stream": [".bgs"],
                  "application/pdf": [".pdf"],
                  "text/plain": [".txt"],
                },
              },
              {
                description: "All files (*.*)",
                accept: { "*/*": [] }, // Broad fallback
              },
            ],
            excludeAcceptAllOption: false,
          });

          file = await fileHandle.getFile();
        } else {
          // Primary fallback: <input type="file">
          const input = globalThis.document.createElement("input");
          input.type = "file";
          input.multiple = false;
          input.style.display = "none";
          input.accept =
            ".bgs,.pdf,.txt,application/octet-stream,application/pdf,text/plain,*/*";

          shadow.appendChild(input);

          const filePromise = new Promise((resolve, reject) => {
            input.onchange = () => {
              if (input.files && input.files[0]) {
                resolve(input.files[0]);
              } else {
                reject(new DOMException("No file selected", "AbortError"));
              }
            };
            input.onerror = () => reject(new Error("File input failed"));
          });

          input.click();

          file = await filePromise;
          shadow.removeChild(input);
        }

        // Process file based on extension
        let stateJSON = "{}";

        if (file.name.toLowerCase().endsWith(".txt")) {
          stateJSON = (await file.text()).replace(/\s+/g, "");
        } else if (file.name.toLowerCase().endsWith(".pdf")) {
          const [results] = await extractAttachments(file);
          stateJSON = await extractJsonFromPng(new Blob([results.data]));
        } else if (file.name.toLowerCase().endsWith(".bgs")) {
          // Handle .bgs (gzip compressed)
          const decompressedStream = file
            .stream()
            .pipeThrough(new globalThis.DecompressionStream("gzip"));
          const decompressedBlob = await new globalThis.Response(
            decompressedStream,
          ).blob();
          stateJSON = await decompressedBlob.text();
        } else {
          throw new Error(`Unsupported file type: ${file.name}`);
        }

        // Validate JSON structure
        let saveState;
        try {
          saveState = JSON.parse(stateJSON);
        } catch (parseError) {
          throw new Error("Invalid game state file: not valid JSON.");
        }

        // Create shareable JSON file
        const shareFile = new File(
          [stateJSON],
          `BlockGarden-${file.name.replace(/\.[^.]+$/, "")}-save.json.txt`,
          {
            type: "text/plain",
            lastModified: Date.now(),
          },
        );

        // Share via Web Share API
        if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
          await navigator.share({
            files: [shareFile],
            title: "Block Garden Game Save",
            text: `Block Garden save from ${file.name}\nVisit https://kherrick.github.io/block-garden and click 'Load' to play!`,
            url: "https://kherrick.github.io/block-garden",
          });
          console.log("Game state shared successfully");
        } else {
          // Download fallback
          const url = URL.createObjectURL(shareFile);
          const a = document.createElement("a");
          a.href = url;
          a.download = shareFile.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          URL.revokeObjectURL(url);

          console.log("Game state downloaded:", shareFile.name);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Share failed:", error);

          alert(`Share failed: ${error.message}`);
        } else {
          console.log("User cancelled file selection");
        }
      }
    });
  }

  // Add event listener for storage dialog button
  const openStorageBtn = shadow.getElementById("openStorageBtn");
  if (openStorageBtn) {
    openStorageBtn.addEventListener("click", async function () {
      try {
        await showStorageDialog(globalThis, globalThis.document, shadow);
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

  // planting logic for randomPlantButton ---
  function randomPlantSeeds() {
    // Reuse the logic from generateProceduralWorld, but only the pre-planting part
    const { blocks, blockNames } = gameConfig;
    const { world } = gameState;

    // Helper to find block IDs
    const getBlockId = (name) => blocks.findIndex((b) => b.name === name);
    const GRASS = getBlockId(blockNames.GRASS);
    const RANDOM_PLANT_RADIUS = 32;
    const MIN_Y = 1;
    const MAX_Y = 24;

    // Collect valid grass blocks
    const validSeedSpots = [];
    for (let x = -RANDOM_PLANT_RADIUS; x <= RANDOM_PLANT_RADIUS; x++) {
      for (let z = -RANDOM_PLANT_RADIUS; z <= RANDOM_PLANT_RADIUS; z++) {
        for (let y = MIN_Y; y <= MAX_Y; y++) {
          const key = `${x},${y},${z}`;

          // Allow planting on any grass block, regardless of y
          if (
            world.get(key) === GRASS &&
            (Math.abs(x) > 2 || Math.abs(z) > 2)
          ) {
            validSeedSpots.push({ x, y, z, key });
          }
        }
      }
    }
    // Place one of each seed at a random valid spot
    if (validSeedSpots.length > 0) {
      const usedKeys = new Set();
      blocks.forEach((block, blockId) => {
        if (block.isSeed) {
          let spot = null;
          let attempts = 0;
          while (attempts < 100 && !spot) {
            const candidate =
              validSeedSpots[Math.floor(Math.random() * validSeedSpots.length)];
            if (candidate && !usedKeys.has(candidate.key)) {
              spot = candidate;
              usedKeys.add(candidate.key);
            }
            attempts++;
          }
          if (spot) {
            world.set(spot.key, blockId);
            gameState.plantStructures[spot.key] = {
              type: block.name,
              blocks: [spot.key],
            };
            const FAST_GROWTH_TIME = 30;
            gameState.growthTimers[spot.key] = gameState.fastGrowth
              ? FAST_GROWTH_TIME
              : block.growthTime || 10.0;
          }
        }
      });
    }

    // Ensure growthTimers are updated for fast growth if enabled
    if (gameState.fastGrowth) {
      shadow.dispatchEvent(new CustomEvent("block-garden-reset"));
    }
  }

  const debouncedResize = debounce(() => {
    resizeCanvas(shadow, currentResolution);
  }, 200);

  const resizeObserver = new ResizeObserver((entries) => {
    debouncedResize();
  });

  resizeObserver.observe(shadow.host);

  const toggleTouchControls = shadow.getElementById("toggleTouchControls");
  if (toggleTouchControls) {
    toggleTouchControls.addEventListener("click", () => {
      gameConfig.useTouchControls.set(!gameConfig.useTouchControls.get());
    });

    effect(() => {
      const enabled = gameConfig.useTouchControls.get();
      toggleTouchControls.textContent = enabled
        ? "Disable Touch Controls"
        : "Enable Touch Controls";
      toggleTouchControls.style.backgroundColor = enabled
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";
      toggleTouchControls.style.color = "var(--bg-color-white)";
    });
  }
}

/**
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Object} blocks
 * @param {Signal.State} curBlock
 *
 * @returns {void}
 */
export function initCanvasEventListeners(shadow, cnvs, blocks, curBlock) {
  cnvs.addEventListener("click", () => {
    // @ts-ignore
    const gameConfig = globalThis.blockGarden.config;
    if (gameConfig.useSplitControls.get()) {
      cnvs?.requestPointerLock();
    }
  });

  cnvs.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}

/**
 * Initialize material bar event listeners.
 *
 * @param {ShadowRoot} shadow
 *
 * @returns {void}
 */
export function initMaterialBarEventListeners(shadow) {
  const materialBarEl = shadow.getElementById("materialBar");
  if (!materialBarEl) {
    return;
  }

  // Add click listeners to material bar slots
  materialBarEl.addEventListener("click", (e) => {
    const slot =
      e.target instanceof Element
        ? e.target.closest(".materialBar-slot")
        : null;

    if (slot instanceof HTMLElement) {
      const index = parseInt(slot.dataset.index);
      selectMaterialBarSlot(index);
    }
  });
}

/**
 * Initialize radius control listeners
 *
 * @param {ShadowRoot} shadow
 */
function initRadiusControlListeners(shadow) {
  const gameConfig = globalThis.blockGarden.config;

  const radiusSettings = [
    { id: "viewRadius", signal: gameConfig.viewRadius },
    { id: "cacheRadius", signal: gameConfig.cacheRadius },
    { id: "renderRadius", signal: gameConfig.renderRadius },
    { id: "worldRadius", signal: gameConfig.worldRadius },
  ];

  radiusSettings.forEach(({ id, signal }) => {
    const input = shadow.getElementById(`${id}Input`);
    const display = shadow.getElementById(`${id}Display`);

    if (input instanceof HTMLInputElement && display) {
      // Initialize value
      input.value = String(signal.get());
      const currentVal = signal.get();
      display.textContent = String(
        currentVal === null || currentVal > 2048 ? "∞" : currentVal,
      );

      // Update on change
      input.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
          const newValue = parseInt(e.target.value, 10);
          signal.set(newValue);
          display.textContent = String(
            newValue === null || newValue > 2048 ? "∞" : newValue,
          );
        }
      });
    }
  });
}
