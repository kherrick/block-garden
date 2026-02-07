import localForage from "localforage";

import {
  deleteSharedSave,
  retrieveSharedSave,
} from "../../core/shareTarget.mjs";

/**
 * @typedef {import('../../api/BlockGarden.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis
 */

import { createSaveState } from "../../core/createSave.mjs";
import { loadSaveState } from "../../core/loadSave.mjs";

import {
  canvasToPngWithState,
  extractJsonFromPng,
} from "../../utils/canvasToPngWithState.mjs";

import { arrayBufferToBase64, base64toBlob } from "../../utils/conversion.mjs";

import { compressToBinaryBlob } from "../../utils/compression.mjs";
import { extractAttachments } from "../../utils/extractAttachments.mjs";
import { formatName } from "../../utils/formatWorldName.mjs";
import { getDateTime } from "../../utils/getDateTime.mjs";
import { getGameSaveUrlParam } from "../../utils/urlParams.mjs";
import { getShadowRoot } from "../utils/getShadowRoot.mjs";
import { processSaveData } from "../../utils/saveData.mjs";
import { showToast } from "../../api/ui/toast.mjs";

const TIME_SECONDS_ONE = 1000;
const TIME_MINUTES_ONE = 1 * 60 * TIME_SECONDS_ONE;

export const AUTO_SAVE_INTERVAL = TIME_MINUTES_ONE;

const AUTO_SAVE_THROTTLE = AUTO_SAVE_INTERVAL / 2;

const AUTO_SAVE_KEY = "block-garden-autosave";
const SAVE_MODE_KEY = "block-garden-autosave-mode";

const STORAGE_KEY_PREFIX = "block-garden-save-";

/**
 * @typedef {Object} GameData
 *
 * @property {string} name
 * @property {number} timestamp
 * @property {string} data
 * @property {boolean} [isAutoSave]
 */

/**
 * @typedef {Object} SharedSaveData
 *
 * @property {string} data
 * @property {number} timestamp
 * @property {string} [type]
 * @property {string} [contents]
 */

/**
 * @typedef {Object} SavedGame
 *
 * @property {string} key
 * @property {string} name
 * @property {number} timestamp
 * @property {string} data
 * @property {boolean} [isAutoSave]
 */

/**
 * Get current save mode
 *
 * @returns {Promise<string>}
 */
export async function getSaveMode() {
  try {
    const mode = await localForage.getItem(SAVE_MODE_KEY);

    return mode;
  } catch (error) {
    console.info("Failed to get save mode:", error);

    return "manual";
  }
}

/**
 * Set save mode
 *
 * @param {string} mode
 *
 * @returns {Promise<void>}
 */
export async function setSaveMode(mode) {
  try {
    await localForage.setItem(SAVE_MODE_KEY, mode);

    console.info("Save mode set to:", mode);
  } catch (error) {
    console.info("Failed to set save mode:", error);
  }
}

// Track last auto save timestamp
let lastAutoSaveTime = 0;

/**
 * Auto save functionality
 *
 * @param {BlockGardenGlobalThis} globalThis
 *
 * @returns {Promise<void>}
 */
export async function autoSaveGame(globalThis) {
  try {
    // Check if auto save is enabled
    const saveMode = await getSaveMode();

    if (saveMode !== "auto") {
      return;
    }

    const now = Date.now();

    // Check if we saved within the last 30 seconds
    if (now - lastAutoSaveTime < AUTO_SAVE_THROTTLE) {
      console.info("Auto save skipped (too soon since last save)");

      return;
    }

    // Create save state
    const bg = globalThis;
    const saveState = createSaveState(bg.blockGarden.state.world, bg);
    const stateJSON = JSON.stringify(saveState);

    // Compress to binary blob
    const compressedBlob = await compressToBinaryBlob(stateJSON);

    if (!compressedBlob) {
      throw new Error("Failed to compress data");
    }

    // Convert to base64
    const arrayBuffer = await compressedBlob.arrayBuffer();
    const base64Data = arrayBufferToBase64(globalThis, arrayBuffer);

    const gameData = {
      name: "[Auto Save]",
      timestamp: Date.now(),
      data: base64Data,
      isAutoSave: true,
    };

    await localForage.setItem(AUTO_SAVE_KEY, gameData);

    lastAutoSaveTime = now; // Update last save time

    console.info("Game auto saved successfully");
  } catch (error) {
    console.error("Failed to auto save game:", error);
  }
}

/**
 * Check for auto save on load
 *
 * @param {BlockGardenGlobalThis} globalThis
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<boolean>}
 */
export async function checkAutoSave(globalThis, shadow) {
  try {
    /** @type {GameData | null} */
    const autoSave = await localForage.getItem(AUTO_SAVE_KEY);
    const isAutoSaveEnabled =
      (await localForage.getItem(SAVE_MODE_KEY)) === "auto";

    if (!autoSave || !isAutoSaveEnabled) {
      return false;
    }

    // Create and show auto save dialog
    const dialog = globalThis.document.createElement("dialog");
    dialog.style.cssText = `
      background: var(--bg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--bg-color-gray-900);
      color: var(--bg-color-gray-900);
      font-family: monospace;
      padding: 1.25rem;
      max-width: 25rem;
      z-index: 10000;
    `;

    const timestamp = new Date(autoSave.timestamp).toLocaleString();
    dialog.innerHTML = `
      <h3 style="margin: 0 0 1rem 0">Auto Save Detected</h3>
      <p style="margin: 0 0 1rem 0">
        A saved game from ${timestamp} was found. Would you like to load it?
      </p>
      <div style="display: flex; gap: 0.625rem; justify-content: flex-end">
        <style>
          button {
            border-radius: 0.25rem;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.5rem 0.9375rem;
          }

          button:disabled, button[disabled] {
            cursor: not-allowed;
          }
        </style>
        <button
          autofocus
          id="autoSaveNo"
          style="background: var(--bg-color-red-500);">No</button>
        <button
          id="autoSaveYes"
          style="background: var(--bg-color-green-500);">Yes</button>
      </div>
    `;

    shadow.append(dialog);

    dialog.showModal();

    const autofocusElement = dialog.querySelector("[autofocus]");
    if (autofocusElement instanceof HTMLElement) {
      autofocusElement.focus();
    }

    return new Promise((resolve) => {
      const autoSaveNo = dialog.querySelector("#autoSaveNo");
      const autoSaveYes = dialog.querySelector("#autoSaveYes");

      if (autoSaveYes) {
        autoSaveYes.addEventListener("click", async () => {
          if (autoSaveNo) {
            autoSaveNo.setAttribute("disabled", "disabled");
          }
          autoSaveYes.setAttribute("disabled", "disabled");

          try {
            const compressedBlob = base64toBlob(
              globalThis,
              autoSave.data,
              "application/gzip",
            );

            // Decompress
            let stateJSON;

            if ("DecompressionStream" in globalThis) {
              const decompressedStream = compressedBlob
                .stream()
                .pipeThrough(new globalThis.DecompressionStream("gzip"));

              const decompressedBlob = await new globalThis.Response(
                decompressedStream,
              ).blob();

              stateJSON = await decompressedBlob.text();
            } else {
              throw new Error("DecompressionStream not supported");
            }

            // Parse and load save state
            const saveState = JSON.parse(stateJSON);

            const loaded = await loadSaveState(globalThis, shadow, saveState);

            if (!loaded) {
              showToast(
                shadow,
                "Oops! This auto-save appears to be broken. Continuing with normal load...",
                { stack: true, useSingle: false, duration: 5000 },
              );

              dialog.close();
              dialog.remove();

              resolve(false);

              return;
            }

            const seedInput = shadow.getElementById("worldSeedInput");
            const currentSeedDisplay = shadow.getElementById("currentSeed");

            const bg = globalThis;

            if (seedInput instanceof HTMLInputElement) {
              seedInput.value = bg.blockGarden.state.seed.toString();
            }

            if (currentSeedDisplay) {
              currentSeedDisplay.textContent =
                bg.blockGarden.state.seed.toString();
            }

            console.log("Auto save loaded successfully");
          } catch (error) {
            console.error("Failed to load auto save:", error);
            showToast(shadow, "Oops! Failed to load auto-save. Continuing...", {
              stack: true,
              useSingle: false,
              duration: 5000,
            });

            dialog.close();
            dialog.remove();

            resolve(false);

            return;
          }

          dialog.close();
          dialog.remove();

          resolve(true);
        });
      }

      if (autoSaveNo) {
        autoSaveNo.addEventListener("click", () => {
          autoSaveNo.setAttribute("disabled", "disabled");
          if (autoSaveYes) {
            autoSaveYes.setAttribute("disabled", "disabled");
          }

          dialog.close();
          dialog.remove();

          resolve(false);
        });
      }

      dialog.addEventListener("cancel", () => {
        resolve(false);
      });
    });
  } catch (error) {
    console.error("Failed to check for auto save:", error);

    return false;
  }
}

/**
 * Check for and load shared saves from Web Share Target API
 *
 * Displays a dialog asking user to load the shared save
 *
 * @param {BlockGardenGlobalThis} globalThis
 *
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<boolean>} - true if a shared save was loaded, false otherwise
 */
export async function checkSharedSave(globalThis, shadow) {
  try {
    const sharedSaveData = await retrieveSharedSave();

    /** @type {any} */
    const sharedSave = sharedSaveData;

    if (!sharedSave || !sharedSave.data) {
      return false;
    }

    // Create and show shared save dialog
    const dialog = globalThis.document.createElement("dialog");
    dialog.style.cssText = `
      background: var(--bg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--bg-color-gray-900);
      color: var(--bg-color-gray-900);
      font-family: monospace;
      padding: 1.25rem;
      max-width: 25rem;
      z-index: 10000;
    `;

    const timestamp = new Date(sharedSave.timestamp).toLocaleString();
    dialog.innerHTML = `
      <h3 style="margin: 0 0 1rem 0">Shared Game Save</h3>
      <p style="margin: 0 0 1rem 0">
        A game save was shared with you (${timestamp}). Would you like to load it?
      </p>
      <div style="display: flex; gap: 0.625rem; justify-content: flex-end">
        <button id="sharedSaveNo" autofocus="autofocus" style="
          background: var(--bg-color-red-500);
          border-radius: 0.25rem;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem 0.9375rem;
        ">No</button>
        <button id="sharedSaveYes" style="
          background: var(--bg-color-green-500);
          border-radius: 0.25rem;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem 0.9375rem;
        ">Yes</button>
      </div>
    `;

    shadow.append(dialog);

    dialog.showModal();

    const autofocusElement = dialog.querySelector("[autofocus]");
    if (autofocusElement instanceof HTMLElement) {
      autofocusElement.focus();
    }

    return new Promise((resolve) => {
      const sharedSaveYes = dialog.querySelector("#sharedSaveYes");
      if (!sharedSaveYes) {
        resolve(false);
        return;
      }

      sharedSaveYes.addEventListener("click", async () => {
        try {
          let saveState = sharedSave.data;

          const loaded = await loadSaveState(globalThis, shadow, saveState);

          if (!loaded) {
            showToast(
              shadow,
              "Oops! This shared save appears to be broken. Continuing with normal load...",
              { stack: true, useSingle: false, duration: 5000 },
            );

            dialog.close();
            dialog.remove();

            resolve(false);

            return;
          }

          // handle loading pdfs
          if (saveState?.type === "pdf") {
            const blob = base64toBlob(
              globalThis,
              saveState.contents,
              "application/pdf",
            );

            const [results] = await extractAttachments(
              new File([blob], "block-garden-game-card.png"),
            );

            saveState = JSON.parse(
              await extractJsonFromPng(new Blob([results.data])),
            );
          }

          const { seed } = saveState.config || {};
          const seedInput = shadow.getElementById("worldSeedInput");
          const currentSeedDisplay = shadow.getElementById("currentSeed");

          if (seedInput instanceof HTMLInputElement) {
            seedInput.value = seed;
          }

          if (currentSeedDisplay) {
            currentSeedDisplay.textContent = seed;
          }

          // Delete the shared save after loading it
          await deleteSharedSave();

          console.log("Shared save loaded successfully");
        } catch (error) {
          console.error("Failed to load shared save:", error);
          showToast(shadow, "Oops! Failed to load shared save. Continuing...", {
            stack: true,
            useSingle: false,
            duration: 5000,
          });

          dialog.close();
          dialog.remove();

          resolve(false);

          return;
        }

        dialog.close();
        dialog.remove();
        resolve(true);
      });

      const sharedSaveNo = dialog.querySelector("#sharedSaveNo");
      if (!sharedSaveNo) {
        return;
      }

      sharedSaveNo.addEventListener("click", async () => {
        // Delete the shared save if user declines
        await deleteSharedSave();

        dialog.close();
        dialog.remove();

        resolve(false);
      });

      dialog.addEventListener("cancel", async () => {
        // Delete the shared save if dialog is cancelled
        await deleteSharedSave();

        resolve(false);
      });
    });
  } catch (error) {
    console.error("Failed to check for shared save:", error);

    return false;
  }
}

/**
 * Check for and automatically load a game save from the `gameSave` URL parameter.
 *
 * Shows a toast on failure and updates the UI seed display on success.
 *
 * @param {BlockGardenGlobalThis} globalThis
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<boolean>} True if a URL save was successfully loaded, false otherwise.
 */
export async function checkUrlSave(globalThis, shadow) {
  try {
    const gameSaveUrl = getGameSaveUrlParam(globalThis);

    if (!gameSaveUrl) {
      return false;
    }

    try {
      const response = await fetch(gameSaveUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${response.statusText}`);
      }

      const blob = await response.blob();
      const filename = gameSaveUrl.split("/").pop() || "save.bgs";

      const stateJSON = await processSaveData(blob, filename, globalThis);
      const saveState = JSON.parse(stateJSON);

      const loaded = await loadSaveState(globalThis, shadow, saveState);

      if (!loaded) {
        showToast(
          shadow,
          "Oops! This URL save state appears to be broken. Continuing with normal load...",
          { stack: true, useSingle: false, duration: 5000 },
        );

        return false;
      }

      const seedInput = shadow.getElementById("worldSeedInput");
      const currentSeedDisplay = shadow.getElementById("currentSeed");

      const bg = globalThis;

      if (seedInput instanceof HTMLInputElement) {
        seedInput.value = bg.blockGarden.state.seed.toString();
      }

      if (currentSeedDisplay) {
        currentSeedDisplay.textContent = bg.blockGarden.state.seed.toString();
      }

      console.log("URL save loaded successfully");

      return true;
    } catch (error) {
      console.error("Failed to load URL save:", error);
      showToast(shadow, "Oops! Failed to load URL save. Continuing...", {
        stack: true,
        useSingle: false,
        duration: 5000,
      });

      return false;
    }
  } catch (error) {
    console.error("Failed to check for URL save:", error);

    return false;
  }
}

/**
 * Create and manage the storage dialog
 */
export class StorageDialog {
  /**
   * @param {BlockGardenGlobalThis} globalThis - The global context.
   * @param {Document} doc - The document associated with the app.
   * @param {ShadowRoot} shadow - The shadow root whose host's computed styles will be inspected.
   */
  constructor(globalThis, doc, shadow) {
    /** @type {BlockGardenGlobalThis} */
    this.gThis = globalThis;
    /** @type {Document} */
    this.doc = doc;
    /** @type {ShadowRoot} */
    this.shadow = shadow;
    /** @type {HTMLDialogElement | null} */
    this.dialog = null;
    /** @type {SavedGame[]} */
    this.savedGames = [];

    // @ts-ignore - Methods are defined later in the class
    this.close = /** @type {StorageDialog} */ (this).close.bind(this);
    // @ts-ignore
    this.deleteSelectedGame = /** @type {StorageDialog} */ (
      this
    ).deleteSelectedGame.bind(this);
    // @ts-ignore
    this.getPDFGameStateAttachment = /** @type {StorageDialog} */ (
      this
    ).getPDFGameStateAttachment.bind(this);
    // @ts-ignore
    this.getSelectedGameAsPNG = /** @type {StorageDialog} */ (
      this
    ).getSelectedGameAsPNG.bind(this);
    // @ts-ignore
    this.handleDragLeave = /** @type {StorageDialog} */ (
      this
    ).handleDragLeave.bind(this);
    // @ts-ignore
    this.handleDragOver = /** @type {StorageDialog} */ (
      this
    ).handleDragOver.bind(this);
    // @ts-ignore
    this.handleFileDrop = /** @type {StorageDialog} */ (
      this
    ).handleFileDrop.bind(this);
    // @ts-ignore
    this.handleFileSelect = /** @type {StorageDialog} */ (
      this
    ).handleFileSelect.bind(this);
    // @ts-ignore
    this.handleWorldNameInput = /** @type {StorageDialog} */ (
      this
    ).handleWorldNameInput.bind(this);
    // @ts-ignore
    this.loadSelectedGame = /** @type {StorageDialog} */ (
      this
    ).loadSelectedGame.bind(this);
    // @ts-ignore
    this.saveCurrentGame = /** @type {StorageDialog} */ (
      this
    ).saveCurrentGame.bind(this);
    // @ts-ignore
    this.shareSelectedGame = /** @type {StorageDialog} */ (
      this
    ).shareSelectedGame.bind(this);
    // @ts-ignore
    this.shareSelectedGameAsPDF = /** @type {StorageDialog} */ (
      this
    ).shareSelectedGameAsPDF.bind(this);
  }

  /**
   * @returns {Promise<HTMLDialogElement>}
   */
  async createDialog() {
    const existingDialog = /** @type {HTMLDialogElement | null} */ (
      this.shadow.getElementById("storageDialog")
    );

    if (existingDialog) {
      existingDialog.remove();
    }

    if (this.dialog) {
      this.dialog.remove();
    }

    const dialog = this.doc.createElement("dialog");
    dialog.setAttribute("id", "storageDialog");
    dialog.style.cssText = `
      background: var(--bg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--bg-color-gray-900);
      color: var(--bg-color-gray-900);
      font-family: monospace;
      max-height: 80vh;
      max-width: 31.25rem;
      overflow-y: auto;
      padding: 1.25rem;
      width: 90%;
    `;

    dialog.innerHTML = `
      <div
        style="
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.9375rem;
        "
      >
        <h3 style="margin: 0">Game Storage</h3>
        <button
          id="closeStorageDialog"
          autofocus
          style="
            background: var(--bg-color-red-500);
            border-radius: 0.25rem;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.3125rem 0.625rem;
          "
        >
          &times;
        </button>
      </div>

      <div style="margin-bottom: 1.25rem">
        <h4 style="margin: 0.625rem 0">Save Current Game</h4>
        <div
          style="
            align-items: center;
            display: flex;
            gap: 0.625rem;
            margin-bottom: 0.625rem;
          "
        >
          <input
            type="text"
            id="worldNameInput"
            placeholder="Enter world name..."
            style="
              border-radius: 0.25rem;
              border: 0.0625rem solid var(--bg-color-gray-500);
              flex: 1;
              padding: 0.3125rem;
            "
          />
          <button
            id="saveToStorageBtn"
            style="
              background: var(--bg-color-green-500);
              border-radius: 0.25rem;
              border: none;
              color: white;
              cursor: pointer;
              padding: 0.5rem 0.9375rem;
            "
          >
            Save
          </button>
        </div>
      </div>

      <div>
        <h4 style="margin: 0.625rem 0">Saved Games in Storage</h4>
        <div
          id="gameDropZone"
          style="
            border: 0.0625rem dashed var(--bg-color-gray-400);
            border-radius: 0.25rem;
            position: relative;
            transition: all 0.2s ease;
            padding: 0;
          "
        >
          <div
            id="savedGamesList"
            style="
              border: 0.0625rem solid var(--bg-color-gray-400);
              border-radius: 0.25rem;
              max-height: 18.75rem;
              overflow-y: auto;
            "
          >
            <!-- Saved games will be populated here -->
          </div>
          <input
            id="fileInput"
            type="file"
            accept=".bgs,.pdf,.txt,text/plain,application/pdf,application/gzip,application/*"
            style="display: none"
            multiple
          />
        </div>
        <div style="margin-top: 0.625rem; display: flex; gap: 0.625rem">
          <button
            id="deleteSelectedBtn"
            disabled
            style="
              background: var(--bg-color-red-500);
              border-radius: 0.25rem;
              border: none;
              color: white;
              cursor: pointer;
              padding: 0.5rem 0.9375rem;
            "
          >
            Delete Selected
          </button>
          <button
            id="shareSelectedBtn"
            disabled
            hidden
            style="
              background: var(--bg-color-medium-purple);
              border-radius: 0.25rem;
              border: none;
              color: white;
              cursor: pointer;
              padding: 0.5rem 0.9375rem;
            "
          >
            Share Selected
          </button>
          <button
            id="shareSelectedAsPdfBtn"
            disabled
            hidden
            style="
              background: var(--bg-color-medium-purple);
              border-radius: 0.25rem;
              border: none;
              color: white;
              cursor: pointer;
              padding: 0.5rem 0.9375rem;
            "
          >
            Share Selected As PDF
          </button>
          <button
            id="loadSelectedBtn"
            disabled
            style="
              background: var(--bg-color-blue-500);
              border-radius: 0.25rem;
              border: none;
              color: white;
              cursor: pointer;
              padding: 0.5rem 0.9375rem;
            "
          >
            Load Selected
          </button>
        </div>
      </div>
    `;

    this.shadow.append(dialog);
    this.dialog = dialog;

    await this.loadSavedGamesList();

    this.initEventListeners();
    this.updateButtonStates();

    return dialog;
  }

  /** @returns {Promise<void>} */
  async loadSavedGamesList() {
    this.savedGames = [];

    const keys = await localForage.keys();

    // Load auto save first
    const autoSave = await localForage.getItem(AUTO_SAVE_KEY);

    if (autoSave) {
      this.savedGames.push({
        key: AUTO_SAVE_KEY,
        name: autoSave.name,
        timestamp: autoSave.timestamp,
        data: autoSave.data,
        isAutoSave: true,
      });
    }

    // Load regular saves
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const gameData = await localForage.getItem(key);

        if (gameData) {
          this.savedGames.push({
            key,
            name: gameData.name,
            timestamp: gameData.timestamp,
            data: gameData.data,
            isAutoSave: gameData.isAutoSave || false,
          });
        }
      }
    }

    // Sort by timestamp (newest first)
    this.savedGames.sort((a, b) => b.timestamp - a.timestamp);

    this.renderSavedGamesList();
  }

  /**
   * @returns {void}
   */
  renderSavedGamesList() {
    if (!this.dialog) {
      return;
    }

    const listContainer = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#savedGamesList")
    );

    if (!listContainer) {
      return;
    }

    if (this.savedGames.length === 0) {
      listContainer.innerHTML = `
      <div style="padding: 1.25rem; text-align: center; color: var(--bg-color-neutral-950);">
        No saved games found
      </div>
    `;

      return;
    }

    const html = this.savedGames
      .map(
        (game, index) => `
        <div
          class="saved-game-item"
          data-index="${index}"
          style="
            padding: 0.625rem;
            border-bottom: 0.0625rem solid var(--bg-color-gray-100);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            ${game.isAutoSave ? "background: var(--bg-color-blue-50);" : ""}
          "
        >
          <div>
            <div style="font-weight: bold; ${game.isAutoSave ? "color: var(--bg-color-blue-700);" : ""}">${game.name}</div>
            <div style="font-size: 0.75rem; color: var(--bg-color-neutral-950);">
              ${new Date(game.timestamp).toLocaleString()}
            </div>
          </div>
          <input
            tabindex="0"
            name="selectedGame"
            style="margin-left: 0.625rem"
            type="radio"
            value="${index}"
          />
        </div>
    `,
      )
      .join("");

    listContainer.innerHTML = html;

    // Add click handlers for game selection
    listContainer.querySelectorAll(".saved-game-item").forEach((item) => {
      item.addEventListener(
        "keydown",
        /** @param {Event} evt */ (evt) => {
          if (!(evt instanceof KeyboardEvent)) {
            return;
          }

          if (
            evt.target instanceof HTMLElement &&
            evt.target.getAttribute("type") === "radio" &&
            evt.key.toLowerCase() === "enter"
          ) {
            this.loadSelectedGame();
          }
        },
      );

      item.addEventListener("click", (e) => {
        if (
          e.target instanceof HTMLElement &&
          e.target.getAttribute("type") !== "radio"
        ) {
          const radio = item.querySelector('input[type="radio"]');
          if (radio instanceof HTMLInputElement) {
            radio.checked = true;
          }

          this.updateButtonStates();
        }
      });
    });

    listContainer.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", () => this.updateButtonStates());
    });
  }

  /**
   * @returns {void}
   */
  updateButtonStates() {
    if (!this.dialog) {
      return;
    }

    const selected = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector('input[name="selectedGame"]:checked')
    );

    const isSelected = !!selected;

    const loadBtn = this.dialog.querySelector("#loadSelectedBtn");
    if (loadBtn instanceof HTMLButtonElement) {
      loadBtn.disabled = !isSelected;
      loadBtn.style.opacity = isSelected ? "1" : "0.5";
      loadBtn.style.cursor = isSelected ? "pointer" : "not-allowed";
    }

    const deleteBtn = this.dialog.querySelector("#deleteSelectedBtn");
    if (deleteBtn instanceof HTMLButtonElement) {
      deleteBtn.disabled = !isSelected;
      deleteBtn.style.opacity = isSelected ? "1" : "0.5";
      deleteBtn.style.cursor = isSelected ? "pointer" : "not-allowed";
    }

    // Check if Web Share API supports files and enable/disable share button accordingly
    const shareBtn = this.dialog.querySelector("#shareSelectedBtn");
    const shareAsPdfBtn = this.dialog.querySelector("#shareSelectedAsPdfBtn");

    if (
      shareBtn instanceof HTMLButtonElement &&
      shareAsPdfBtn instanceof HTMLButtonElement
    ) {
      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare !== "undefined";

      let canShare = false;
      if (canShareFiles) {
        // Test if we can actually share files
        try {
          const testFile = new File([], "test");
          canShare = navigator.canShare({ files: [testFile] });

          shareBtn.disabled = !isSelected;
          shareBtn.style.opacity = canShare ? "1" : "0.5";
          shareBtn.style.cursor = canShare ? "pointer" : "not-allowed";
          shareAsPdfBtn.disabled = !isSelected;
          shareAsPdfBtn.style.opacity = canShare ? "1" : "0.5";
          shareAsPdfBtn.style.cursor = canShare ? "pointer" : "not-allowed";
        } catch {
          shareBtn.disabled = true;
          shareBtn.setAttribute("hidden", "hidden");
          shareBtn.style.opacity = "0.5";
          shareBtn.style.cursor = "not-allowed";
          shareAsPdfBtn.disabled = true;
          shareAsPdfBtn.setAttribute("hidden", "hidden");
          shareAsPdfBtn.style.opacity = "0.5";
          shareAsPdfBtn.style.cursor = "not-allowed";
        }
      } else {
        shareBtn.disabled = true;
        shareBtn.setAttribute("hidden", "hidden");
        shareBtn.style.opacity = "0.5";
        shareBtn.style.cursor = "not-allowed";
        shareAsPdfBtn.disabled = true;
        shareAsPdfBtn.setAttribute("hidden", "hidden");
        shareAsPdfBtn.style.opacity = "0.5";
        shareAsPdfBtn.style.cursor = "not-allowed";
      }

      if (canShare) {
        shareBtn.removeAttribute("hidden");

        const bg = /** @type {BlockGardenGlobalThis} */ (this.gThis);
        if (bg.blockGarden.state.hasEnabledExtras.get()) {
          shareAsPdfBtn.removeAttribute("hidden");
        }
      }
    }
  }

  /**
   * @param {KeyboardEvent} e
   *
   * @returns {void}
   */
  handleWorldNameInput(e) {
    const regex = /^[\p{L}\p{N}\p{P}\s]+$/u;

    // Keep input in the input dialog for now
    if (regex.test(e.key)) {
      e.stopPropagation();
    }

    if (e.key === "Enter") {
      this.saveCurrentGame();
    }
  }

  /**
   * @returns {void}
   */
  initEventListeners() {
    if (!this.dialog) {
      return;
    }

    const closeBtn = /** @type {HTMLButtonElement | null} */ (
      this.dialog.querySelector("#closeStorageDialog")
    );
    const saveBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#saveToStorageBtn")
    );
    const loadBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#loadSelectedBtn")
    );
    const deleteBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#deleteSelectedBtn")
    );
    const shareBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#shareSelectedBtn")
    );
    const shareAsPdfBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#shareSelectedAsPdfBtn")
    );
    const worldNameInput = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector("#worldNameInput")
    );
    const gameDropZone = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#gameDropZone")
    );
    const fileInput = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector("#fileInput")
    );

    if (closeBtn) {
      closeBtn.addEventListener("click", this.close);
    }
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveCurrentGame());
    }
    if (loadBtn) {
      loadBtn.addEventListener("click", () => this.loadSelectedGame());
    }
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => this.deleteSelectedGame());
    }
    if (shareBtn) {
      shareBtn.addEventListener("click", () => this.shareSelectedGame());
    }
    if (shareAsPdfBtn) {
      shareAsPdfBtn.addEventListener("click", () =>
        this.shareSelectedGameAsPDF(),
      );
    }
    if (worldNameInput) {
      worldNameInput.addEventListener("keydown", (e) =>
        this.handleWorldNameInput(e),
      );
    }

    // Drag and drop for file upload
    if (gameDropZone) {
      gameDropZone.addEventListener("dragover", (e) => this.handleDragOver(e));
      gameDropZone.addEventListener("dragleave", (e) =>
        this.handleDragLeave(e),
      );
      gameDropZone.addEventListener("drop", (e) => this.handleFileDrop(e));
    }

    // File input change event
    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    }
  }

  /** @returns {void} */
  removeEventListeners() {
    if (!this.dialog) return;

    const closeBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#closeStorageDialog")
    );
    const saveBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#saveToStorageBtn")
    );
    const loadBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#loadSelectedBtn")
    );
    const deleteBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#deleteSelectedBtn")
    );
    const shareBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#shareSelectedBtn")
    );
    const shareAsPDFBtn = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#shareSelectedAsPdfBtn")
    );
    const worldNameInput = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector("#worldNameInput")
    );
    const gameDropZone = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#gameDropZone")
    );
    const fileInput = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector("#fileInput")
    );

    closeBtn?.removeEventListener("click", this.close);
    saveBtn?.removeEventListener("click", this.saveCurrentGame);
    loadBtn?.removeEventListener("click", this.loadSelectedGame);
    deleteBtn?.removeEventListener("click", this.deleteSelectedGame);
    shareBtn?.removeEventListener("click", this.shareSelectedGame);
    shareAsPDFBtn?.removeEventListener("click", this.shareSelectedGameAsPDF);
    worldNameInput?.removeEventListener("keydown", this.handleWorldNameInput);

    // Drag and drop
    gameDropZone?.removeEventListener("dragover", this.handleDragOver);
    gameDropZone?.removeEventListener("dragleave", this.handleDragLeave);
    gameDropZone?.removeEventListener("drop", this.handleFileDrop);

    // File input
    fileInput?.removeEventListener("change", this.handleFileSelect);
  }

  /**
   * @param {DragEvent} e
   * @returns {void}
   */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.dialog) {
      return;
    }

    const gameDropZone = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#gameDropZone")
    );
    if (gameDropZone instanceof HTMLElement) {
      gameDropZone.style.borderColor = "var(--bg-color-blue-500)";
      gameDropZone.style.backgroundColor = "rgba(100, 200, 255, 0.1)";
    }
  }

  /**
   * @param {DragEvent} e
   * @returns {void}
   */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.dialog) {
      return;
    }

    const gameDropZone = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#gameDropZone")
    );
    if (gameDropZone instanceof HTMLElement) {
      gameDropZone.style.borderColor = "var(--bg-color-gray-400)";
      gameDropZone.style.backgroundColor = "";
    }
  }

  /**
   * @param {DragEvent} e
   * @returns {void}
   */
  handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.dialog) {
      return;
    }

    const gameDropZone = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#gameDropZone")
    );
    if (gameDropZone instanceof HTMLElement) {
      gameDropZone.style.borderColor = "var(--bg-color-gray-400)";
      gameDropZone.style.backgroundColor = "";
    }

    const files = e.dataTransfer?.files;
    if (files) {
      this.processFiles(files);
    }
  }

  /** @returns {void} */
  handleFileSelect(/** @type {Event} */ e) {
    const target = /** @type {HTMLInputElement | null} */ (e.target);
    const files = target?.files;
    if (files) {
      this.processFiles(files);
    }
  }

  /**
   * Process dropped or selected files
   *
   * @param {FileList} files
   *
   * @returns {Promise<void>}
   */
  async processFiles(files) {
    for (const file of files) {
      if (
        !file.name.endsWith(".bgs") &&
        !file.name.endsWith(".txt") &&
        !file.name.endsWith(".pdf")
      ) {
        console.warn(`Skipping file ${file.name}: invalid extension`);

        continue;
      }

      try {
        const fileContent = await file.arrayBuffer();

        await this.loadGameFromFile(fileContent, file.name);
      } catch (error) {
        console.error(`Failed to load file ${file.name}:`, error);

        alert(`Failed to load file: ${file.name}. Check console for details.`);
      }
    }
  }

  /**
   * Load game from file buffer
   *
   * @param {ArrayBuffer} fileBuffer
   * @param {string} fileName
   *
   * @returns {Promise<void>}
   */
  async loadGameFromFile(fileBuffer, fileName) {
    try {
      let stateJSON;

      // Check if this is a .txt file (plain JSON text) or .bgs file (gzip compressed)
      if (fileName.endsWith(".txt")) {
        // Plain JSON text file
        const decoder = new TextDecoder();
        stateJSON = decoder.decode(fileBuffer);
      } else if (fileName.endsWith(".pdf")) {
        const [results] = await extractAttachments(fileBuffer);
        stateJSON = await extractJsonFromPng(new Blob([results.data]));
      } else {
        // Gzip compressed .bgs file
        const bg = /** @type {BlockGardenGlobalThis} */ (globalThis);
        const compressedBlob = new bg.Blob([fileBuffer], {
          type: "application/gzip",
        });

        // Decompress
        if ("DecompressionStream" in bg) {
          const decompressedStream = compressedBlob
            .stream()
            .pipeThrough(new bg.DecompressionStream("gzip"));

          const decompressedBlob = await new bg.Response(
            decompressedStream,
          ).blob();

          stateJSON = await decompressedBlob.text();
        } else {
          throw new Error("DecompressionStream not supported");
        }
      }

      // Parse and load save state
      const saveState = JSON.parse(stateJSON);
      await loadSaveState(
        /** @type {BlockGardenGlobalThis} */ (globalThis),
        this.shadow,
        saveState,
      );

      // Update UI elements
      const { seed } = saveState.config;
      const seedInput = this.doc.getElementById("seedInput");
      const currentSeedDisplay = this.doc.getElementById("currentSeed");

      if (seedInput instanceof HTMLInputElement) {
        seedInput.value = seed;
      }

      if (currentSeedDisplay) currentSeedDisplay.textContent = seed;

      console.log(`Game loaded from file: ${fileName}`);

      // Reset file input
      if (this.dialog) {
        const fileInput = /** @type {HTMLInputElement | null} */ (
          this.dialog.querySelector("#fileInput")
        );
        if (fileInput instanceof HTMLInputElement) {
          fileInput.value = "";
        }
      }

      this.close();
    } catch (error) {
      console.error(`Failed to process game file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async saveCurrentGame() {
    if (!this.dialog) {
      return;
    }

    const worldNameInput = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector("#worldNameInput")
    );

    let worldName = "";
    if (worldNameInput instanceof HTMLInputElement) {
      worldName = worldNameInput.value.trim();
    }

    if (!worldName) {
      alert("Please enter a world name");
      return;
    }

    try {
      const saveState = createSaveState(
        this.gThis.blockGarden.state.world,
        this.gThis,
      );
      const stateJSON = JSON.stringify(saveState);

      // Compress to binary blob
      const compressedBlob = await compressToBinaryBlob(stateJSON);

      // Convert to base64
      if (!compressedBlob) {
        throw new Error("Failed to compress data");
      }
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const base64Data = arrayBufferToBase64(this.gThis, arrayBuffer);

      // Create storage entry
      const gameData = {
        name: worldName,
        timestamp: Date.now(),
        data: base64Data,
      };

      // Save to localForage
      const key = `${STORAGE_KEY_PREFIX}${Date.now()}-${worldName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      await localForage.setItem(key, gameData);

      console.log("Game saved to storage:", worldName);

      // Clear input and refresh list
      if (worldNameInput instanceof HTMLInputElement) {
        worldNameInput.value = "";
      }

      await this.loadSavedGamesList();
    } catch (error) {
      console.error("Failed to save game to storage:", error);
      alert("Failed to save game. Check console for details.");
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async loadSelectedGame() {
    this.updateButtonStates();

    if (!this.dialog) {
      return;
    }

    const selected = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector('input[name="selectedGame"]:checked')
    );

    if (!selected) {
      return;
    }

    const gameIndex = parseInt(selected.value);
    const game = this.savedGames[gameIndex];

    if (!game) {
      return;
    }

    try {
      // Convert base64 back to binary
      const compressedBlob = base64toBlob(
        this.gThis,
        game.data,
        "application/gzip",
      );

      // Decompress
      let stateJSON;

      if ("DecompressionStream" in this.gThis) {
        const decompressedStream = compressedBlob
          .stream()
          .pipeThrough(new this.gThis.DecompressionStream("gzip"));

        const decompressedBlob = await new this.gThis.Response(
          decompressedStream,
        ).blob();

        stateJSON = await decompressedBlob.text();
        this.close();

        const seedDialog = /** @type {HTMLDialogElement | null} */ (
          this.shadow?.querySelector(".seed-controls")
        );

        if (seedDialog) {
          seedDialog.close();
        }
      }
    } catch (error) {
      console.error("Failed to load game from storage:", error);

      alert("Failed to load game. Check console for details.");
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async deleteSelectedGame() {
    this.updateButtonStates();

    if (!this.dialog) {
      return;
    }

    const selected = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector('input[name="selectedGame"]:checked')
    );

    if (!selected) {
      return;
    }

    const gameIndex = parseInt(selected.value);
    const game = this.savedGames[gameIndex];

    if (!game) {
      return;
    }

    if (confirm(`Are you sure you want to delete "${game.name}"?`)) {
      try {
        await localForage.removeItem(game.key);

        console.log("Game deleted from storage:", game.name);

        await this.loadSavedGamesList();
      } catch (error) {
        console.error("Failed to delete game from storage:", error);

        alert("Failed to delete game. Check console for details.");
      }
    }
  }

  /**
   * @returns {Promise<{ game: SavedGame, file: File }>}
   */
  async getPDFGameStateAttachment() {
    const currentTime = getDateTime();
    const pdfLib =
      // @ts-ignore
      await import("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm");

    const { PDFDocument, StandardFonts, rgb } = pdfLib;

    // Fetch game image data and parse game state
    const { game, pngSave } = await this.getSelectedGameAsPNG();
    const pngBytes = await pngSave.arrayBuffer();

    // Parse game state to extract stats
    let gameState;
    if ("DecompressionStream" in this.gThis) {
      const decompressedStream = base64toBlob(
        this.gThis,
        game.data,
        "application/gzip",
      )
        .stream()
        .pipeThrough(new this.gThis.DecompressionStream("gzip"));

      const decompressedBlob = await new this.gThis.Response(
        decompressedStream,
      ).blob();

      const stateJSON = await decompressedBlob.text();
      gameState = JSON.parse(stateJSON);
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([800, 1100]);
    const { width, height } = page.getSize();

    // Fonts
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Colors
    const blue500 = rgb(0.22, 0.55, 0.85);
    const gray400 = rgb(0.68, 0.68, 0.68);
    const gray50 = rgb(0.97, 0.97, 0.97);
    const gray500 = rgb(0.6, 0.6, 0.6);
    const gray900 = rgb(0.1, 0.1, 0.1);
    const green500 = rgb(0.2, 0.65, 0.35);

    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: gray50,
    });

    // Main title "Block Garden" (linked)
    const mainTitle = "Block Garden";
    const mainTitleSize = 38;
    const mainTitleWidth = titleFont.widthOfTextAtSize(
      mainTitle,
      mainTitleSize,
    );

    const mainTitleX = (width - mainTitleWidth) / 2;
    const mainTitleY = height - 80;

    // Main title shadow
    page.drawText(mainTitle, {
      x: mainTitleX + 2,
      y: mainTitleY - 2,
      size: mainTitleSize,
      font: titleFont,
      color: gray400,
    });

    // Main title text
    page.drawText(mainTitle, {
      x: mainTitleX,
      y: mainTitleY,
      size: mainTitleSize,
      font: titleFont,
      color: green500,
    });

    // Add link annotation to main title
    const mainTitleAnnotation = pdfDoc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [
        mainTitleX,
        mainTitleY,
        mainTitleX + mainTitleWidth,
        mainTitleY + mainTitleSize,
      ],
      Border: [0, 0, 0],
      A: pdfDoc.context.obj({
        Type: "Action",
        S: "URI",
        URI: pdfLib.PDFString.of("https://kherrick.github.io/block-garden/"),
      }),
    });

    // Subtitle "Game Save"
    const subTitle = "Game Save";
    const subTitleSize = 24;
    const subTitleWidth = titleFont.widthOfTextAtSize(subTitle, subTitleSize);
    const subTitleX = (width - subTitleWidth) / 2;
    const subTitleY = mainTitleY - 35;

    page.drawText(subTitle, {
      x: subTitleX,
      y: subTitleY,
      size: subTitleSize,
      font: bodyFont,
      color: gray900,
    });

    // Embed Screenshot
    const pngImage = await pdfDoc.embedPng(pngBytes);
    const imgScale = 0.65;
    const imgWidth = pngImage.width * imgScale;
    const imgHeight = pngImage.height * imgScale;

    const imgTopMargin = 40;
    const imgY = subTitleY - imgHeight - imgTopMargin;
    const imgX = (width - imgWidth) / 2;

    // Image border
    page.drawRectangle({
      x: imgX - 4,
      y: imgY - 4,
      width: imgWidth + 8,
      height: imgHeight + 8,
      borderWidth: 1,
      borderColor: gray500,
      color: rgb(1, 1, 1),
    });

    page.drawImage(pngImage, {
      x: imgX,
      y: imgY,
      width: imgWidth,
      height: imgHeight,
    });

    let imageLink = "https://kherrick.github.io/block-garden/";

    if (
      /** @type {any} */ (
        globalThis
      )?.blockGarden?.config?.linkGameSave?.get() === true
    ) {
      const formattedGameName = formatName(game.name);

      imageLink += `?gameSave=${imageLink}assets/game-saves/${formattedGameName}.pdf`;
    } else {
      const seed = gameState?.config?.seed;

      if (seed) {
        imageLink += `?seed=${gameState.config.seed}`;
      }
    }

    const imageAnnotation = pdfDoc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [imgX, imgY, imgX + imgWidth, imgY + imgHeight],
      Border: [0, 0, 0],
      A: pdfDoc.context.obj({
        Type: "Action",
        S: "URI",
        URI: pdfLib.PDFString.of(imageLink),
      }),
    });

    const annotations = page.node.get(pdfLib.PDFName.of("Annots"));
    if (annotations) {
      annotations.push(mainTitleAnnotation);
      annotations.push(imageAnnotation);
    } else {
      page.node.set(
        pdfLib.PDFName.of("Annots"),
        pdfDoc.context.obj([mainTitleAnnotation, imageAnnotation]),
      );
    }

    // Calculate total seeds
    const seedInventory = gameState?.state?.seedInventory || {};
    const totalSeeds = Object.values(seedInventory).reduce(
      (sum, count) => sum + count,
      0,
    );

    // Info box with game stats
    const boxMargin = 30;
    const boxHeight = 390;
    const boxY = imgY - boxMargin - boxHeight;
    const boxWidth = width - 160;
    const boxX = (width - boxWidth) / 2;

    // Info box
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      borderWidth: 2,
      borderColor: gray900,
      color: gray50,
    });

    // Localized date/time
    const now = new Date();
    const lastSaved = now.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

    let currentY = boxY + boxHeight - 25;
    const leftMargin = boxX + 20;
    const lineHeight = 18;

    if (
      /** @type {any} */ (
        globalThis
      )?.blockGarden?.config?.linkGameSave?.get() === false
    ) {
      // Game stats with bold labels
      page.drawText("Saved On:", {
        x: leftMargin,
        y: currentY,
        size: 12,
        font: titleFont,
        color: gray900,
      });

      page.drawText(lastSaved, {
        x: leftMargin + titleFont.widthOfTextAtSize("Saved On: ", 12),
        y: currentY,
        size: 12,
        font: bodyFont,
        color: gray900,
      });

      currentY -= lineHeight;
    }

    page.drawText("World Name:", {
      x: leftMargin,
      y: currentY,
      size: 12,
      font: titleFont,
      color: gray900,
    });

    page.drawText(game.name, {
      x: leftMargin + titleFont.widthOfTextAtSize("World Name: ", 12),
      y: currentY,
      size: 12,
      font: bodyFont,
      color: gray900,
    });

    // move two lines down
    currentY -= lineHeight;
    currentY -= lineHeight;

    // Render Markdown-style Quick Start instructions as preformatted text
    const quickStartLines = [
      "## Quick Start",
      "",
      "- Movement: w / a / s / d",
      "- Camera: arrow keys",
      "- Descend: Shift",
      "- Jump / Ascend: Space",
      "- Place / Break Block: Enter",
      "- Change Block: ~ / `",
      "- Open Inventory: e / i",
      "- Toggle Hotbar: m",
      "- Toggle Flight: k",
      "- Use crosshair to center block placement",
      "- Click game canvas to lock mouse",
      "- Left Click (Hold): Break Block",
      "- Right Click: Place Block",
    ];

    // keep track from existing layout
    const quickStartStartY = currentY;
    let qRowY = quickStartStartY;

    const quickStartFontSize = 9;
    for (let i = 0; i < quickStartLines.length; i++) {
      const line = quickStartLines[i];
      // Slim spacing for header lines
      const hasHeader = line.startsWith("## ");
      const size = hasHeader ? 11 : quickStartFontSize;
      page.drawText(hasHeader ? line.replace("## ", "") : line, {
        x: leftMargin,
        y: qRowY,
        size,
        font: bodyFont,
        color: gray900,
      });

      // Move down: slightly larger gap after header, otherwise consistent line height
      qRowY -= hasHeader ? 14 : 12;
    }

    currentY = qRowY;

    // Footer tag
    const footerText = "Generated by Block Garden";
    const footerSize = 12;
    page.drawText(footerText, {
      x: (width - bodyFont.widthOfTextAtSize(footerText, footerSize)) / 2,
      y: 40,
      size: footerSize,
      font: bodyFont,
      color: green500,
    });

    // Attach PNG backup
    let pngFilename = "";
    if (
      /** @type {any} */ (
        globalThis
      )?.blockGarden?.config?.linkGameSave?.get() === true
    ) {
      pngFilename = `block-garden-game-card.png`;
    } else {
      pngFilename = `block-garden-game-card-${currentTime}.png`;
    }

    pdfDoc.attach(new Uint8Array(pngBytes), pngFilename, {
      mimeType: "image/png",
      description: "Block Garden Game Card",
    });

    // Finalize PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    let pdfFilename = "";
    if (
      /** @type {any} */ (
        globalThis
      )?.blockGarden?.config?.linkGameSave?.get() === true
    ) {
      pdfFilename = `Block-Garden-Game-Save.pdf`;
    } else {
      pdfFilename = `Block-Garden-Game-Save-${currentTime}.pdf`;
    }

    return {
      game,
      file: new File([blob], pdfFilename, {
        type: blob.type,
        lastModified: Date.now(),
      }),
    };
  }

  /**
   * @returns {Promise<{ game: SavedGame, pngSave: Blob}>}
   */
  async getSelectedGameAsPNG() {
    if (!this.dialog) {
      throw new Error("Dialog not initialized");
    }

    const selected = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector('input[name="selectedGame"]:checked')
    );

    if (!selected) {
      throw new Error("No game selected");
    }

    const gameIndex = parseInt(selected.value);
    const game = this.savedGames[gameIndex];

    if (!game) {
      throw new Error("Game not found");
    }

    let stateJSON;
    if ("DecompressionStream" in this.gThis) {
      const decompressedStream = base64toBlob(
        this.gThis,
        game.data,
        "application/gzip",
      )
        .stream()
        .pipeThrough(new globalThis.DecompressionStream("gzip"));
      const decompressedBlob = await new globalThis.Response(
        decompressedStream,
      ).blob();

      stateJSON = await decompressedBlob.text();
    } else {
      throw new Error("DecompressionStream not supported");
    }

    const shadowRoot = getShadowRoot(globalThis.document, "block-garden");
    const cnvs = shadowRoot ? shadowRoot.querySelector("canvas") : null;

    if (!cnvs) {
      throw new Error("Canvas element not found");
    }

    const pngSave = await canvasToPngWithState(cnvs, stateJSON);

    return { game, pngSave };
  }

  /** @returns {Promise<void>} */
  async shareSelectedGameAsPDF() {
    const { game, file } = await this.getPDFGameStateAttachment();

    try {
      // Check if we can share this file
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare !== "undefined" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Block Garden Game Save",
          url: "https://kherrick.github.io/block-garden",
          text: `Visit Block Garden, then 'Load' and checkout my world: ${game.name}\n\n`,
        });

        console.log("Game shared successfully:", game.name);
      } else {
        alert("Web Share API is not available on this device or browser.");
      }
    } catch (error) {
      // Only log if it's not a user cancellation
      const err = /** @type {any} */ (error);
      if (err?.name !== "AbortError") {
        console.error("Failed to share game:", error);
        alert("Failed to share game. Check console for details.");
      } else {
        console.log("Game sharing was cancelled by the user");
      }
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async shareSelectedGame() {
    const currentTime = getDateTime();

    if (!this.dialog) {
      return;
    }

    const selected = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector('input[name="selectedGame"]:checked')
    );

    if (!selected) {
      return;
    }

    const gameIndex = parseInt(selected.value);
    const game = this.savedGames[gameIndex];

    if (!game) {
      return;
    }

    let stateJSON;
    if ("DecompressionStream" in this.gThis) {
      const decompressedStream = base64toBlob(
        this.gThis,
        game.data,
        "application/gzip",
      )
        .stream()
        .pipeThrough(new this.gThis.DecompressionStream("gzip"));

      const decompressedBlob = await new globalThis.Response(
        decompressedStream,
      ).blob();

      stateJSON = await decompressedBlob.text();
    } else {
      throw new Error("DecompressionStream not supported");
    }

    try {
      // Create base64 text blob
      const jsonBlob = new Blob([stateJSON], { type: "text/plain" });

      // Create File object with .txt extension
      const fileName = `Block-Garden-Game-Save-${currentTime}.json.txt`;
      const file = new File([jsonBlob], fileName, { type: "text/plain" });

      // Check if we can share this file
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare !== "undefined" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "Block Garden Game Save",
          url: "https://kherrick.github.io/block-garden",
          text: `Visit Block Garden, then 'Load' and checkout my world: ${game.name}\n\n`,
        });

        console.log("Game shared successfully:", game.name);
      } else {
        alert("Web Share API is not available on this device or browser.");
      }
    } catch (error) {
      // Only log if it's not a user cancellation
      const err = /** @type {Error} */ (error);
      if (err.name !== "AbortError") {
        console.error("Failed to share game:", error);

        alert("Failed to share game. Check console for details.");
      } else {
        console.log("Game sharing was cancelled by the user");
      }
    }
  }

  /**
   * @returns {void}
   */
  show() {
    if (this.dialog instanceof HTMLDialogElement) {
      if (!this.dialog.isConnected) {
        this.shadow.appendChild(this.dialog);
      }

      this.dialog.showModal();

      const autofocusElement = this.dialog.querySelector("[autofocus]");
      if (autofocusElement instanceof HTMLElement) {
        autofocusElement.focus();
      }
    }
  }

  /**
   * @returns {void}
   */
  close() {
    this.removeEventListeners();

    if (this.dialog instanceof HTMLDialogElement) {
      this.dialog.close();
    }

    const sd = /** @type {HTMLDialogElement | null} */ (
      this.shadow.getElementById("storageDialog")
    );

    if (sd instanceof HTMLDialogElement) {
      sd.close();
    }
  }
}

/**
 * Export function to create and show dialog
 *
 * @param {BlockGardenGlobalThis} gThis
 * @param {Document} doc
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<StorageDialog|void>}
 */
export async function showStorageDialog(gThis, doc, shadow) {
  const sd = shadow.getElementById("storageDialog");
  if (sd instanceof HTMLDialogElement) {
    sd.remove();
  }

  const storageDialog = new StorageDialog(gThis, doc, shadow);

  await storageDialog.createDialog();

  storageDialog.show();

  return storageDialog;
}
