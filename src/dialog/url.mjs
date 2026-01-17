import { processSaveData } from "../util/saveData.mjs";

import { showToast } from "../api/ui/toast.mjs";

import { loadSaveState } from "../state/loadSave.mjs";

/**
 * Create and manage the URL loading dialog
 */
export class UrlDialog {
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

    this.close = this.close.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }

  /** @returns {Promise<HTMLDialogElement>} */
  async createDialog() {
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialog = this.doc.createElement("dialog");
    dialog.setAttribute("id", "urlDialog");
    dialog.style.cssText = `
      background: var(--bg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--bg-color-gray-900);
      color: var(--bg-color-gray-900);
      font-family: monospace;
      max-width: 31.25rem;
      padding: 1.25rem;
      width: 90%;
    `;

    dialog.innerHTML = `
      <div style="align-items: center; display: flex; justify-content: space-between; margin-bottom: 0.9375rem;">
        <h3 style="margin: 0">Load Game From URL</h3>
        <button id="closeUrlDialog" style="background: var(--bg-color-red-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.3125rem 0.625rem;">
          &times;
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.9375rem;">
        <div>
          <h4 style="margin: 0 0 0.625rem 0">Example Game States</h4>
          <div style="display: flex; gap: 0.625rem;">
            <button id="exampleGame1" style="background: var(--bg-color-emerald-700); border-radius: 0.25rem; border: none; color: white; cursor: pointer; flex: 1; padding: 0.5rem;">
              Game 1 (Flowers)
            </button>
            <button id="exampleGame2" style="background: var(--bg-color-emerald-700); border-radius: 0.25rem; border: none; color: white; cursor: pointer; flex: 1; padding: 0.5rem;">
              Game 2 (Gateway)
            </button>
            <button id="exampleGame3" style="background: var(--bg-color-emerald-700); border-radius: 0.25rem; border: none; color: white; cursor: pointer; flex: 1; padding: 0.5rem;">
              Game 3 (Caves)
            </button>
            <button id="exampleGame4" style="background: var(--bg-color-emerald-700); border-radius: 0.25rem; border: none; color: white; cursor: pointer; flex: 1; padding: 0.5rem;">
              Game 4 (Garden)
            </button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.625rem;">
          <h4 style="margin: 0">Custom URL</h4>
          <input type="url" id="saveUrlInput" placeholder="https://example.com/save.bgs" style="border-radius: 0.25rem; border: 0.0625rem solid var(--bg-color-gray-500); padding: 0.5rem;" />
          <button id="loadUrlBtn" style="background: var(--bg-color-blue-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.5rem 0.9375rem;">
            Load
          </button>
        </div>
      </div>
    `;

    this.shadow.append(dialog);
    this.dialog = dialog;

    const closeBtn = dialog.querySelector("#closeUrlDialog");
    closeBtn.addEventListener("click", this.close);

    const game1Btn = dialog.querySelector("#exampleGame1");
    game1Btn.addEventListener("click", () => {
      const urlInput = /** @type {HTMLInputElement} */ (
        dialog.querySelector("#saveUrlInput")
      );

      urlInput.value =
        "https://kherrick.github.io/block-garden/assets/game-saves/Flowers.pdf";
    });

    const game2Btn = dialog.querySelector("#exampleGame2");
    game2Btn.addEventListener("click", () => {
      const urlInput = /** @type {HTMLInputElement} */ (
        dialog.querySelector("#saveUrlInput")
      );

      urlInput.value =
        "https://kherrick.github.io/block-garden/assets/game-saves/Gateway-To-The-Clouds.pdf";
    });

    const game3Btn = dialog.querySelector("#exampleGame3");
    game3Btn.addEventListener("click", () => {
      const urlInput = /** @type {HTMLInputElement} */ (
        dialog.querySelector("#saveUrlInput")
      );

      urlInput.value =
        "https://kherrick.github.io/block-garden/assets/game-saves/Caves.pdf";
    });

    const game4Btn = dialog.querySelector("#exampleGame4");
    game4Btn.addEventListener("click", () => {
      const urlInput = /** @type {HTMLInputElement} */ (
        dialog.querySelector("#saveUrlInput")
      );

      urlInput.value =
        "https://kherrick.github.io/block-garden/assets/game-saves/The-Garden.pdf";
    });

    const loadBtn = dialog.querySelector("#loadUrlBtn");
    loadBtn.addEventListener("click", this.handleLoad);

    const urlInput = dialog.querySelector("#saveUrlInput");
    urlInput.addEventListener("keydown", (e) => {
      if (e instanceof KeyboardEvent && e.key === "Enter") {
        this.handleLoad();
      }
    });

    return dialog;
  }

  async handleLoad() {
    const urlInput = /** @type {HTMLInputElement} */ (
      this.dialog.querySelector("#saveUrlInput")
    );

    const url = urlInput.value.trim();

    if (!url) {
      showToast(this.shadow, "Please enter a valid URL.");

      return;
    }

    const loadBtn = /** @type {HTMLButtonElement} */ (
      this.dialog.querySelector("#loadUrlBtn")
    );

    loadBtn.disabled = true;
    loadBtn.textContent = "Loading...";

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${response.statusText}`);
      }

      const blob = await response.blob();
      const filename = url.split("/").pop() || "save.bgs";

      const stateJSON = await processSaveData(blob, filename, this.gThis);
      const saveState = JSON.parse(stateJSON);

      const loaded = await loadSaveState(this.gThis, this.shadow, saveState);

      if (loaded) {
        showToast(this.shadow, "Game loaded successfully from URL!");

        this.close();
      } else {
        showToast(
          this.shadow,
          "Oops! This URL save state appears to be broken. Use a valid game save file!",
          { stack: true, useSingle: false, duration: 5000 },
        );

        const loadBtn = /** @type {HTMLButtonElement} */ (
          this.dialog.querySelector("#loadUrlBtn")
        );

        if (loadBtn) {
          loadBtn.disabled = false;
          loadBtn.textContent = "Load";
        }
      }
    } catch (error) {
      console.error("Failed to load game from URL:", error);

      showToast(this.shadow, `Error: ${error.message}`);

      const loadBtn = /** @type {HTMLButtonElement} */ (
        this.dialog.querySelector("#loadUrlBtn")
      );

      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.textContent = "Load";
      }
    }
  }

  /** @returns {void} */
  show() {
    if (this.dialog instanceof HTMLDialogElement) {
      if (this.doc.pointerLockElement) {
        this.doc.exitPointerLock();
      }

      globalThis.blockGarden.state.isCanvasActionDisabled = true;

      this.dialog.showModal();
    }
  }

  /** @returns {void} */
  close() {
    if (this.dialog instanceof HTMLDialogElement) {
      this.dialog.close();
      this.dialog.remove();

      setTimeout(() => {
        globalThis.blockGarden.state.isCanvasActionDisabled = false;
      }, 500);
    }
  }
}

/**
 * Export function to create and show dialog
 *
 * @param {typeof globalThis} globalThis
 * @param {Document} doc
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<UrlDialog>}
 */
export async function showUrlDialog(globalThis, doc, shadow) {
  const urlDialog = new UrlDialog(globalThis, doc, shadow);

  await urlDialog.createDialog();

  urlDialog.show();

  return urlDialog;
}
