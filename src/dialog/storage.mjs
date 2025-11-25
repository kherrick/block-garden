import localForage from "localforage";

import { arrayBufferToBase64, base64toBlob } from "../util/conversion.mjs";
import { compressToBinaryBlob } from "../util/compression.mjs";
import { createSaveState } from "../state/createSave.mjs";
import { loadSaveState } from "../state/loadSave.mjs";

const TIME_SECONDS_ONE = 1000;
const TIME_MINUTES_ONE = 1 * 60 * TIME_SECONDS_ONE;

export const AUTO_SAVE_INTERVAL = TIME_MINUTES_ONE;

const AUTO_SAVE_THROTTLE = AUTO_SAVE_INTERVAL / 2;

const AUTO_SAVE_KEY = "sprite-garden-autosave";
const SAVE_MODE_KEY = "sprite-garden-autosave-mode";

const STORAGE_KEY_PREFIX = "sprite-garden-save-";

/**
 * Get current save mode
 *
 * @returns {Promise<any>}
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
 * @param {any} mode
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

// Track last auto-save timestamp
let lastAutoSaveTime = 0;

/**
 * Auto-save functionality
 *
 * @param {any} gThis
 *
 * @returns {Promise<void>}
 */
export async function autoSaveGame(gThis) {
  try {
    // Check if auto-save is enabled
    const saveMode = await getSaveMode();

    if (saveMode !== "auto") {
      return;
    }

    const now = Date.now();

    // Check if we saved within the last 30 seconds
    if (now - lastAutoSaveTime < AUTO_SAVE_THROTTLE) {
      console.info("Auto-save skipped (too soon since last save)");

      return;
    }

    const saveState = createSaveState(gThis);
    const stateJSON = JSON.stringify(saveState);
    const compressedBlob = await compressToBinaryBlob(stateJSON);

    const arrayBuffer = await compressedBlob.arrayBuffer();
    const base64Data = arrayBufferToBase64(gThis, arrayBuffer);

    const gameData = {
      name: "[Auto Save]",
      timestamp: Date.now(),
      data: base64Data,
      isAutoSave: true,
    };

    await localForage.setItem(AUTO_SAVE_KEY, gameData);

    lastAutoSaveTime = now; // Update last save time

    console.info("Game auto-saved successfully");
  } catch (error) {
    console.error("Failed to auto-save game:", error);
  }
}

/**
 * Check for auto-save on load
 *
 * @param {any} gThis
 * @param {any} shadow
 *
 * @returns {Promise<any>}
 */
export async function checkAutoSave(gThis, shadow) {
  try {
    const autoSave = await localForage.getItem(AUTO_SAVE_KEY);
    const isAutoSaveEnabled =
      (await localForage.getItem(SAVE_MODE_KEY)) === "auto";

    if (!autoSave || !isAutoSaveEnabled) {
      return false;
    }

    // Create and show auto-save dialog
    const dialog = gThis.document.createElement("dialog");
    dialog.style.cssText = `
      background: var(--sg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--sg-color-gray-900);
      color: var(--sg-color-gray-900);
      font-family: monospace;
      padding: 1.25rem;
      max-width: 25rem;
      z-index: 10000;
    `;

    const timestamp = new Date(autoSave.timestamp).toLocaleString();
    dialog.innerHTML = `
      <h3 style="margin: 0 0 1rem 0">Auto-Save Detected</h3>
      <p style="margin: 0 0 1rem 0">
        A saved game from ${timestamp} was found. Would you like to load it?
      </p>
      <div style="display: flex; gap: 0.625rem; justify-content: flex-end">
        <button id="autoSaveNo" style="
          background: var(--sg-color-red-500);
          border-radius: 0.25rem;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem 0.9375rem;
        ">No</button>
        <button id="autoSaveYes" style="
          background: var(--sg-color-green-500);
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
        .querySelector("#autoSaveYes")
        .addEventListener("click", async () => {
          try {
            const compressedBlob = base64toBlob(
              gThis,
              autoSave.data,
              "application/gzip",
            );

            let stateJSON;

            if ("DecompressionStream" in gThis) {
              const decompressedStream = compressedBlob
                .stream()
                .pipeThrough(new DecompressionStream("gzip"));
              const decompressedBlob = await new Response(
                decompressedStream,
              ).blob();

              stateJSON = await decompressedBlob.text();
            } else {
              throw new Error("DecompressionStream not supported");
            }

            const saveState = JSON.parse(stateJSON);

            loadSaveState(gThis, shadow, saveState);

            const { worldSeed } = saveState.config;
            const seedInput = shadow.getElementById("worldSeedInput");
            const currentSeedDisplay = shadow.getElementById("currentSeed");

            if (seedInput) seedInput.value = worldSeed;

            if (currentSeedDisplay) currentSeedDisplay.textContent = worldSeed;

            console.log("Auto-save loaded successfully");
          } catch (error) {
            console.error("Failed to load auto-save:", error);
          }

          dialog.close();
          dialog.remove();

          resolve(true);
        });

      dialog.querySelector("#autoSaveNo").addEventListener("click", () => {
        dialog.close();
        dialog.remove();

        resolve(false);
      });

      dialog.addEventListener("cancel", () => {
        resolve(false);
      });
    });
  } catch (error) {
    console.error("Failed to check for auto-save:", error);

    return false;
  }
}

/**
 * Create and manage the storage dialog
 */
export class StorageDialog {
  /**
   * @param {object} gThis - The global context or window object.
   * @param {Document} doc - The document associated with the app.
   * @param {ShadowRoot} shadow - The shadow root whose host's computed styles will be inspected.
   */
  constructor(gThis, doc, shadow) {
    this.gThis = gThis;
    this.doc = doc;
    this.shadow = shadow;
    this.dialog = null;
    this.savedGames = [];
    this.close = this.close.bind(this);

    this.deleteSelectedGame = this.deleteSelectedGame.bind(this);
    this.loadSelectedGame = this.loadSelectedGame.bind(this);
    this.saveCurrentGame = this.saveCurrentGame.bind(this);
    this.handleDialogClick = this.handleDialogClick.bind(this);
    this.handleWorldNameInput = this.handleWorldNameInput.bind(this);
  }

  /** @returns {Promise<any>} */
  async createDialog() {
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialog = this.doc.createElement("dialog");
    dialog.setAttribute("id", "storageDialog");
    dialog.style.cssText = `
      background: var(--sg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--sg-color-gray-900);
      color: var(--sg-color-gray-900);
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
            background: var(--sg-color-red-500);
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
              border: 0.0625rem solid var(--sg-color-gray-500);
              flex: 1;
              padding: 0.3125rem;
            "
          />
          <button
            id="saveToStorageBtn"
            style="
              background: var(--sg-color-green-500);
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
        <h4 style="margin: 0.625rem 0">Load Saved Game</h4>
        <div
          id="savedGamesList"
          style="
            border: 0.0625rem solid var(--sg-color-gray-400);
            border-radius: 0.25rem;
            max-height: 18.75rem;
            overflow-y: auto;
          "
        >
          <!-- Saved games will be populated here -->
        </div>
        <div style="margin-top: 0.625rem; display: flex; gap: 0.625rem">
          <button
            id="loadSelectedBtn"
            disabled
            style="
              background: var(--sg-color-blue-500);
              border-radius: 0.25rem;
              border: none;
              color: white;
              cursor: pointer;
              padding: 0.5rem 0.9375rem;
            "
          >
            Load Selected
          </button>
          <button
            id="deleteSelectedBtn"
            disabled
            style="
              background: var(--sg-color-red-500);
              border-radius: 0.25rem;
              border: none;
              color: white;
              cursor: pointer;
              padding: 0.5rem 0.9375rem;
            "
          >
            Delete Selected
          </button>
        </div>
      </div>
    `;

    this.shadow.append(dialog);
    this.dialog = dialog;

    await this.loadSavedGamesList();

    this.initEventListeners();

    return dialog;
  }

  /** @returns {Promise<void>} */
  async loadSavedGamesList() {
    this.savedGames = [];

    const keys = await localForage.keys();

    // Load auto-save first
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
      <div style="padding: 1.25rem; text-align: center; color: var(--sg-color-neutral-950);">
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
            border-bottom: 0.0625rem solid var(--sg-color-gray-100);
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            ${game.isAutoSave ? "background: var(--sg-color-blue-50);" : ""}
          "
        >
          <div>
            <div style="font-weight: bold; ${game.isAutoSave ? "color: var(--sg-color-blue-700);" : ""}">${game.name}</div>
            <div style="font-size: 0.75rem; color: var(--sg-color-neutral-950);">
              ${new Date(game.timestamp).toLocaleString()}
            </div>
          </div>
          <input
            type="radio"
            name="selectedGame"
            value="${index}"
            style="margin-left: 0.625rem"
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
  }

  /**
   * @param {any} e
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
   * @param {any} e
   *
   * @returns {void}
   */
  handleDialogClick(e) {
    if (e.target === this.dialog) {
      this.close();
    }
  }

  /** @returns {void} */
  initEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeStorageDialog");
    const saveBtn = this.dialog.querySelector("#saveToStorageBtn");
    const loadBtn = this.dialog.querySelector("#loadSelectedBtn");
    const deleteBtn = this.dialog.querySelector("#deleteSelectedBtn");
    const worldNameInput = this.dialog.querySelector("#worldNameInput");

    closeBtn.addEventListener("click", this.close);
    saveBtn.addEventListener("click", this.saveCurrentGame);
    loadBtn.addEventListener("click", this.loadSelectedGame);
    deleteBtn.addEventListener("click", this.deleteSelectedGame);
    worldNameInput.addEventListener("keydown", this.handleWorldNameInput);

    // Close on outside click
    this.dialog.addEventListener("click", this.handleDialogClick);
  }

  /** @returns {void} */
  removeEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeStorageDialog");
    const saveBtn = this.dialog.querySelector("#saveToStorageBtn");
    const loadBtn = this.dialog.querySelector("#loadSelectedBtn");
    const deleteBtn = this.dialog.querySelector("#deleteSelectedBtn");
    const worldNameInput = this.dialog.querySelector("#worldNameInput");

    closeBtn.removeEventListener("click", this.close);
    saveBtn.removeEventListener("click", this.saveCurrentGame);
    loadBtn.removeEventListener("click", this.loadSelectedGame);
    deleteBtn.removeEventListener("click", this.deleteSelectedGame);
    worldNameInput.removeEventListener("keydown", this.handleWorldNameInput);

    // Close on outside click
    this.dialog.removeEventListener("click", this.handleDialogClick);
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
      const saveState = createSaveState(this.gThis);
      const stateJSON = JSON.stringify(saveState);

      // Compress to binary blob
      const compressedBlob = await compressToBinaryBlob(stateJSON);

      // Convert to base64
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
        this.gThis,
        game.data,
        "application/gzip",
      );

      // Decompress
      let stateJSON;

      if ("DecompressionStream" in this.gThis) {
        const decompressedStream = compressedBlob
          .stream()
          .pipeThrough(new DecompressionStream("gzip"));

        const decompressedBlob = await new Response(decompressedStream).blob();

        stateJSON = await decompressedBlob.text();
      } else {
        throw new Error("DecompressionStream not supported");
      }

      // Parse and load save state
      const saveState = JSON.parse(stateJSON);
      loadSaveState(this.gThis, this.shadow, saveState);

      // Update UI elements
      const { worldSeed } = saveState.config;
      const seedInput = this.doc.getElementById("worldSeedInput");
      const currentSeedDisplay = this.doc.getElementById("currentSeed");

      if (seedInput instanceof HTMLInputElement) {
        seedInput.value = worldSeed;
      }

      if (currentSeedDisplay) currentSeedDisplay.textContent = worldSeed;

      console.log("Game loaded from storage:", game.name);

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

  /** @returns {void} */
  show() {
    this.dialog.showModal();
  }

  /** @returns {void} */
  close() {
    this.removeEventListeners();

    this.dialog.close();
  }
}

/**
 * Export function to create and show dialog
 *
 * @param {any} gThis
 * @param {any} doc
 * @param {any} shadow
 *
 * @returns {Promise<StorageDialog>}
 */
export async function showStorageDialog(gThis, doc, shadow) {
  const storageDialog = new StorageDialog(gThis, doc, shadow);

  await storageDialog.createDialog();

  storageDialog.show();

  return storageDialog;
}
