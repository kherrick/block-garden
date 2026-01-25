import isNumber from "lodash.isnumber";
import extrasHandler from "konami-code-js";

import { copyToClipboard } from "../../utils/copyToClipboard.mjs";
import { debounce } from "../../utils/debounce.mjs";
import { effect } from "../../utils/effect.mjs";
import { extractAttachments } from "../../utils/extractAttachments.mjs";
import { extractJsonFromPng } from "../../utils/canvasToPngWithState.mjs";
import { getRandomSeed } from "../../utils/getRandomSeed.mjs";
import { persistValue } from "../../core/systems/persistence.mjs";
import { placeBlock } from "../../utils/interaction.mjs";
import { processSaveData } from "../../utils/saveData.mjs";
import { raycastFromCanvasCoords } from "../../utils/raycastFromCanvasCoords.mjs";
import { runCompress } from "../../utils/compression.mjs";
import { showColorCustomizationDialog } from "../../utils/colors/customColors.mjs";
import { waitForElement } from "../utils/waitForElement.mjs";

import {
  blockNames,
  blocks,
  FAST_GROWTH_TIME,
  getBlockById,
} from "../../world/config/blocks.mjs";
import { BIOMES } from "../../world/config/biomes.mjs";
import { createSaveState } from "../../core/createSave.mjs";
import { CONFIG_DEFAULTS, gameConfig } from "../../world/config/index.mjs";
import { loadSaveState } from "../../core/loadSave.mjs";
import {
  gameState,
  selectMaterialBarSlot,
  setMaterialBarItem,
} from "../../core/systems/game/state.mjs";

import { generateWorld, initNewWorld } from "../../world/generation/world.mjs";

import { showAboutDialog } from "../dialog/about.mjs";
import { showExamplesDialog } from "../dialog/examples.mjs";
import { showPrivacyDialog } from "../dialog/privacy.mjs";
import { showUrlDialog } from "../dialog/url.mjs";
import { showLinkConfigDialog } from "../dialog/linkConfiguration.mjs";
import { showTextConfigDialog } from "../dialog/textConfiguration.mjs";

import { resizeCanvas } from "../../api/ui/resizeCanvas.mjs";
import { showToast } from "../../api/ui/toast.mjs";

import {
  autoSaveGame,
  getSaveMode,
  setSaveMode,
  showStorageDialog,
} from "../dialog/storage.mjs";

import { InventoryDialog } from "../dialog/inventory.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../../world/config/blocks.mjs').BlockArray} BlockArray */

/** @typedef {import('../../core/systems/game/init.mjs').CustomShadowHost} CustomShadowHost */

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

// Helper to find block IDs
const getBlockId = (name) => blocks.find((b) => b.name === name)?.id ?? -1;

/**
 * @param {number} currentBlockId
 * @param {BlockArray} blocks
 * @param {boolean} isForward
 *
 * @returns {number}
 */
function getNewBlockId(currentBlockId, blocks, isForward) {
  const currentIndex = blocks.findIndex((b) => b.id === currentBlockId);
  const blockCount = blocks.length;
  const newIndex = isForward
    ? currentIndex === blockCount - 1
      ? 1
      : currentIndex + 1
    : currentIndex === 1
      ? blockCount - 1
      : currentIndex - 1;

  return blocks[newIndex].id;
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

  function toggleMaterialBar(forceClose = false) {
    const materialBar = shadow.getElementById("materialBar");

    if (forceClose) {
      materialBar.setAttribute("hidden", "hidden");
    } else {
      materialBar.toggleAttribute("hidden");
    }

    if (materialBar.hasAttribute("hidden")) {
      material.textContent = "🔍 Material";
    } else {
      material.textContent = "❌ Material";
    }
  }

  // Extras
  new extrasHandler((handler) => {
    shadow.getElementById("examplesBtnContainer").removeAttribute("hidden");
    shadow.getElementById("fastGrowthButton").removeAttribute("hidden");
    shadow.getElementById("gameSaveLinkingButton").removeAttribute("hidden");
    shadow.getElementById("randomPlantButton").removeAttribute("hidden");
    shadow.getElementById("toggleAODebug").removeAttribute("hidden");

    shadow
      .getElementById("customizeColorsBtnContainer")
      .removeAttribute("hidden");

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
  initGenerationControlListeners(shadow);

  const material = shadow.querySelector("#material .ui-grid__corner--heading");
  material.addEventListener("click", () => {
    toggleMaterialBar();
  });

  // Fast Growth Button
  const fastGrowthButton = shadow.getElementById("fastGrowthButton");
  if (fastGrowthButton) {
    fastGrowthButton.addEventListener("click", async () => {
      gameState.fastGrowth = !gameState.fastGrowth;

      await persistValue("state", "fastGrowth", gameState.fastGrowth);

      fastGrowthButton.textContent = gameState.fastGrowth
        ? "Disable Fast Growth"
        : "Enable Fast Growth";

      fastGrowthButton.style.backgroundColor = gameState.fastGrowth
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      fastGrowthButton.style.color = "var(--bg-color-white)";

      shadow.dispatchEvent(new CustomEvent("block-garden-reset"));
    });
  }

  // Game Save Linking
  const gameSaveLinkingButton = shadow.getElementById("gameSaveLinkingButton");
  if (gameSaveLinkingButton) {
    const config = globalThis.blockGarden.config;

    gameSaveLinkingButton.addEventListener("click", async () => {
      const newValue = !config.linkGameSave.get();

      config.linkGameSave.set(newValue);

      await persistValue("config", "linkGameSave", newValue);
    });

    effect(() => {
      const isEnabled = config.linkGameSave.get();
      gameSaveLinkingButton.textContent = isEnabled
        ? "Disable Game Save Linking"
        : "Enable Game Save Linking";

      gameSaveLinkingButton.style.backgroundColor = isEnabled
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      gameSaveLinkingButton.style.color = "var(--bg-color-white)";
    });
  }

  // Split Controls Toggle
  const toggleSplitControls = shadow.getElementById("toggleSplitControls");
  if (toggleSplitControls) {
    const config = globalThis.blockGarden.config;

    toggleSplitControls.addEventListener("click", async () => {
      const newValue = !config.useSplitControls.get();

      config.useSplitControls.set(newValue);

      await persistValue("config", "useSplitControls", newValue);
    });

    effect(() => {
      const isEnabled = config.useSplitControls.get();
      toggleSplitControls.textContent = isEnabled
        ? "Disable Split Controls"
        : "Enable Split Controls";

      toggleSplitControls.style.backgroundColor = isEnabled
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      toggleSplitControls.style.color = "var(--bg-color-white)";
    });
  }

  // Block Highlight Toggle
  const toggleBlockHighlight = shadow.getElementById("toggleBlockHighlight");
  if (toggleBlockHighlight) {
    const config = globalThis.blockGarden.config;

    toggleBlockHighlight.addEventListener("click", async () => {
      const newValue = !config.useBlockHighlight.get();

      config.useBlockHighlight.set(newValue);

      await persistValue("config", "useBlockHighlight", newValue);
    });

    effect(() => {
      const isEnabled = config.useBlockHighlight.get();
      toggleBlockHighlight.textContent = isEnabled
        ? "Disable Block Highlight"
        : "Enable Block Highlight";

      toggleBlockHighlight.style.backgroundColor = isEnabled
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      toggleBlockHighlight.style.color = "var(--bg-color-white)";
    });
  }

  // Damage Animation Toggle
  const toggleDamageAnimation = shadow.getElementById("toggleDamageAnimation");
  if (toggleDamageAnimation) {
    const config = globalThis.blockGarden.config;

    toggleDamageAnimation.addEventListener("click", async () => {
      const newValue = !config.useDamageAnimation.get();

      config.useDamageAnimation.set(newValue);

      await persistValue("config", "useDamageAnimation", newValue);
    });

    effect(() => {
      const isEnabled = config.useDamageAnimation.get();
      toggleDamageAnimation.textContent = isEnabled
        ? "Disable Damage Animation"
        : "Enable Damage Animation";

      toggleDamageAnimation.style.backgroundColor = isEnabled
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      toggleDamageAnimation.style.color = "var(--bg-color-white)";
    });
  }

  // Flight Toggle
  const flightToggle =
    /** @type {HTMLElement} */
    (shadow.querySelector("#toggleFlight"));
  if (flightToggle) {
    flightToggle.addEventListener("click", () => {
      const newValue = !gameState.flying.get();

      gameState.flying.set(newValue);
    });

    // Use effect to update UI whenever flying state changes
    effect(() => {
      updateFlightToggleButton(flightToggle, gameState.flying.get());
    });
  }

  // Link Block Configuration
  const configureLinkBlock = shadow.getElementById("configureLinkBlock");
  if (configureLinkBlock) {
    configureLinkBlock.addEventListener("click", () => {
      showLinkConfigDialog(globalThis, globalThis.document, shadow);
    });
  }

  // Text Block Configuration
  const configureTextBlock = shadow.getElementById("configureTextBlock");
  if (configureTextBlock) {
    configureTextBlock.addEventListener("click", () => {
      showTextConfigDialog(globalThis, globalThis.document, shadow);
    });
  }

  // Visual Effect Toggles
  const config = globalThis.blockGarden.config;

  const setupToggle = (id, signal, labelPrefix, configKey) => {
    const btn = shadow.getElementById(id);

    if (btn) {
      const update = () => {
        const val = signal.get();

        btn.textContent = val
          ? `Disable ${labelPrefix}`
          : `Enable ${labelPrefix}`;

        btn.style.backgroundColor = val
          ? "var(--bg-color-red-500)"
          : "var(--bg-color-green-500)";

        btn.style.color = "var(--bg-color-white)";
      };

      // Use effect to ensure UI updates when signal changes externally (e.g., from presets)
      effect(() => {
        update();
      });

      btn.addEventListener("click", async () => {
        const newValue = !signal.get();

        signal.set(newValue);

        await persistValue("config", configKey, newValue);

        // sync world time with manual time
        if (configKey === "useTimeCycle") {
          if (newValue) {
            const newWorldTime = config.manualTimeOfDay.get();

            await persistValue("state", "worldTime", newWorldTime);
            gameState.worldTime = newWorldTime;
          } else {
            const newManualTime = gameState.worldTime;

            await persistValue("config", "manualTimeOfDay", newManualTime);
            config.manualTimeOfDay.set(newManualTime);
          }
        }
      });
    }
  };

  setupToggle(
    "toggleTextures",
    config.useTextureAtlas,
    "Textures",
    "useTextureAtlas",
  );

  setupToggle(
    "toggleAO",
    config.useAmbientOcclusion,
    "Ambient Occlusion",
    "useAmbientOcclusion",
  );

  setupToggle(
    "toggleTimeCycle",
    config.useTimeCycle,
    "Time Cycle",
    "useTimeCycle",
  );

  setupToggle(
    "toggleDynamicLighting",
    config.useDynamicLighting,
    "Dynamic Lighting",
    "useDynamicLighting",
  );

  setupToggle(
    "togglePerFaceLighting",
    config.usePerFaceLighting,
    "Per-Face Lighting",
    "usePerFaceLighting",
  );

  setupToggle("toggleAODebug", config.useAODebug, "AO Debug", "useAODebug");
  setupToggle("toggleAutoJump", config.useAutoJump, "Auto Jump", "useAutoJump");

  // Random Plant Again Button
  const randomPlantButton = shadow.getElementById("randomPlantButton");
  if (randomPlantButton) {
    randomPlantButton.addEventListener("click", () => {
      // Call the random planting logic again on the current world
      if (typeof randomPlantSeeds === "function") {
        randomPlantSeeds();

        showToast(shadow, "Random planting at complete!");
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
      if (!e.key) {
        return;
      }

      host.keys[e.key.toLowerCase()] = false;

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      e.preventDefault();
    },
  );

  async function toggleWorldStatePanel(forceState) {
    const seedControls = /** @type {HTMLDialogElement} */ (
      shadow.querySelector(".seed-controls")
    );
    if (!seedControls) return;

    const isCurrentlyOpen = seedControls.open;
    const shouldHide =
      forceState === "hide" || (forceState === undefined && isCurrentlyOpen);

    if (shouldHide) {
      seedControls.close();
      // Logic moved to "close" event listener for better consistency
    } else {
      seedControls.showModal();
      globalThis.blockGarden.state.isCanvasActionDisabled = true;

      // Unlock pointer if locked
      if (globalThis.document.pointerLockElement) {
        globalThis.document.exitPointerLock();
      }

      const closeBtn = /** @type {HTMLButtonElement} */ (
        await waitForElement({
          getElement: () => shadow.getElementById("closeWorldGeneration"),
          intervalMs: 150,
          timeoutMs: 1000,
        })
      );

      closeBtn.focus();
    }
  }

  const seedControls = shadow.querySelector(".seed-controls");
  if (seedControls) {
    seedControls.addEventListener("close", async () => {
      setTimeout(() => {
        globalThis.blockGarden.state.isCanvasActionDisabled = false;
      }, 500);

      // Return focus to opening button
      const worldStateBtn = /** @type {HTMLButtonElement} */ (
        await waitForElement({
          getElement: () => shadow.getElementById("worldState"),
          intervalMs: 150,
          timeoutMs: 1000,
        })
      );

      worldStateBtn.focus();
    });
  }

  const closeWorldGenerationBtn = shadow.getElementById("closeWorldGeneration");
  if (closeWorldGenerationBtn) {
    closeWorldGenerationBtn.addEventListener("click", () =>
      toggleWorldStatePanel("hide"),
    );
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
  // Clear keys on blur to prevent stuck keys when window/tab loses focus
  globalThis.addEventListener("blur", () => {
    Object.keys(host.keys).forEach((key) => {
      host.keys[key] = false;
    });
  });

  // Keyboard events
  shadow.addEventListener(
    "keydown",
    /** @param {KeyboardEvent} e */
    async (e) => {
      if (!e.key) {
        return;
      }

      const lowercaseKey = e.key.toLowerCase();

      const host =
        /** @type {CustomShadowHost} */
        (shadow.host);
      host.keys[lowercaseKey] = true;

      const isInputFocused =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (lowercaseKey === "escape") {
        shadow
          .querySelectorAll(".ui-grid__corner--container")
          .forEach((e) => e.setAttribute("hidden", "hidden"));

        shadow.getElementById("materialBar").setAttribute("hidden", "hidden");

        toggleMaterialBar(true);
      }

      if (lowercaseKey === "backspace" || lowercaseKey === "delete") {
        return;
      }

      // Add 'S' key to show / hide the world generation panel
      if (lowercaseKey === "s" && e.ctrlKey) {
        e.preventDefault();

        toggleWorldStatePanel();

        return;
      }

      if (lowercaseKey === "enter" || lowercaseKey === " ") {
        if (
          (e.target instanceof HTMLInputElement &&
            e.target.getAttribute("id") === "worldSeedInput") ||
          (e.target instanceof HTMLButtonElement &&
            e.target.getAttribute("id") === "generateWithSeed")
        ) {
          handleGenerateButton();

          return;
        }

        if (e.target instanceof HTMLButtonElement && lowercaseKey === " ") {
          e.target.click();

          return;
        }
      }

      // If an input is focused or canvas actions are disabled, return early
      if (
        isInputFocused ||
        globalThis.blockGarden.state.isCanvasActionDisabled
      ) {
        return;
      }

      if (lowercaseKey === "m") {
        e.preventDefault();

        toggleMaterialBar();

        return;
      }

      if (lowercaseKey === "k") {
        e.preventDefault();

        gameState.flying.set(!gameState.flying.get());

        return;
      }

      if (lowercaseKey === "e" || lowercaseKey === "i") {
        e.preventDefault();

        inventoryDialog.open();

        return;
      }

      if (lowercaseKey >= "1" && lowercaseKey <= "9") {
        e.preventDefault();

        const materialBar = shadow.getElementById("materialBar");
        materialBar.removeAttribute("hidden");

        selectMaterialBarSlot(parseInt(lowercaseKey) - 1);

        return;
      }

      if (lowercaseKey === "`" || lowercaseKey === "~") {
        e.preventDefault();

        if (e.code === "Backquote" || e.code === "Accent") {
          const nextBlockId = getNewBlockId(
            gameState.curBlock.get(),
            gameConfig.blocks,
            !e.shiftKey,
          );

          gameState.curBlock.set(nextBlockId);

          setMaterialBarItem(nextBlockId);
        }
      }
    },
  );

  const resolutionSelectEl = shadow.getElementById("resolutionSelect");
  if (resolutionSelectEl) {
    resolutionSelectEl.addEventListener(
      "change",
      async (
        /** @type {CustomEvent} */
        e,
      ) => {
        const newValue = e.detail.value;
        gameConfig.currentResolution.set(newValue);

        await persistValue("config", "currentResolution", newValue);

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
      const isCanvas = e.target === shadow.getElementById("canvas");
      const isTouchControl =
        e.target instanceof HTMLDivElement &&
        e.target.closest(".touch-controls");

      if (isTouchControl || isCanvas) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }

      // Set cursorTarget immediately for highlighting (before HammerJS press delay)
      const touchEvent = /** @type {TouchEvent} */ (e);
      if (isCanvas && touchEvent.touches && touchEvent.touches[0]) {
        const gameState = globalThis.blockGarden.state;
        const gameConfig = globalThis.blockGarden.config;

        if (!gameConfig.useSplitControls.get()) {
          const touch = touchEvent.touches[0];
          const canvas = /** @type {HTMLCanvasElement} */ (
            shadow.getElementById("canvas")
          );

          if (canvas) {
            const eyeY = gameState.y - gameState.playerHeight / 2 + 1.62;
            const { hit: rayHit } = raycastFromCanvasCoords(
              canvas,
              touch.clientX,
              touch.clientY,
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

            if (rayHit) {
              gameState.cursorTarget = {
                x: rayHit.x,
                y: rayHit.y,
                z: rayHit.z,
              };
            } else {
              gameState.cursorTarget = null;
            }
          }
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
     * for removal.
     */
    // Left Click (Button 0) -> Break
    if (e.button === 0) {
      // Set cursorTarget immediately for highlighting (works even without pointer lock)
      if (!useSplit && hit) {
        gameState.cursorTarget = { x: hit.x, y: hit.y, z: hit.z };
      }

      if (
        shadow.pointerLockElement === cnvs ||
        shadow.pointerLockElement === shadow.host ||
        globalThis.document.pointerLockElement === cnvs ||
        globalThis.document.pointerLockElement === shadow.host
      ) {
        gameState.breakingInput.isHeld = true;
        gameState.breakingInput.mode = "cursor";
        gameState.breakingInput.cursorX = e.clientX;
        gameState.breakingInput.cursorY = e.clientY;
      }
    }

    // Right Click (Button 2) -> Place
    if (e.button === 2) {
      gameState.placingInput.isHeld = true;
      gameState.placingInput.mode = "cursor";
      gameState.placingInput.cursorX = e.clientX;
      gameState.placingInput.cursorY = e.clientY;

      /** @type {string | boolean} */
      let result = false;
      if (!useSplit) {
        // use rayHit calculated above
        if (hit) {
          result = placeBlock(gameState, hit);
          gameState.cursorTarget = { x: hit.x, y: hit.y, z: hit.z };
        }
      } else {
        // use center hit
        result = placeBlock(gameState);
      }

      if (result === "activated") {
        gameState.preventNextContextMenu = true;
      }
    }
  });

  const clearInputs = () => {
    gameState.breakingInput.isHeld = false;
    gameState.placingInput.isHeld = false;
    gameState.cursorTarget = null;
  };

  cnvs.addEventListener("mouseup", clearInputs);
  cnvs.addEventListener("mouseleave", clearInputs);
  shadow.addEventListener("touchend", clearInputs);
  shadow.addEventListener("touchcancel", clearInputs);

  cnvs.addEventListener("mousemove", (e) => {
    if (
      gameState.breakingInput.isHeld &&
      gameState.breakingInput.mode === "cursor"
    ) {
      gameState.breakingInput.cursorX = e.clientX;
      gameState.breakingInput.cursorY = e.clientY;
    }

    if (
      gameState.placingInput.isHeld &&
      gameState.placingInput.mode === "cursor"
    ) {
      gameState.placingInput.cursorX = e.clientX;
      gameState.placingInput.cursorY = e.clientY;
    }

    // Always update cursorTarget for highlighting if split controls are OFF
    if (!gameConfig.useSplitControls.get()) {
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

      if (rayHit) {
        gameState.cursorTarget = { x: rayHit.x, y: rayHit.y, z: rayHit.z };
      } else {
        gameState.cursorTarget = null;
      }
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

  const worldStateBtn = shadow.getElementById("worldState");
  if (worldStateBtn) {
    worldStateBtn.addEventListener("click", () => toggleWorldStatePanel());
  }

  function handleGenerateButton() {
    /** @type string | null */
    let seedInputValue = null;
    const seedInput = shadow.getElementById("worldSeedInput");
    if (seedInput instanceof HTMLInputElement) {
      seedInputValue = seedInput.value;
    }

    const currentSeedDisplay = shadow.getElementById("currentSeed");

    const seedValue = Number(seedInputValue);
    if (!isNumber(seedValue) || isNaN(seedValue)) {
      showToast(shadow, "Invalid seed. Please enter a number.");
      return;
    }

    if (seedValue < 1 || seedValue > Number.MAX_SAFE_INTEGER) {
      showToast(
        shadow,
        `Seed must be between 1 and ${Number.MAX_SAFE_INTEGER}.`,
      );
      return;
    }

    generateWorld(seedValue, globalThis.blockGarden.state);

    console.log(`Generated new world with seed: ${seedValue}`);

    currentSeedDisplay.textContent = String(seedValue);
  }

  function handleRandomSeedButton() {
    const currentSeedDisplay = shadow.getElementById("currentSeed");
    const seedInput = shadow.getElementById("worldSeedInput");
    const randomSeed = getRandomSeed();

    if (seedInput instanceof HTMLInputElement) {
      seedInput.value = String(randomSeed);
    }

    currentSeedDisplay.textContent = String(randomSeed);

    generateWorld(randomSeed, globalThis.blockGarden.state);

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
      showToast(
        shadow,
        `Game seed, ${seedInput.value}, has been copied successfully`,
      );
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
              "application/gzip": [".bgs"],
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

    try {
      const stateJSON = await processSaveData(file, file.name, globalThis);
      const saveState = JSON.parse(stateJSON);

      const loaded = await loadSaveState(globalThis, shadow, saveState);

      if (!loaded) {
        showToast(
          shadow,
          "Oops! This save state appears to be broken. Loading a new world...",
          { stack: true, useSingle: false, duration: 5000 },
        );

        initNewWorld(globalThis.blockGarden.state.seed);
      }
    } catch (error) {
      console.error("Failed to load external game file:", error);

      showToast(shadow, "Oops! Failed to load file. Loading a new world...", {
        stack: true,
        useSingle: false,
        duration: 5000,
      });

      initNewWorld(globalThis.blockGarden.state.seed);
    }
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

  // Add event listener for URL loading button
  const loadExternalGameUrlBtn = shadow.getElementById("loadExternalGameUrl");
  if (loadExternalGameUrlBtn) {
    loadExternalGameUrlBtn.addEventListener("click", async function () {
      try {
        await showUrlDialog(globalThis, globalThis.document, shadow);
      } catch (error) {
        console.error("Failed to open URL dialog:", error);

        alert("Failed to open URL dialog. Check console for details.");
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

    heading.addEventListener("keydown", (/** @type {any} */ e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();

        handleCornerClick(e);
      }
    });
  });

  // Configurable constants
  const PLANTING_CONFIG = {
    TOSS_COUNT: 5, // Number of seeds to "toss"
    TOSS_RADIUS: 20, // Max distance seeds can land
    MIN_DISTANCE_FROM_PLAYER: 2, // Don't plant too close

    // Blocks that should prevent planting in the entire column below them
    BANNED_SURFACES: new Set([
      getBlockId(blockNames.WATER),
      getBlockId(blockNames.LAVA),
    ]),
  };

  /**
   * Get biome from surface block ID, with cloud fallback
   */
  function getBiomeBySurface(surfaceId) {
    // Check standard biomes first
    for (const biome of Object.values(BIOMES)) {
      if (biome.surfaceBlockId === surfaceId) {
        return biome;
      }
    }

    // Clouds = any seed allowed
    if (surfaceId === getBlockId(blockNames.CLOUD)) {
      return {
        name: "Clouds",
        cropBlockIds: blocks.filter((b) => b.isSeed).map((b) => b.id),
      };
    }

    return null;
  }

  /**
   * Plant single seed at position
   */
  function plantSeedAt(key, allowedSeeds, world) {
    if (allowedSeeds.length === 0) {
      return;
    }

    const seedId =
      allowedSeeds[Math.floor(Math.random() * allowedSeeds.length)];

    const block = getBlockById(seedId);

    world.set(key, seedId, true);

    gameState.plantStructures[key] = {
      type: block.name,
      blocks: [key],
    };

    gameState.growthTimers[key] = gameState.fastGrowth
      ? FAST_GROWTH_TIME
      : block.growthTime || 10.0;
  }

  function randomPlantSeeds() {
    const { world } = gameState;
    const px = Math.floor(gameState.x);
    const py = Math.floor(gameState.y);
    const pz = Math.floor(gameState.z);

    const usedKeys = new Set();
    let seedsPlaced = 0;

    for (let i = 0; i < PLANTING_CONFIG.TOSS_COUNT; i++) {
      // Natural circular distribution using rejection sampling or polar coords
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * PLANTING_CONFIG.TOSS_RADIUS;

      if (dist < PLANTING_CONFIG.MIN_DISTANCE_FROM_PLAYER) continue;

      const dx = Math.round(Math.cos(angle) * dist);
      const dz = Math.round(Math.sin(angle) * dist);

      const tx = px + dx;
      const tz = pz + dz;

      // Start search higher to better catch surfaces below elevated player
      for (let y = py + 5; y >= 0; y--) {
        const key = `${tx},${y},${tz}`;
        const blockId = world.get(key);

        // Skip air/undefined
        if (blockId === undefined || blockId === getBlockId(blockNames.AIR)) {
          continue;
        }

        // Quick ban check - skips entire column if we hit water/lava
        if (PLANTING_CONFIG.BANNED_SURFACES.has(blockId)) break;

        const block = getBlockById(blockId);
        if (!block || !block.solid) continue;

        // Valid planting surfaces
        const biome = getBiomeBySurface(blockId);
        if (biome && !usedKeys.has(key)) {
          // Check if space ABOVE is clear
          const aboveKey = `${tx},${y + 1},${tz}`;
          const aboveId = world.get(aboveKey);

          if (aboveId === undefined || aboveId === getBlockId(blockNames.AIR)) {
            plantSeedAt(key, biome.cropBlockIds, world);
            usedKeys.add(key);
            seedsPlaced++;
          }
        }

        break; // Found surface (or banned block), stop scanning column
      }
    }

    console.log(
      `[Interaction] Randomly tossed seeds. Placed ${seedsPlaced} plants.`,
    );

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
    toggleTouchControls.addEventListener("click", async () => {
      const newValue = !gameConfig.useTouchControls.get();
      gameConfig.useTouchControls.set(newValue);

      await persistValue("config", "useTouchControls", newValue);
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

  globalThis.addEventListener(
    "contextmenu",
    (e) => {
      // If we just activated a Link or Text block, prevent the context menu
      const gameState = globalThis.blockGarden.state;
      if (gameState.preventNextContextMenu) {
        e.preventDefault();

        gameState.preventNextContextMenu = false;

        return;
      }

      const target = e.target;

      // If the context menu is triggered on the canvas, prevent it (standard game behavior)
      if (
        target === cnvs ||
        (target instanceof Element && cnvs.contains(target))
      ) {
        e.preventDefault();
      }
    },
    true,
  );
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

  materialBarEl.addEventListener("keydown", (/** @type {any} */ e) => {
    if (e.key === "Enter" || e.key === " ") {
      const slot =
        e.target instanceof Element
          ? e.target.closest(".materialBar-slot")
          : null;

      if (slot instanceof HTMLElement) {
        e.preventDefault();

        const index = parseInt(slot.dataset.index);

        selectMaterialBarSlot(index);
      }
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
      // Synchronize slider and display with signal
      effect(() => {
        const currentVal = signal.get();
        input.value = String(currentVal);

        display.textContent = String(
          currentVal === null || currentVal > 2048 ? "∞" : currentVal,
        );
      });

      // Update signal on change
      input.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
          signal.set(parseInt(e.target.value, 10));
        }
      });
    }
  });
}

/**
 * Initializes listeners for granular world generation controls.
 *
 * @param {ShadowRoot} shadow
 */
function initGenerationControlListeners(shadow) {
  const gameConfig = globalThis.blockGarden.config;

  const generationSettings = [
    { id: "terrainOctaves", signal: gameConfig.terrainOctaves, unit: "" },
    { id: "mountainScale", signal: gameConfig.mountainScale, unit: "%" },
    {
      id: "caveThreshold",
      signal: gameConfig.caveThreshold,
      unit: "%",
      displayId: "caveDensity",
    },
    {
      id: "decorationDensity",
      signal: gameConfig.decorationDensity,
      unit: "%",
    },
    { id: "cloudDensity", signal: gameConfig.cloudDensity, unit: "%" },
  ];

  generationSettings.forEach(({ id, signal, unit, displayId }) => {
    const input = shadow.getElementById(`${id}Input`);
    const display = shadow.getElementById(`${displayId || id}Display`);

    if (input instanceof HTMLInputElement && display) {
      // Synchronize slider and display with signal
      effect(() => {
        const val = signal.get();
        input.value = String(val);

        display.textContent = `${val}${unit}`;
      });

      input.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
          signal.set(parseInt(e.target.value, 10));
        }
      });
    }
  });

  // Manual Length of Day Slider
  const dayLengthInput = shadow.getElementById("dayLengthInput");
  const dayLengthDisplay = shadow.getElementById("dayLengthDisplay");
  const dayLengthContainer = shadow.getElementById("dayLengthContainer");

  if (
    dayLengthInput instanceof HTMLInputElement &&
    dayLengthDisplay &&
    dayLengthContainer
  ) {
    // Keep slider and display in sync
    effect(() => {
      const val = gameConfig.dayLength.get();
      dayLengthInput.value = String(val);

      // Just show the number, no math
      dayLengthDisplay.textContent = String(val);

      // Enable/disable depending on mode
      const isCycleEnabled = gameConfig.useTimeCycle.get();
      if (isCycleEnabled) {
        dayLengthInput.removeAttribute("disabled");
        dayLengthContainer.removeAttribute("hidden");
      } else {
        dayLengthInput.setAttribute("disabled", "disabled");
        dayLengthContainer.setAttribute("hidden", "hidden");
      }
    });

    // Update gameConfig on slider change with raw value
    dayLengthInput.addEventListener("input", async (e) => {
      if (e.target instanceof HTMLInputElement) {
        const newValue = Number(e.target.value);
        gameConfig.dayLength.set(newValue);

        await persistValue("config", "dayLength", newValue);
      }
    });
  }

  // Manual Time of Day Slider
  const manualTimeInput = shadow.getElementById("manualTimeOfDayInput");
  const manualTimeDisplay = shadow.getElementById("manualTimeOfDayDisplay");
  const manualTimeContainer = shadow.getElementById("manualTimeOfDayContainer");

  if (
    manualTimeInput instanceof HTMLInputElement &&
    manualTimeDisplay &&
    manualTimeContainer
  ) {
    // Synchronize slider and display with signal
    effect(() => {
      const val = gameConfig.manualTimeOfDay.get();
      manualTimeInput.value = String(val);

      // Convert 0-1 to 0:00-24:00 for display
      const hours = Math.floor(val * 24);
      const minutes = Math.floor((val * 24 - hours) * 60);
      manualTimeDisplay.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

      // Enable/disable based on useTimeCycle
      const isCycleEnabled = gameConfig.useTimeCycle.get();
      if (isCycleEnabled) {
        manualTimeInput.setAttribute("disabled", "disabled");
        manualTimeContainer.setAttribute("hidden", "hidden");
      } else {
        manualTimeInput.removeAttribute("disabled");
        manualTimeContainer.removeAttribute("hidden");
      }
    });

    manualTimeInput.addEventListener("input", async (e) => {
      if (e.target instanceof HTMLInputElement) {
        const newValue = parseFloat(e.target.value);
        const val = Math.max(0, Math.min(1, newValue));

        gameConfig.manualTimeOfDay.set(val);
        gameState.worldTime = val;

        await persistValue("config", "manualTimeOfDay", newValue);
        await persistValue("state", "worldTime", newValue);
      }
    });
  }

  const toggleCaves = shadow.getElementById("toggleCaves");
  const caveThresholdInput = shadow.getElementById("caveThresholdInput");
  const caveThresholdInputContainer = shadow.getElementById(
    "caveThresholdInputContainer",
  );

  if (toggleCaves) {
    effect(() => {
      const val = gameConfig.useCaves.get();

      toggleCaves.textContent = val ? "Disable Caves" : "Enable Caves";

      toggleCaves.style.backgroundColor = val
        ? "var(--bg-color-red-500)"
        : "var(--bg-color-green-500)";

      toggleCaves.style.color = "var(--bg-color-white)";

      if (val) {
        caveThresholdInput.removeAttribute("disabled");
        caveThresholdInputContainer.removeAttribute("hidden");
      } else {
        caveThresholdInput.setAttribute("disabled", "disabled");
        caveThresholdInputContainer.setAttribute("hidden", "hidden");
      }
    });

    toggleCaves.addEventListener("click", () => {
      const val = gameConfig.useCaves.get();
      gameConfig.useCaves.set(!val);

      if (val) {
        caveThresholdInput.removeAttribute("disabled");
        caveThresholdInputContainer.removeAttribute("hidden");
      } else {
        caveThresholdInput.setAttribute("disabled", "disabled");
        caveThresholdInputContainer.setAttribute("hidden", "hidden");
      }
    });
  }

  const applyDefaultPreset = shadow.getElementById("applyDefaultPreset");
  if (applyDefaultPreset) {
    applyDefaultPreset.addEventListener("click", async () => {
      gameState.fastGrowth = false;
      gameState.flying.set(false);

      gameConfig.useTouchControls.set(CONFIG_DEFAULTS.USE_TOUCH_CONTROLS);
      await persistValue(
        "config",
        "useTouchControls",
        CONFIG_DEFAULTS.USE_TOUCH_CONTROLS,
      );

      gameConfig.useAutoJump.set(CONFIG_DEFAULTS.USE_AUTO_JUMP);
      await persistValue(
        "config",
        "useAutoJump",
        CONFIG_DEFAULTS.USE_AUTO_JUMP,
      );

      gameConfig.linkGameSave.set(CONFIG_DEFAULTS.LINK_GAME_SAVE);
      await persistValue(
        "config",
        "linkGameSave",
        CONFIG_DEFAULTS.LINK_GAME_SAVE,
      );

      gameConfig.useSplitControls.set(CONFIG_DEFAULTS.USE_SPLIT_CONTROLS);
      await persistValue(
        "config",
        "useSplitControls",
        CONFIG_DEFAULTS.USE_SPLIT_CONTROLS,
      );

      gameConfig.currentResolution.set(CONFIG_DEFAULTS.CURRENT_RESOLUTION);
      await persistValue(
        "config",
        "currentResolution",
        CONFIG_DEFAULTS.CURRENT_RESOLUTION,
      );

      gameConfig.useBlockHighlight.set(CONFIG_DEFAULTS.USE_BLOCK_HIGHLIGHT);
      await persistValue(
        "config",
        "useBlockHighlight",
        CONFIG_DEFAULTS.USE_BLOCK_HIGHLIGHT,
      );

      gameConfig.useDamageAnimation.set(CONFIG_DEFAULTS.USE_DAMAGE_ANIMATION);
      await persistValue(
        "config",
        "useDamageAnimation",
        CONFIG_DEFAULTS.USE_DAMAGE_ANIMATION,
      );

      gameConfig.useTextureAtlas.set(CONFIG_DEFAULTS.USE_TEXTURE_ATLAS);
      await persistValue(
        "config",
        "useTextureAtlas",
        CONFIG_DEFAULTS.USE_TEXTURE_ATLAS,
      );

      gameConfig.useAmbientOcclusion.set(CONFIG_DEFAULTS.USE_AMBIENT_OCCLUSION);
      await persistValue(
        "config",
        "useAmbientOcclusion",
        CONFIG_DEFAULTS.USE_AMBIENT_OCCLUSION,
      );

      gameConfig.useAODebug.set(CONFIG_DEFAULTS.USE_AO_DEBUG);
      await persistValue("config", "useAODebug", CONFIG_DEFAULTS.USE_AO_DEBUG);

      gameConfig.useTimeCycle.set(CONFIG_DEFAULTS.USE_TIME_CYCLE);
      await persistValue(
        "config",
        "useTimeCycle",
        CONFIG_DEFAULTS.USE_TIME_CYCLE,
      );

      gameConfig.useDynamicLighting.set(CONFIG_DEFAULTS.USE_DYNAMIC_LIGHTING);
      await persistValue(
        "config",
        "useDynamicLighting",
        CONFIG_DEFAULTS.USE_DYNAMIC_LIGHTING,
      );

      gameConfig.usePerFaceLighting.set(CONFIG_DEFAULTS.USE_PER_FACE_LIGHTING);
      await persistValue(
        "config",
        "usePerFaceLighting",
        CONFIG_DEFAULTS.USE_PER_FACE_LIGHTING,
      );

      gameConfig.dayLength.set(CONFIG_DEFAULTS.DAY_LENGTH);
      await persistValue("config", "dayLength", CONFIG_DEFAULTS.DAY_LENGTH);

      gameConfig.manualTimeOfDay.set(CONFIG_DEFAULTS.MANUAL_TIME_OF_DAY);
      await persistValue(
        "config",
        "manualTimeOfDay",
        CONFIG_DEFAULTS.MANUAL_TIME_OF_DAY,
      );

      gameConfig.worldRadius.set(CONFIG_DEFAULTS.WORLD_RADIUS);
      await persistValue("config", "worldRadius", CONFIG_DEFAULTS.WORLD_RADIUS);

      gameConfig.viewRadius.set(CONFIG_DEFAULTS.VIEW_RADIUS);
      await persistValue("config", "viewRadius", CONFIG_DEFAULTS.VIEW_RADIUS);

      gameConfig.renderRadius.set(CONFIG_DEFAULTS.RENDER_RADIUS);
      await persistValue(
        "config",
        "renderRadius",
        CONFIG_DEFAULTS.RENDER_RADIUS,
      );

      gameConfig.cacheRadius.set(CONFIG_DEFAULTS.CACHE_RADIUS);
      await persistValue("config", "cacheRadius", CONFIG_DEFAULTS.CACHE_RADIUS);

      gameConfig.terrainOctaves.set(CONFIG_DEFAULTS.TERRAIN_OCTAVES);
      await persistValue(
        "config",
        "terrainOctaves",
        CONFIG_DEFAULTS.TERRAIN_OCTAVES,
      );

      gameConfig.mountainScale.set(CONFIG_DEFAULTS.MOUNTAIN_SCALE);
      await persistValue(
        "config",
        "mountainScale",
        CONFIG_DEFAULTS.MOUNTAIN_SCALE,
      );

      gameConfig.decorationDensity.set(CONFIG_DEFAULTS.DECORATION_DENSITY);
      await persistValue(
        "config",
        "decorationDensity",
        CONFIG_DEFAULTS.DECORATION_DENSITY,
      );

      gameConfig.cloudDensity.set(CONFIG_DEFAULTS.CLOUD_DENSITY);
      await persistValue(
        "config",
        "cloudDensity",
        CONFIG_DEFAULTS.CLOUD_DENSITY,
      );

      gameConfig.caveThreshold.set(CONFIG_DEFAULTS.CAVE_THRESHOLD);
      await persistValue(
        "config",
        "caveThreshold",
        CONFIG_DEFAULTS.CAVE_THRESHOLD,
      );

      gameConfig.useCaves.set(CONFIG_DEFAULTS.USE_CAVES);
      await persistValue("config", "useCaves", CONFIG_DEFAULTS.USE_CAVES);

      showToast(shadow, "Applied Defaults");
    });
  }
}
