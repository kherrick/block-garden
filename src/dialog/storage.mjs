import localForage from "localforage";

import { deleteSharedSave, retrieveSharedSave } from "../state/shareTarget.mjs";
import { createSaveState } from "../state/createSave.mjs";
import { loadSaveState } from "../state/loadSave.mjs";

import {
  canvasToPngWithState,
  extractJsonFromPng,
} from "../util/canvasToPngWithState.mjs";

import { arrayBufferToBase64, base64toBlob } from "../util/conversion.mjs";
import { compressToBinaryBlob } from "../util/compression.mjs";
import { getDateTime } from "../util/getDateTime.mjs";
import { getShadowRoot } from "../util/getShadowRoot.mjs";
import { extractAttachments } from "../util/extractAttachments.mjs";

const TIME_SECONDS_ONE = 1000;
const TIME_MINUTES_ONE = 1 * 60 * TIME_SECONDS_ONE;

export const AUTO_SAVE_INTERVAL = TIME_MINUTES_ONE;

const AUTO_SAVE_THROTTLE = AUTO_SAVE_INTERVAL / 2;

const AUTO_SAVE_KEY = "block-garden-autosave";
const SAVE_MODE_KEY = "block-garden-autosave-mode";

const STORAGE_KEY_PREFIX = "block-garden-save-";

/**
 * Get current save mode
 *
 * @returns {Promise<string>}
 * */
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
 * @param {typeof globalThis} globalThis
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
    const saveState = createSaveState(
      globalThis.blockGarden.state.world,
      globalThis,
    );
    const stateJSON = JSON.stringify(saveState);

    // Compress to binary blob
    const compressedBlob = await compressToBinaryBlob(stateJSON);

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
 * @param {typeof globalThis} globalThis
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<boolean>}
 */
export async function checkAutoSave(globalThis, shadow) {
  try {
    const autoSave = await localForage.getItem(AUTO_SAVE_KEY);
    const isAutoSaveEnabled =
      (await localForage.getItem(SAVE_MODE_KEY)) === "auto";

    if (!autoSave || !isAutoSaveEnabled) {
      return false;
    }

    globalThis.blockGarden.state.isCanvasActionDisabled = true;

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
        <button id="autoSaveNo" style="
          background: var(--bg-color-red-500);
          border-radius: 0.25rem;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem 0.9375rem;
        ">No</button>
        <button id="autoSaveYes" style="
          background: var(--bg-color-green-500);
          border-radius: 0.25rem;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem 0.9375rem;
        ">Yes</button>
      </div>
    `;

    dialog.addEventListener("cancel", () => {
      setTimeout(() => {
        globalThis.blockGarden.state.isCanvasActionDisabled = false;
      }, 500);
    });

    dialog.addEventListener("close", () => {
      setTimeout(() => {
        globalThis.blockGarden.state.isCanvasActionDisabled = false;
      }, 500);
    });

    shadow.append(dialog);

    dialog.showModal();

    return new Promise((resolve) => {
      const autoSaveNo = dialog.querySelector("#autoSaveNo");
      const autoSaveYes = dialog.querySelector("#autoSaveYes");

      autoSaveYes.addEventListener("click", async () => {
        autoSaveNo.setAttribute("disabled", "disabled");

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

          // Set the seed before loading the rest of the state (for proper world init)
          if (saveState.config && saveState.config.seed) {
            globalThis.blockGarden.state.seed = saveState.config.seed;
          }

          await loadSaveState(globalThis, shadow, saveState);

          const seedInput = shadow.getElementById("seedInput");
          const currentSeedDisplay = shadow.getElementById("currentSeed");

          if (seedInput instanceof HTMLInputElement) {
            seedInput.value = globalThis.blockGarden.state.seed;
          }

          if (currentSeedDisplay) {
            currentSeedDisplay.textContent = globalThis.blockGarden.state.seed;
          }

          console.log("Auto save loaded successfully");
        } catch (error) {
          console.error("Failed to load auto save:", error);
        }

        dialog.close();
        dialog.remove();

        resolve(true);
      });

      autoSaveNo.addEventListener("click", () => {
        autoSaveYes.setAttribute("disabled", "disabled");

        dialog.close();
        dialog.remove();

        resolve(false);
      });

      dialog.addEventListener("cancel", () => {
        setTimeout(() => {
          globalThis.blockGarden.state.isCanvasActionDisabled = false;
        }, 500);

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
 * @param {typeof globalThis} globalThis
 *
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<boolean>} - true if a shared save was loaded, false otherwise
 */
export async function checkSharedSave(globalThis, shadow) {
  try {
    const sharedSave = await retrieveSharedSave();

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
        <button id="sharedSaveNo" style="
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

    return new Promise((resolve) => {
      dialog
        .querySelector("#sharedSaveYes")
        .addEventListener("click", async () => {
          try {
            let saveState = sharedSave.data;

            await loadSaveState(globalThis, shadow, saveState);

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

            const { seed } = saveState.config;
            const seedInput = shadow.getElementById("seedInput");
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
          }

          dialog.close();
          dialog.remove();

          resolve(true);
        });

      dialog
        .querySelector("#sharedSaveNo")
        .addEventListener("click", async () => {
          // Delete the shared save if user declines
          await deleteSharedSave();
          dialog.close();
          dialog.remove();

          resolve(false);
        });

      dialog.addEventListener("cancel", async () => {
        setTimeout(() => {
          globalThis.blockGarden.state.isCanvasActionDisabled = false;
        }, 500);

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
 * Create and manage the storage dialog
 */
export class StorageDialog {
  /**
   * @param {typeof globalThis} globalThis - The global context.
   * @param {Document} doc - The document associated with the app.
   * @param {ShadowRoot} shadow - The shadow root whose host's computed styles will be inspected.
   */
  constructor(globalThis, doc, shadow) {
    this.gThis = globalThis;
    this.doc = doc;
    this.shadow = shadow;
    this.dialog = null;
    this.savedGames = [];

    this.close = this.close.bind(this);
    this.deleteSelectedGame = this.deleteSelectedGame.bind(this);
    this.getPDFGameStateAttachment = this.getPDFGameStateAttachment.bind(this);
    this.getSelectedGameAsPNG = this.getSelectedGameAsPNG.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleFileDrop = this.handleFileDrop.bind(this);
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.handleWorldNameInput = this.handleWorldNameInput.bind(this);
    this.loadSelectedGame = this.loadSelectedGame.bind(this);
    this.saveCurrentGame = this.saveCurrentGame.bind(this);
    this.shareSelectedGame = this.shareSelectedGame.bind(this);
    this.shareSelectedGameAsPDF = this.shareSelectedGameAsPDF.bind(this);
  }

  /** @returns {Promise<HTMLDialogElement>} */
  async createDialog() {
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

  /** @returns {void} */
  renderSavedGamesList() {
    const listContainer = this.dialog.querySelector("#savedGamesList");

    if (this.savedGames.length === 0) {
      listContainer.innerHTML = `
      <div style="padding: 1.25rem; text-align: center; color: var(--bg-color-neutral-950);">
        No saved games found
      </div>
    `;

      return;
    }

    listContainer.innerHTML = this.savedGames
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
            name="selectedGame"
            style="margin-left: 0.625rem"
            type="radio"
            value="${index}"
          />
        </div>
    `,
      )
      .join("");

    // Add click handlers for game selection
    listContainer.querySelectorAll(".saved-game-item").forEach((item) => {
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

  /** @returns {void} */
  updateButtonStates() {
    const selected = this.dialog.querySelector(
      'input[name="selectedGame"]:checked',
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

        if (this.gThis.blockGarden.state.hasEnabledExtras.get()) {
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

  /** @returns {void} */
  initEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeStorageDialog");
    const saveBtn = this.dialog.querySelector("#saveToStorageBtn");
    const loadBtn = this.dialog.querySelector("#loadSelectedBtn");
    const deleteBtn = this.dialog.querySelector("#deleteSelectedBtn");
    const shareBtn = this.dialog.querySelector("#shareSelectedBtn");
    const shareAsPdfBtn = this.dialog.querySelector("#shareSelectedAsPdfBtn");
    const worldNameInput = this.dialog.querySelector("#worldNameInput");
    const gameDropZone = this.dialog.querySelector("#gameDropZone");
    const fileInput = this.dialog.querySelector("#fileInput");

    closeBtn.addEventListener("click", this.close);
    saveBtn.addEventListener("click", this.saveCurrentGame);
    loadBtn.addEventListener("click", this.loadSelectedGame);
    deleteBtn.addEventListener("click", this.deleteSelectedGame);
    shareBtn.addEventListener("click", this.shareSelectedGame);
    shareAsPdfBtn.addEventListener("click", this.shareSelectedGameAsPDF);
    worldNameInput.addEventListener("keydown", this.handleWorldNameInput);

    // Drag and drop for file upload
    gameDropZone.addEventListener("dragover", this.handleDragOver);
    gameDropZone.addEventListener("dragleave", this.handleDragLeave);
    gameDropZone.addEventListener("drop", this.handleFileDrop);

    // File input change event
    fileInput.addEventListener("change", this.handleFileSelect);
  }

  /** @returns {void} */
  removeEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeStorageDialog");
    const saveBtn = this.dialog.querySelector("#saveToStorageBtn");
    const loadBtn = this.dialog.querySelector("#loadSelectedBtn");
    const deleteBtn = this.dialog.querySelector("#deleteSelectedBtn");
    const shareBtn = this.dialog.querySelector("#shareSelectedBtn");
    const shareAsPDFBtn = this.dialog.querySelector("#shareSelectedAsPdfBtn");
    const worldNameInput = this.dialog.querySelector("#worldNameInput");
    const gameDropZone = this.dialog.querySelector("#gameDropZone");
    const fileInput = this.dialog.querySelector("#fileInput");

    closeBtn.removeEventListener("click", this.close);
    saveBtn.removeEventListener("click", this.saveCurrentGame);
    loadBtn.removeEventListener("click", this.loadSelectedGame);
    deleteBtn.removeEventListener("click", this.deleteSelectedGame);
    shareBtn.removeEventListener("click", this.shareSelectedGame);
    shareAsPDFBtn.removeEventListener("click", this.shareSelectedGameAsPDF);
    worldNameInput.removeEventListener("keydown", this.handleWorldNameInput);

    // Drag and drop
    gameDropZone.removeEventListener("dragover", this.handleDragOver);
    gameDropZone.removeEventListener("dragleave", this.handleDragLeave);
    gameDropZone.removeEventListener("drop", this.handleFileDrop);

    // File input
    fileInput.removeEventListener("change", this.handleFileSelect);
  }

  /** @returns {void} */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();

    const gameDropZone = this.dialog.querySelector("#gameDropZone");
    if (gameDropZone instanceof HTMLElement) {
      gameDropZone.style.borderColor = "var(--bg-color-blue-500)";
      gameDropZone.style.backgroundColor = "rgba(100, 200, 255, 0.1)";
    }
  }

  /** @returns {void} */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();

    const gameDropZone = this.dialog.querySelector("#gameDropZone");
    if (gameDropZone instanceof HTMLElement) {
      gameDropZone.style.borderColor = "var(--bg-color-gray-400)";
      gameDropZone.style.backgroundColor = "";
    }
  }

  /** @returns {void} */
  handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const gameDropZone = this.dialog.querySelector("#gameDropZone");
    if (gameDropZone instanceof HTMLElement) {
      gameDropZone.style.borderColor = "var(--bg-color-gray-400)";
      gameDropZone.style.backgroundColor = "";
    }

    const files = e.dataTransfer.files;
    this.processFiles(files);
  }

  /** @returns {void} */
  handleFileSelect(e) {
    const files = e.target.files;
    this.processFiles(files);
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
        const compressedBlob = new globalThis.Blob([fileBuffer], {
          type: "application/gzip",
        });

        // Decompress
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
      }

      // Parse and load save state
      const saveState = JSON.parse(stateJSON);
      await loadSaveState(globalThis, this.shadow, saveState);

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
      const fileInput = this.dialog.querySelector("#fileInput");
      if (fileInput instanceof HTMLInputElement) {
        fileInput.value = "";
      }

      this.close();
    } catch (error) {
      console.error(`Failed to process game file ${fileName}:`, error);
      throw error;
    }
  }

  /** @returns {Promise<void>} */
  async saveCurrentGame() {
    const worldNameInput = this.dialog.querySelector("#worldNameInput");

    let worldName;
    if (worldNameInput instanceof HTMLInputElement) {
      worldName = worldNameInput.value.trim();
    }

    if (!worldName) {
      alert("Please enter a world name");
      return;
    }

    try {
      // Create save state
      const saveState = createSaveState(
        globalThis.blockGarden.state.world,
        globalThis,
      );
      const stateJSON = JSON.stringify(saveState);

      // Compress to binary blob
      const compressedBlob = await compressToBinaryBlob(stateJSON);

      // Convert to base64
      const arrayBuffer = await compressedBlob.arrayBuffer();
      const base64Data = arrayBufferToBase64(globalThis, arrayBuffer);

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

  /** @returns {Promise<void>} */
  async loadSelectedGame() {
    const selected = this.dialog.querySelector(
      'input[name="selectedGame"]:checked',
    );

    if (!selected) {
      return;
    }

    let game;
    if (selected instanceof HTMLInputElement) {
      const gameIndex = parseInt(selected.value);

      game = this.savedGames[gameIndex];
    }

    try {
      // Convert base64 back to binary
      const compressedBlob = base64toBlob(
        globalThis,
        game.data,
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

      await loadSaveState(globalThis, this.shadow, saveState);

      this.close();
    } catch (error) {
      console.error("Failed to load game from storage:", error);

      alert("Failed to load game. Check console for details.");
    }
  }

  /** @returns {Promise<void>} */
  async deleteSelectedGame() {
    const selected = this.dialog.querySelector(
      'input[name="selectedGame"]:checked',
    );

    if (!selected) {
      return;
    }

    let game;
    if (selected instanceof HTMLInputElement) {
      const gameIndex = parseInt(selected.value);

      game = this.savedGames[gameIndex];
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

  /** @returns {Promise<{ game: any, file: File }>} */
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
    if ("DecompressionStream" in globalThis) {
      const decompressedStream = base64toBlob(
        globalThis,
        game.data,
        "application/gzip",
      )
        .stream()
        .pipeThrough(new globalThis.DecompressionStream("gzip"));

      const decompressedBlob = await new globalThis.Response(
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

    const seed = gameState?.config?.seed || "";
    const imageLink = seed
      ? `https://kherrick.github.io/block-garden/?seed=${seed}`
      : "https://kherrick.github.io/block-garden/";

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
      "- Inventory: e",
      "- Camera: Arrow Keys",
      "- Change Block: ~ / `  ",
      "- Jump / Ascend: Space",
      "- Descend: Shift",
      "- Place / Remove Block: Enter",
      "- Click Game Canvas To Lock Mouse",
      "  - Use crosshair to center block placement",
      "  - Left Click: Place Block",
      "  - Right Click: Remove Block",
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
    const filename = `block-garden-game-card-${currentTime}.png`;
    pdfDoc.attach(new Uint8Array(pngBytes), filename, {
      mimeType: "image/png",
      description: "Block Garden Game Card",
    });

    // Finalize PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    return {
      game,
      file: new File([blob], `Block-Garden-Game-Save-${currentTime}.pdf`, {
        type: blob.type,
        lastModified: Date.now(),
      }),
    };
  }

  /** @returns {Promise<{ game: any, pngSave: Blob}>} */
  async getSelectedGameAsPNG() {
    const selected = this.dialog.querySelector(
      'input[name="selectedGame"]:checked',
    );

    if (!selected) {
      return;
    }

    let game;
    if (selected instanceof HTMLInputElement) {
      const gameIndex = parseInt(selected.value);

      game = this.savedGames[gameIndex];
    }

    let stateJSON;
    if ("DecompressionStream" in globalThis) {
      const decompressedStream = base64toBlob(
        globalThis,
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

    const cnvs = getShadowRoot(
      globalThis.document,
      "block-garden",
    ).querySelector("canvas");

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
      if (error.name !== "AbortError") {
        console.error("Failed to share game:", error);
        alert("Failed to share game. Check console for details.");
      } else {
        console.log("Game sharing was cancelled by the user");
      }
    }
  }

  /** @returns {Promise<void>} */
  async shareSelectedGame() {
    const currentTime = getDateTime();
    const selected = this.dialog.querySelector(
      'input[name="selectedGame"]:checked',
    );

    if (!selected) {
      return;
    }

    let game;
    if (selected instanceof HTMLInputElement) {
      const gameIndex = parseInt(selected.value);

      game = this.savedGames[gameIndex];
    }

    let stateJSON;
    if ("DecompressionStream" in globalThis) {
      const decompressedStream = base64toBlob(
        globalThis,
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
      if (error.name !== "AbortError") {
        console.error("Failed to share game:", error);
        alert("Failed to share game. Check console for details.");
      } else {
        console.log("Game sharing was cancelled by the user");
      }
    }
  }

  /** @returns {void} */
  show() {
    this.dialog instanceof HTMLDialogElement && this.dialog.showModal();
  }

  /** @returns {void} */
  close() {
    this.removeEventListeners();

    this.dialog instanceof HTMLDialogElement && this.dialog.close();
  }
}

/**
 * Export function to create and show dialog
 *
 * @param {typeof globalThis} globalThis
 * @param {Document} doc
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<StorageDialog>}
 */
export async function showStorageDialog(globalThis, doc, shadow) {
  const storageDialog = new StorageDialog(globalThis, doc, shadow);

  await storageDialog.createDialog();

  storageDialog.show();

  return storageDialog;
}
