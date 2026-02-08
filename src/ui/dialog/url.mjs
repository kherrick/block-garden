import { processSaveData } from "../../utils/saveData.mjs";

import { showToast } from "../../api/ui/toast.mjs";

import { loadSaveState } from "../../core/loadSave.mjs";

/** @typedef {import('../../api/BlockGarden.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */

/**
 * Create and manage the URL loading dialog
 */
export class UrlDialog {
  /**
   * @param {BlockGardenGlobalThis} globalThis - The global context.
   * @param {Document} doc - The document associated with the app.
   * @param {ShadowRoot} shadow - The shadow root whose host's computed styles will be inspected.
   */
  constructor(globalThis, doc, shadow) {
    this.gThis = globalThis;
    this.doc = doc;
    this.shadow = shadow;
    /** @type {HTMLDialogElement | null} */
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
        <button id="closeUrlDialogButton" autofocus>
          &times;
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.9375rem;">
        <div>
          <h4 style="margin: 0 0 0.625rem 0">Example Game States</h4>
          <div style="display: flex; gap: 0.625rem;">
            <style>
              button {
                background: var(--bg-color-emerald-700);
                border-radius: 0.25rem;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.5rem;
              }

              button:disabled, button[disabled] {
                cursor: not-allowed;
              }

              button[data-game] {
                flex: 1;
              }

              #closeUrlDialogButton {
                background: var(--bg-color-red-500);
                padding: 0.3125rem 0.625rem;
                flex: unset;
              }

              #loadUrlButton {
                background: var(--bg-color-blue-500);
                padding: 0.5rem 0.9375rem;
              }

              #exampleGame1 {
                background: var(--bg-color-blue-400);
              }

              #exampleGame2 {
                background: var(--bg-color-medium-purple);
              }

              #exampleGame3 {
                background: var(--bg-color-amber-500);
              }

              #exampleGame4 {
                background: var(--bg-color-emerald-700);
              }

            </style>
            <button data-game id="exampleGame1">Game 1 (Flowers)</button>
            <button data-game id="exampleGame2">Game 2 (Gateway)</button>
            <button data-game id="exampleGame3">Game 3 (Caves)</button>
            <button data-game id="exampleGame4">Game 4 (Garden)</button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.625rem;">
          <h4 style="margin: 0">Custom URL</h4>
          <input type="url" id="saveUrlInput" placeholder="https://example.com/save.bgs" style="border-radius: 0.25rem; border: 0.0625rem solid var(--bg-color-gray-500); padding: 0.5rem;" />
          <button id="loadUrlBtn">
            Load
          </button>
        </div>
      </div>
    `;

    this.shadow.append(dialog);
    this.dialog = dialog;
    const gamePath =
      "https://kherrick.github.io/block-garden/assets/game-saves/";
    const games = /** @type {Record<number, any>} */ ({
      1: {
        file: "Flowers.pdf",
      },
      2: {
        file: "Gateway-To-The-Clouds.pdf",
      },
      3: {
        file: "Caves.pdf",
      },
      4: {
        file: "The-Garden.pdf",
      },
    });
    const closeBtn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#closeUrlDialogButton")
    );
    if (closeBtn) closeBtn.addEventListener("click", this.close);

    function setGame(/** @type {number} */ index) {
      const urlInput = /** @type {HTMLInputElement | null} */ (
        dialog.querySelector("#saveUrlInput")
      );

      if (urlInput) {
        urlInput.value = `${gamePath}${games[index].file}`;
      }
    }

    const game1Btn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#exampleGame1")
    );
    if (game1Btn) game1Btn.addEventListener("click", () => setGame(1));
    if (game1Btn)
      game1Btn.addEventListener("keydown", (e) => {
        if (e instanceof KeyboardEvent && e.key.toLowerCase() === " ") {
          setGame(1);
        }
      });

    const game2Btn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#exampleGame2")
    );
    if (game2Btn) game2Btn.addEventListener("click", () => setGame(2));
    if (game2Btn) {
      game2Btn.addEventListener("keydown", (e) => {
        if (e instanceof KeyboardEvent && e.key.toLowerCase() === " ") {
          setGame(2);
        }
      });
    }

    const game3Btn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#exampleGame3")
    );
    if (game3Btn) game3Btn.addEventListener("click", () => setGame(3));
    if (game3Btn) {
      game3Btn.addEventListener("keydown", (e) => {
        if (e instanceof KeyboardEvent && e.key.toLowerCase() === " ") {
          setGame(3);
        }
      });
    }

    const game4Btn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#exampleGame4")
    );
    if (game4Btn) game4Btn.addEventListener("click", () => setGame(4));
    if (game4Btn) {
      game4Btn.addEventListener("keydown", (e) => {
        if (e instanceof KeyboardEvent && e.key.toLowerCase() === " ") {
          setGame(4);
        }
      });
    }

    const loadBtn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#loadUrlBtn")
    );
    if (loadBtn) loadBtn.addEventListener("click", this.handleLoad);
    if (loadBtn) {
      loadBtn.addEventListener("keydown", (e) => {
        if (e instanceof KeyboardEvent && e.key.toLowerCase() === " ") {
          this.handleLoad();
        }
      });
    }

    const urlInput = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#saveUrlInput")
    );
    if (urlInput)
      urlInput.addEventListener("keydown", (e) => {
        if (e instanceof KeyboardEvent && e.key.toLowerCase() === "enter") {
          this.handleLoad();
        }
      });

    return dialog;
  }

  async handleLoad() {
    if (!this.dialog) return;
    const urlInput = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector("#saveUrlInput")
    );

    if (!urlInput) return;
    const url = urlInput.value.trim();

    if (!url) {
      showToast(this.shadow, "Please enter a valid URL.");

      return;
    }

    const loadBtn = /** @type {HTMLButtonElement | null} */ (
      this.dialog.querySelector("#loadUrlBtn")
    );

    if (loadBtn) {
      loadBtn.disabled = true;
      loadBtn.textContent = "Loading...";
    }

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

        const seedControls = this.shadow.querySelector(".seed-controls");
        if (seedControls instanceof HTMLDialogElement) {
          seedControls.close();
        }
      } else {
        showToast(
          this.shadow,
          "Oops! This URL save state appears to be broken. Use a valid game save file!",
          { stack: true, useSingle: false, duration: 5000 },
        );

        if (this.dialog) {
          const loadBtn = /** @type {HTMLButtonElement | null} */ (
            this.dialog.querySelector("#loadUrlBtn")
          );

          if (loadBtn) {
            loadBtn.disabled = false;
            loadBtn.textContent = "Load";
          }
        }
      }
    } catch (error) {
      console.error("Failed to load game from URL:", error);

      showToast(
        this.shadow,
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (this.dialog) {
        const loadBtn = /** @type {HTMLButtonElement | null} */ (
          this.dialog.querySelector("#loadUrlBtn")
        );

        if (loadBtn) {
          loadBtn.disabled = false;
          loadBtn.textContent = "Load";
        }
      }
    }
  }

  /** @returns {void} */
  show() {
    if (this.dialog instanceof HTMLDialogElement) {
      if (this.doc.pointerLockElement) {
        this.doc.exitPointerLock();
      }

      this.dialog.addEventListener("close", () => this.close());
      this.dialog.showModal();

      const autofocusElement = this.dialog.querySelector("[autofocus]");
      if (autofocusElement instanceof HTMLElement) {
        autofocusElement.focus();
      }
    }
  }

  /** @returns {void} */
  close() {
    if (this.dialog instanceof HTMLDialogElement) {
      this.dialog.close();
      this.dialog.remove();
    }
  }
}

/**
 * Export function to create and show dialog
 *
 * @param {BlockGardenGlobalThis} globalThis
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
