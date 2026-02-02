import extrasHandler from "konami-code-js";

import { resizeCanvas } from "../../../api/ui/resizeCanvas.mjs";
import { showToast } from "../../../api/ui/toast.mjs";
import { createSaveState } from "../../../core/createSave.mjs";
import { loadSaveState } from "../../../core/loadSave.mjs";
import {
  selectMaterialBarSlot,
  setMaterialBarItem,
} from "../../../core/systems/game/state.mjs";

import { persistValue } from "../../../core/systems/persistence.mjs";

import { extractJsonFromPng } from "../../../utils/canvasToPngWithState.mjs";
import { showColorCustomizationDialog } from "../../../utils/colors/customColors.mjs";
import { runCompress } from "../../../utils/compression.mjs";
import { copyToClipboard } from "../../../utils/copyToClipboard.mjs";
import { effect } from "../../../utils/effect.mjs";
import { extractAttachments } from "../../../utils/extractAttachments.mjs";
import { placeBlock } from "../../../utils/interaction.mjs";
import { raycastFromCanvasCoords } from "../../../utils/raycastFromCanvasCoords.mjs";
import { processSaveData } from "../../../utils/saveData.mjs";

import { getNewBlockId } from "../../../world/config/blocks.mjs";
import { CONFIG_DEFAULTS } from "../../../world/config/index.mjs";
import { initNewWorld } from "../../../world/generation/world.mjs";

import { showAboutDialog } from "../../dialog/about.mjs";
import { showExamplesDialog } from "../../dialog/examples.mjs";
import { InventoryDialog } from "../../dialog/inventory.mjs";
import { showLinkConfigDialog } from "../../dialog/linkConfiguration.mjs";
import { showPrivacyDialog } from "../../dialog/privacy.mjs";
import {
  autoSaveGame,
  getSaveMode,
  setSaveMode,
  showStorageDialog,
} from "../../dialog/storage.mjs";

import { showTextConfigDialog } from "../../dialog/textConfiguration.mjs";
import { showUrlDialog } from "../../dialog/url.mjs";

import { canControlCanvas } from "../../utils/canControlCanvas.mjs";
import { closeMenus } from "../../utils/closeMenus.mjs";
import {
  startDigHighlight,
  stopDigHighlight,
} from "../../utils/digHighlight.mjs";

import { updateFlightToggleButton } from "../../utils/flightToggle.mjs";
import { handleCornerClick } from "../../utils/handleCornerClick.mjs";
import { handleGenerateButton } from "./handleGenerateButton.mjs";
import { handleRandomSeedButton } from "./handleRandomSeedButton.mjs";
import { initGenerationControlListeners } from "./initGenerationControlListeners.mjs";
import { toggleMaterialBar } from "./materialBar.mjs";
import { randomPlantSeeds } from "./planting.mjs";
import { initRadiusControlListeners } from "./radiusControls.mjs";
import { initResizeObserver } from "./resizeObserver.mjs";
import { initTouchToggle } from "./touchToggle.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/** @typedef {import('../../../core/systems/game/init.mjs').CustomShadowHost} CustomShadowHost */

/**
 * Initializes element event listeners.
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 * @param {Signal.State} currentResolution
 */
export function initElementEventListeners(shadow, cnvs, currentResolution) {
  const gameState = globalThis.blockGarden.state;
  const config = globalThis.blockGarden.config;

  const host =
    /** @type {CustomShadowHost} */
    (shadow.host);

  const inventoryDialog = new InventoryDialog(
    globalThis,
    globalThis.document,
    shadow,
  );

  let lastTouchTime = 0;

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
  initGenerationControlListeners(shadow, cnvs);
  initTouchToggle(shadow);
  initResizeObserver(shadow, currentResolution);

  const material = shadow.querySelector("#material .ui-grid__corner--heading");
  material.addEventListener("click", () => {
    toggleMaterialBar(shadow, gameState, cnvs);
  });

  material.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();

      toggleMaterialBar(shadow, gameState, cnvs);

      // Focus the first material bar slot after opening
      const materialBar = shadow.getElementById("materialBar");
      if (!materialBar.hasAttribute("hidden")) {
        const firstSlot = materialBar.querySelector(".materialBar-slot");
        if (firstSlot) {
          /** @type {HTMLElement} */ (firstSlot).focus();
        }
      }
    }
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
      randomPlantSeeds(shadow);
      showToast(shadow, "Random planting complete!");
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

      const lowercaseKey = e.key.toLowerCase();
      if (lowercaseKey === " ") {
        shadow.getElementById("fly")?.classList.remove("is-pressed");
        shadow.getElementById("jump")?.classList.remove("is-pressed");
      } else if (lowercaseKey === "enter") {
        stopDigHighlight(shadow);
      } else {
        const touchBtn = shadow.querySelector(
          `.touch-btn[data-key="${lowercaseKey}"]`,
        );

        if (touchBtn) {
          touchBtn.classList.remove("is-pressed");
        }
      }
    },
  );

  async function toggleWorldStatePanel() {
    /** @type {HTMLDialogElement} **/
    const seedControls = shadow.querySelector(".seed-controls");

    if (seedControls.hasAttribute("open")) {
      seedControls.close();
    } else {
      seedControls.showModal();

      // Unlock pointer if locked
      if (globalThis.document.pointerLockElement) {
        globalThis.document.exitPointerLock();
      }
    }
  }

  const seedControls = shadow.querySelector(".seed-controls");
  if (seedControls) {
    seedControls.addEventListener("close", async () => {
      setTimeout(() => {
        // re-enable canvas after seed controls closed
        gameState.isCanvasActionDisabled = false;
      }, 300);
    });
  }

  const closeWorldGenerationBtn = shadow.getElementById("closeWorldGeneration");
  if (closeWorldGenerationBtn) {
    closeWorldGenerationBtn.addEventListener("click", () => {
      /** @type {HTMLDialogElement} **/ (
        shadow.querySelector(".seed-controls")
      ).close();

      gameState.isCanvasActionDisabled = true;
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

    shadow.querySelectorAll(".touch-btn").forEach((btn) => {
      btn.classList.remove("is-pressed");
    });

    stopDigHighlight(shadow);
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

      if (lowercaseKey === "escape") {
        closeMenus(shadow, cnvs);
      }

      if (
        lowercaseKey === "backspace" ||
        lowercaseKey === "delete" ||
        lowercaseKey === "tab"
      ) {
        return;
      }

      // Added to activate buttons when pressing space
      if (lowercaseKey === " ") {
        if (e.target instanceof HTMLButtonElement) {
          e.target.click();

          return;
        }
      }

      if (!canControlCanvas(shadow)) {
        return;
      }

      // Add 'S' key to show / hide the world generation panel
      if (lowercaseKey === "s" && e.ctrlKey) {
        e.preventDefault();

        toggleWorldStatePanel();

        return;
      }

      const isInputFocused =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement &&
          e.target.classList.contains("ui-grid__corner--heading"));

      if (isInputFocused) {
        return;
      }

      if (lowercaseKey >= "1" && lowercaseKey <= "9") {
        e.preventDefault();

        const index = parseInt(lowercaseKey) - 1;
        const materialBar = shadow.getElementById("materialBar");
        const isAlreadyOpen = !materialBar.hasAttribute("hidden");

        if (!isAlreadyOpen) {
          toggleMaterialBar(shadow, gameState, cnvs);
        }

        selectMaterialBarSlot(index);

        return;
      }

      if (lowercaseKey === "m") {
        e.preventDefault();

        toggleMaterialBar(shadow, gameState, cnvs);

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

      if (lowercaseKey === "`" || lowercaseKey === "~") {
        e.preventDefault();

        if (e.code === "Backquote" || e.code === "Accent") {
          const nextBlockId = getNewBlockId(
            gameState.curBlock.get(),
            config.blocks,
            !e.shiftKey,
          );

          gameState.curBlock.set(nextBlockId);

          setMaterialBarItem(nextBlockId);
        }
      }

      if (lowercaseKey === " ") {
        const btnId = gameState.flying.get() ? "fly" : "jump";

        shadow.getElementById(btnId)?.classList.add("is-pressed");
      } else if (lowercaseKey === "enter") {
        startDigHighlight(shadow);
      } else {
        const touchBtn = shadow.querySelector(
          `.touch-btn[data-key="${lowercaseKey}"]`,
        );

        if (touchBtn) {
          touchBtn.classList.add("is-pressed");
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
        config.currentResolution.set(newValue);

        await persistValue("config", "currentResolution", newValue);

        resizeCanvas(shadow, config.currentResolution);
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
        if (!config.useSplitControls.get()) {
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

    let hit = gameState.hit;
    const useSplit = config.useSplitControls.get();

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
        gameState.breakingInput.cursorX = e.clientX;
        gameState.breakingInput.cursorY = e.clientY;

        startDigHighlight(shadow);
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

    stopDigHighlight(shadow);
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
    if (!config.useSplitControls.get()) {
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

  const generateBtn = shadow.getElementById("generateWithSeed");
  generateBtn.addEventListener("click", () => handleGenerateButton(shadow));

  const randomBtn = shadow.getElementById("randomSeed");
  randomBtn.addEventListener("click", () => handleRandomSeedButton(shadow));

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
        try {
          JSON.parse(stateJSON);
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

  const applyDefaultPreset = shadow.getElementById("applyDefaultPreset");
  if (applyDefaultPreset) {
    applyDefaultPreset.addEventListener("click", async () => {
      gameState.fastGrowth = false;
      gameState.flying.set(false);

      config.useTouchControls.set(CONFIG_DEFAULTS.USE_TOUCH_CONTROLS);
      await persistValue(
        "config",
        "useTouchControls",
        CONFIG_DEFAULTS.USE_TOUCH_CONTROLS,
      );

      config.useAutoJump.set(CONFIG_DEFAULTS.USE_AUTO_JUMP);
      await persistValue(
        "config",
        "useAutoJump",
        CONFIG_DEFAULTS.USE_AUTO_JUMP,
      );

      config.linkGameSave.set(CONFIG_DEFAULTS.LINK_GAME_SAVE);
      await persistValue(
        "config",
        "linkGameSave",
        CONFIG_DEFAULTS.LINK_GAME_SAVE,
      );

      config.useSplitControls.set(CONFIG_DEFAULTS.USE_SPLIT_CONTROLS);
      await persistValue(
        "config",
        "useSplitControls",
        CONFIG_DEFAULTS.USE_SPLIT_CONTROLS,
      );

      config.currentResolution.set(CONFIG_DEFAULTS.CURRENT_RESOLUTION);
      await persistValue(
        "config",
        "currentResolution",
        CONFIG_DEFAULTS.CURRENT_RESOLUTION,
      );

      config.useBlockHighlight.set(CONFIG_DEFAULTS.USE_BLOCK_HIGHLIGHT);
      await persistValue(
        "config",
        "useBlockHighlight",
        CONFIG_DEFAULTS.USE_BLOCK_HIGHLIGHT,
      );

      config.useDamageAnimation.set(CONFIG_DEFAULTS.USE_DAMAGE_ANIMATION);
      await persistValue(
        "config",
        "useDamageAnimation",
        CONFIG_DEFAULTS.USE_DAMAGE_ANIMATION,
      );

      config.useTextureAtlas.set(CONFIG_DEFAULTS.USE_TEXTURE_ATLAS);
      await persistValue(
        "config",
        "useTextureAtlas",
        CONFIG_DEFAULTS.USE_TEXTURE_ATLAS,
      );

      config.useAmbientOcclusion.set(CONFIG_DEFAULTS.USE_AMBIENT_OCCLUSION);
      await persistValue(
        "config",
        "useAmbientOcclusion",
        CONFIG_DEFAULTS.USE_AMBIENT_OCCLUSION,
      );

      config.useAODebug.set(CONFIG_DEFAULTS.USE_AO_DEBUG);
      await persistValue("config", "useAODebug", CONFIG_DEFAULTS.USE_AO_DEBUG);

      config.useTimeCycle.set(CONFIG_DEFAULTS.USE_TIME_CYCLE);
      await persistValue(
        "config",
        "useTimeCycle",
        CONFIG_DEFAULTS.USE_TIME_CYCLE,
      );

      config.useDynamicLighting.set(CONFIG_DEFAULTS.USE_DYNAMIC_LIGHTING);
      await persistValue(
        "config",
        "useDynamicLighting",
        CONFIG_DEFAULTS.USE_DYNAMIC_LIGHTING,
      );

      config.usePerFaceLighting.set(CONFIG_DEFAULTS.USE_PER_FACE_LIGHTING);
      await persistValue(
        "config",
        "usePerFaceLighting",
        CONFIG_DEFAULTS.USE_PER_FACE_LIGHTING,
      );

      config.dayLength.set(CONFIG_DEFAULTS.DAY_LENGTH);
      await persistValue("config", "dayLength", CONFIG_DEFAULTS.DAY_LENGTH);

      config.manualTimeOfDay.set(CONFIG_DEFAULTS.MANUAL_TIME_OF_DAY);
      await persistValue(
        "config",
        "manualTimeOfDay",
        CONFIG_DEFAULTS.MANUAL_TIME_OF_DAY,
      );

      config.worldRadius.set(CONFIG_DEFAULTS.WORLD_RADIUS);
      await persistValue("config", "worldRadius", CONFIG_DEFAULTS.WORLD_RADIUS);

      config.viewRadius.set(CONFIG_DEFAULTS.VIEW_RADIUS);
      await persistValue("config", "viewRadius", CONFIG_DEFAULTS.VIEW_RADIUS);

      config.renderRadius.set(CONFIG_DEFAULTS.RENDER_RADIUS);
      await persistValue(
        "config",
        "renderRadius",
        CONFIG_DEFAULTS.RENDER_RADIUS,
      );

      config.cacheRadius.set(CONFIG_DEFAULTS.CACHE_RADIUS);
      await persistValue("config", "cacheRadius", CONFIG_DEFAULTS.CACHE_RADIUS);

      config.terrainOctaves.set(CONFIG_DEFAULTS.TERRAIN_OCTAVES);
      await persistValue(
        "config",
        "terrainOctaves",
        CONFIG_DEFAULTS.TERRAIN_OCTAVES,
      );

      config.mountainScale.set(CONFIG_DEFAULTS.MOUNTAIN_SCALE);
      await persistValue(
        "config",
        "mountainScale",
        CONFIG_DEFAULTS.MOUNTAIN_SCALE,
      );

      config.decorationDensity.set(CONFIG_DEFAULTS.DECORATION_DENSITY);
      await persistValue(
        "config",
        "decorationDensity",
        CONFIG_DEFAULTS.DECORATION_DENSITY,
      );

      config.cloudDensity.set(CONFIG_DEFAULTS.CLOUD_DENSITY);
      await persistValue(
        "config",
        "cloudDensity",
        CONFIG_DEFAULTS.CLOUD_DENSITY,
      );

      config.caveThreshold.set(CONFIG_DEFAULTS.CAVE_THRESHOLD);
      await persistValue(
        "config",
        "caveThreshold",
        CONFIG_DEFAULTS.CAVE_THRESHOLD,
      );

      config.useCaves.set(CONFIG_DEFAULTS.USE_CAVES);
      await persistValue("config", "useCaves", CONFIG_DEFAULTS.USE_CAVES);

      showToast(shadow, "Applied Defaults");
      closeMenus(shadow, cnvs);
    });
  }
}
