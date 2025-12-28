import extrasHandler from "konami-code-js";

import { debounce } from "../util/debounce.mjs";
import { effect } from "../util/effect.mjs";
import { getBlock } from "../util/world.mjs";
import { placeBlock, removeBlock } from "../util/interaction.mjs";
import { resizeCanvas } from "../util/resizeCanvas.mjs";

import { gameConfig } from "../state/config/index.mjs";
import { createSaveState } from "../state/createSave.mjs";
import { loadSaveState } from "../state/loadSave.mjs";

import { generateProceduralWorld } from "../generate/world.mjs";

import { copyToClipboard } from "../util/copyToClipboard.mjs";
import { extractAttachments } from "../util/extractAttachments.mjs";
import { extractJsonFromPng } from "../util/canvasToPngWithState.mjs";
import { runCompress } from "../util/compression.mjs";

import {
  autoSaveGame,
  getSaveMode,
  setSaveMode,
  showStorageDialog,
} from "../dialog/storage.mjs";
import { getRandomSeed } from "../util/getRandomSeed.mjs";

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

    if (cornerContainer.getAttribute("hidden") !== null) {
      cornerContainer.removeAttribute("hidden");

      return;
    }

    cornerContainer.setAttribute("hidden", "hidden");
  }
}

function handleBackquoteClick(gameState) {
  return () => {
    gameState.curBlock.set(
      (gameState.curBlock.get() + 1) % gameConfig.blocks.length,
    );
  };
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

  // Extras
  new extrasHandler((handler) => {
    shadow
      .getElementById("customizeColorsBtnContainer")
      ?.removeAttribute("hidden");

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

  // Toggle Pre-Planting Button
  const togglePrePlanting = shadow.getElementById("togglePrePlanting");
  if (togglePrePlanting) {
    togglePrePlanting.addEventListener("click", () => {
      gameState.isPrePlanted = !gameState.isPrePlanted;
      togglePrePlanting.textContent = gameState.isPrePlanted
        ? "Disable Pre-Planting"
        : "Enable Pre-Planting";
      togglePrePlanting.style.backgroundColor = gameState.isPrePlanted
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";
      togglePrePlanting.style.color = "var(--bg-color-white)";
    });
    // Set initial button state
    togglePrePlanting.textContent = gameState.isPrePlanted
      ? "Disable Pre-Planting"
      : "Enable Pre-Planting";
    togglePrePlanting.style.backgroundColor = gameState.isPrePlanted
      ? "var(--bg-color-red-500)"
      : "var(--bg-color-green-500)";
    togglePrePlanting.style.color = "var(--bg-color-white)";
  }

  // Random Plant Again Button
  const randomPlantButton = shadow.getElementById("randomPlantButton");
  if (randomPlantButton) {
    randomPlantButton.addEventListener("click", () => {
      // Call the random planting logic again on the current world
      if (typeof randomPlantSeeds === "function") {
        randomPlantSeeds();

        alert("Random planting complete!");
      }
    });
  }

  const backquote = shadow.querySelector('[data-key="backquote"]');

  backquote.addEventListener("click", handleBackquoteClick(gameState));
  backquote.addEventListener("touchstart", handleBackquoteClick(gameState));

  shadow
    .querySelector('[data-key="backquote"]')
    .addEventListener("click", () => {
      gameState.curBlock.set(
        (gameState.curBlock.get() + 1) % gameConfig.blocks.length,
      );
    });

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

        shadow
          .querySelector('[class="seed-controls"]')
          .toggleAttribute("hidden");

        globalThis.document.exitPointerLock();
      }

      if (
        (lowercaseKey >= "0" && lowercaseKey <= "9") ||
        lowercaseKey === "backspace" ||
        lowercaseKey === "delete" ||
        lowercaseKey === "escape"
      ) {
        return;
      }

      if (lowercaseKey === "`" || lowercaseKey === "~") {
        e.preventDefault();
        if (e.code === "Backquote" || e.code === "Accent") {
          const blockCount = gameConfig.blocks.length;
          const forward = !e.shiftKey;
          const newIndex = forward
            ? (gameState.curBlock.get() + 1) % blockCount
            : (gameState.curBlock.get() - 1 + blockCount) % blockCount;
          gameState.curBlock.set(newIndex);
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
      globalThis.blockGarden.config,
      globalThis.blockGarden.state,
    );

    console.log(`Generated new world with seed: ${seedInputValue}`);

    currentSeedDisplay.textContent = seedInputValue;
  }

  function handleRandomSeedButton() {
    const currentSeedDisplay = shadow.getElementById("currentSeed");
    const seedInput = shadow.getElementById("worldSeedInput");
    const randomSeed = getRandomSeed();

    generateProceduralWorld(
      randomSeed,
      globalThis.blockGarden.config,
      globalThis.blockGarden.state,
    );

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
    const WORLD_RADIUS = 16;
    const MIN_Y = 1;
    const MAX_Y = 24;
    const SEA_LEVEL = 4;

    // Collect valid grass tiles
    const validSeedSpots = [];
    for (let x = -WORLD_RADIUS; x <= WORLD_RADIUS; x++) {
      for (let z = -WORLD_RADIUS; z <= WORLD_RADIUS; z++) {
        for (let y = MIN_Y; y <= MAX_Y; y++) {
          const key = `${x},${y},${z}`;
          // Allow planting on any grass tile, regardless of y
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
    cnvs?.requestPointerLock();
  });

  cnvs.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  cnvs.addEventListener("mousedown", (e) => {
    // Ignore mousedown if it happened shortly after a touch event
    if (Date.now() - lastTouchTime < 1000) {
      return;
    }

    const gameState = globalThis.blockGarden.state;
    const hit = gameState.hit;

    if (!hit) {
      return;
    }

    const k = `${hit.x},${hit.y},${hit.z}`;
    const world = gameState.world;

    if (e.button === 0) {
      placeBlock(gameState);
    }

    if (e.button === 2) {
      removeBlock(gameState);
    }
  });
}
