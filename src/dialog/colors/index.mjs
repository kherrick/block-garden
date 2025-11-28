import { applyColorsToShadowHost } from "../../util/colors/applyColorsToShadowHost.mjs";
import { getCustomProperties } from "../../util/colors/getCustomProperties.mjs";
import { debounce } from "../../util/debounce.mjs";

import { resetColors } from "./resetColors.mjs";
import { saveColors } from "./saveColors.mjs";

/** @typedef {import('../../util/colors/index.mjs').CombinedColorMap} CombinedColorMap */

// Color customization system for Sprite Garden
export const COLOR_STORAGE_KEY = "sprite-garden-custom-colors";

export class ColorCustomizationDialog {
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
    /** @type CombinedColorMap */
    this.colors = {};
    this.originalColors = {};

    this.close = this.close.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.handleDialogClose = this.handleDialogClose.bind(this);
    this.handleDialogKeydown = this.handleDialogKeydown.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.dirty = false;
  }

  /** @returns {Promise<HTMLDialogElement>} */
  async createDialog() {
    if (this.dialog) {
      this.dialog.remove();
    }

    // Get all current colors
    this.originalColors = getCustomProperties(this.gThis, this.shadow);
    this.colors = { ...this.originalColors };

    const dialog = this.doc.createElement("dialog");
    dialog.setAttribute("id", "customizeColorsDialog");
    dialog.addEventListener("close", this.handleDialogClose);
    dialog.addEventListener("keydown", this.handleDialogKeydown);

    dialog.style.cssText = `
      background: var(--sg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--sg-color-gray-900);
      color: var(--sg-color-gray-900);
      font-family: monospace;
      max-height: 80vh;
      max-width: 30rem;
      overflow-y: auto;
      padding: 1.25rem;
      width: 90%;
    `;

    dialog.innerHTML = `
      <div style="
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.9375rem;
      ">
        <h3 style="margin: 0">Customize Colors</h3>
        <button
          id="closeColorDialog"
          style="
            background: var(--sg-color-red-500);
            border-radius: 0.25rem;
            border: none;
            color: var(--sg-color-white);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0.5rem 1rem;
          "
        >
          &times;
        </button>
      </div>

      <div style="margin-bottom: 1rem;">
        <p style="color: var(--sg-color-gray-700); font-size: 0.875rem; margin: 0 0 0.5rem 0;">
          Customize the color palette for Sprite Garden. Changes are applied in real-time and saved automatically.
        </p>
      </div>

      <div id="colorInputsContainer" style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      ">
        <!-- Color inputs will be generated here -->
      </div>

      <div style="border-top: 1px solid var(--sg-color-gray-300); display: flex; gap: 0.625rem; justify-content: flex-end; padding-top: 1rem;">
        <button
          id="resetColorsBtn"
          style="
            background: var(--sg-color-orange-500);
            border-radius: 0.25rem;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.5rem 0.9375rem;
          "
        >
          Reset to Defaults
        </button>
        <button
          id="saveColorsBtn"
          style="
            background: var(--sg-color-green-500);
            border-radius: 0.25rem;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0.5rem 0.9375rem;
          "
        >
          Save & Close
        </button>
      </div>
    `;

    this.shadow.append(dialog);
    this.dialog = dialog;

    this.renderColorInputs();
    this.initEventListeners();

    return dialog;
  }

  /** @returns {Promise<void>} */
  async handleSave() {
    await saveColors(this.colors, COLOR_STORAGE_KEY);
    await applyColorsToShadowHost(this.shadow, this.colors);

    this.shadow.dispatchEvent(
      new CustomEvent("sprite-garden-reset", {
        detail: {
          colors: this.colors,
        },
      }),
    );

    this.dirty = false;

    this.close();
  }

  /** @returns {Promise<void>} */
  async handleReset() {
    if (
      confirm("Reset all colors to defaults and close? This cannot be undone.")
    ) {
      await resetColors(this.gThis, this.shadow, COLOR_STORAGE_KEY);

      this.shadow.dispatchEvent(
        new CustomEvent("sprite-garden-reset", {
          detail: {
            colors: null,
          },
        }),
      );

      this.dirty = false;

      this.close();
    }
  }

  /** @returns {void} */
  renderColorInputs() {
    const container = this.dialog.querySelector("#colorInputsContainer");

    // Group properties by category (extracted from property name)
    const grouped = {};

    for (const [property, value] of Object.entries(this.colors)) {
      // Extract category from property name (e.g., --sg-color-air, --sg-color-gray-50)
      const match = property.match(/--sg-?([a-z]+)-/);
      const category = match ? match[1] : "other";

      if (["host", "touch", "ui"].includes(category)) {
        continue;
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({ property, value: value.slice(0, 7) });
    }

    // Sort categories
    const sortedCategories = Object.keys(grouped).sort();

    // Render each category
    for (const category of sortedCategories) {
      const categoryDiv = this.doc.createElement("div");
      categoryDiv.style.cssText = `
        grid-column: 1 / -1;
        margin-top: 1rem;
      `;

      const categoryTitle = this.doc.createElement("h4");
      categoryTitle.textContent = (
        category.charAt(0).toUpperCase() + category.slice(1)
      ).replace("Tile", "Tiles");
      categoryTitle.style.cssText = `
        border-bottom: 1px solid var(--sg-color-gray-300);
        color: var(--sg-color-gray-800);
        font-size: 1rem;
        margin: 0 0 0.5rem 0;
        padding-bottom: 0.25rem;
      `;

      categoryDiv.append(categoryTitle);

      const [firstColorInGroup] = grouped[category];
      if (firstColorInGroup.property.startsWith("--sg-color")) {
        categoryDiv.setAttribute("hidden", "hidden");
      }

      container.append(categoryDiv);

      // Render inputs for this category
      for (const { property, value } of grouped[category]) {
        const inputGroup = this.doc.createElement("div");
        inputGroup.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        `;

        if (property.startsWith("--sg-color")) {
          inputGroup.setAttribute("hidden", "hidden");
        }

        const label = this.doc.createElement("label");
        label.textContent = property
          .replace("--sg-", "")
          .replace(/-/g, " ")
          .replace("tile ", "")
          .replace("color ", "")
          .replace(" color", "");
        label.style.cssText = `
          color: var(--sg-color-gray-700);
          font-size: 0.75rem;
          text-transform: capitalize;
        `;

        const inputWrapper = this.doc.createElement("div");
        inputWrapper.style.cssText = `
          align-items: center;
          display: flex;
          gap: 0.5rem;
        `;

        const colorInput = this.doc.createElement("input");
        colorInput.type = "color";
        colorInput.value = this.normalizeColor(value);
        colorInput.dataset.property = property;
        colorInput.style.cssText = `
          border-radius: 0.25rem;
          border: 1px solid var(--sg-color-gray-400);
          cursor: pointer;
          height: 2rem;
          width: 3rem;
        `;

        const textInput = this.doc.createElement("input");
        textInput.type = "text";
        textInput.value = value;
        textInput.dataset.property = property;
        textInput.style.cssText = `
          border-radius: 0.25rem;
          border: 1px solid var(--sg-color-gray-400);
          flex: 1;
          font-family: monospace;
          font-size: 0.75rem;
          padding: 0.25rem;
        `;

        const debouncedColorChange = debounce(() => {
          this.handleColorChange(property, textInput.value);
        }, 500);

        /**
         * Event listener for colorInput input event to synchronize the text input value
         * and trigger debounced color change handling.
         *
         * @param {InputEvent} e - The input event triggered by colorInput element.
         *
         * @returns {void}
         */
        colorInput.addEventListener("input", (e) => {
          if (e.target instanceof HTMLInputElement) {
            textInput.value = e.target.value;

            debouncedColorChange();
          }
        });

        /**
         * Event listener for textInput input event to normalize color value,
         * synchronize color input value, and trigger debounced color change handling.
         *
         * @param {InputEvent} e - The input event triggered by textInput element.
         *
         * @returns {void}
         */
        textInput.addEventListener("input", (e) => {
          if (e.target instanceof HTMLInputElement) {
            const normalized = this.normalizeColor(e.target.value);

            if (normalized) {
              colorInput.value = normalized;
            }

            debouncedColorChange();
          }
        });

        inputWrapper.append(colorInput);
        inputWrapper.append(textInput);

        inputGroup.append(label);
        inputGroup.append(inputWrapper);

        container.append(inputGroup);
      }
    }
  }

  /**
   * @param {string} color
   *
   * @returns {string}
   */
  normalizeColor(color) {
    // Try to convert color to hex format for color input
    if (!color) return "#000000";

    // Already hex
    if (color.startsWith("#")) {
      return color.length === 7 ? color : "#000000";
    }

    // Try to use canvas to convert
    const canvas = this.doc.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;

    return ctx.fillStyle;
  }

  /**
   * Handles the color change by updating internal state and applying styles
   * to the shadow DOM host element, then dispatching a custom event.
   *
   * @param {string} property - The CSS property name to update.
   * @param {string} value - The new value for the CSS property.
   *
   * @returns {void}
   */
  handleColorChange(property, value) {
    this.colors[property] = value;
    this.dirty = true;

    // Apply immediately for live preview
    const root = this.shadow.host;
    if (root instanceof HTMLElement) {
      root.style.setProperty(property, value);

      this.shadow.dispatchEvent(
        new CustomEvent("sprite-garden-reset", {
          detail: {
            colors: this.colors,
          },
        }),
      );
    }
  }

  /** @returns {void} */
  initEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeColorDialog");
    const saveBtn = this.dialog.querySelector("#saveColorsBtn");
    const resetBtn = this.dialog.querySelector("#resetColorsBtn");

    closeBtn.addEventListener("click", this.close);
    saveBtn.addEventListener("click", this.handleSave);
    resetBtn.addEventListener("click", this.handleReset);
  }

  /** @returns {void} */
  show() {
    this.dialog instanceof HTMLDialogElement && this.dialog.showModal();
  }

  /**
   * @param {KeyboardEvent} e
   *
   * @returns {void}
   */
  handleDialogKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();

      this.close();
    }
  }

  /** @returns {void} */
  close() {
    if (this.dirty) {
      if (confirm("Close without saving?")) {
        // Revert to original colors if not saved
        applyColorsToShadowHost(this.shadow, this.originalColors);

        requestAnimationFrame(() => {
          this.shadow.dispatchEvent(
            new CustomEvent("sprite-garden-reset", {
              detail: {
                colors: this.originalColors,
              },
            }),
          );
        });

        this.dialog instanceof HTMLDialogElement && this.dialog.close();
      }

      return;
    }

    this.dialog instanceof HTMLDialogElement && this.dialog.close();
  }

  /** @returns {void} */
  handleDialogClose() {
    this.removeEventListeners();

    this.dialog.remove();
  }

  /** @returns {void} */
  removeEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeColorDialog");
    const saveBtn = this.dialog.querySelector("#saveColorsBtn");
    const resetBtn = this.dialog.querySelector("#resetColorsBtn");

    closeBtn.removeEventListener("click", this.close);
    saveBtn.removeEventListener("click", this.handleSave);
    resetBtn.removeEventListener("click", this.handleReset);
  }
}
