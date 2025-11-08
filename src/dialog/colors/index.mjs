import { applyColors } from "./applyColors.mjs";
import { getCustomProperties } from "./getCustomProperties.mjs";
import { getSavedColors } from "./getSavedColors.mjs";
import { resetColors } from "./resetColors.mjs";
import { saveColors } from "./saveColors.mjs";

// Color customization system for Sprite Garden
export const COLOR_STORAGE_KEY = "sprite-garden-custom-colors";

export async function initColors(gThis, shadow) {
  applyColors(
    shadow,
    (await getSavedColors(shadow, COLOR_STORAGE_KEY)) ??
      getCustomProperties(gThis, shadow),
  );
}

export class ColorCustomizationDialog {
  constructor(gThis, doc, shadow) {
    this.gThis = gThis;
    this.doc = doc;
    this.shadow = shadow;
    this.dialog = null;
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

  async createDialog() {
    if (this.dialog) {
      this.dialog.remove();
    }

    // Get all current colors
    this.originalColors = getCustomProperties(this.gThis, this.shadow);
    this.colors = { ...this.originalColors };

    const dialog = this.doc.createElement("dialog");
    dialog.addEventListener("close", this.handleDialogClose);
    dialog.addEventListener("keydown", this.handleDialogKeydown);

    dialog.style.cssText = `
      background: var(--sg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--sg-color-gray-900);
      color: var(--sg-color-gray-900);
      font-family: monospace;
      max-height: 80vh;
      max-width: 50rem;
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
          ×
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

  async handleSave() {
    await saveColors(this.colors, COLOR_STORAGE_KEY);
    await applyColors(this.shadow, this.colors);

    this.dirty = false;

    this.close();
  }

  async handleReset() {
    if (
      confirm("Reset all colors to defaults and close? This cannot be undone.")
    ) {
      await resetColors(this.gThis, this.shadow, COLOR_STORAGE_KEY);

      // Reload the dialog to show default colors
      this.dirty = false;

      this.close();
    }
  }

  renderColorInputs() {
    const container = this.dialog.querySelector("#colorInputsContainer");

    // Group properties by category (extracted from property name)
    const grouped = {};

    for (const [property, value] of Object.entries(this.colors)) {
      // Extract category from property name (e.g., --sg-color-gray-50 -> gray)
      const match = property.match(/--sg-(?:color-)?([a-z]+)-/);
      const category = match ? match[1] : "other";

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({ property, value });
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
      categoryTitle.textContent =
        category.charAt(0).toUpperCase() + category.slice(1);
      categoryTitle.style.cssText = `
        border-bottom: 1px solid var(--sg-color-gray-300);
        color: var(--sg-color-gray-800);
        font-size: 1rem;
        margin: 0 0 0.5rem 0;
        padding-bottom: 0.25rem;
      `;

      categoryDiv.append(categoryTitle);
      container.append(categoryDiv);

      // Render inputs for this category
      for (const { property, value } of grouped[category]) {
        const inputGroup = this.doc.createElement("div");
        inputGroup.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        `;

        const label = this.doc.createElement("label");
        label.textContent = property.replace("--sg-", "").replace(/-/g, " ");
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

        // Sync inputs
        colorInput.addEventListener("input", (e) => {
          textInput.value = e.target.value;

          this.handleColorChange(property, e.target.value);
        });

        textInput.addEventListener("input", (e) => {
          const normalized = this.normalizeColor(e.target.value);
          if (normalized) {
            colorInput.value = normalized;
          }

          this.handleColorChange(property, e.target.value);
        });

        inputWrapper.append(colorInput);
        inputWrapper.append(textInput);
        inputGroup.append(label);
        inputGroup.append(inputWrapper);
        container.append(inputGroup);
      }
    }
  }

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

  handleColorChange(property, value) {
    this.colors[property] = value;
    this.dirty = true;

    // Apply immediately for live preview
    const root = this.shadow.host;
    root.style.setProperty(property, value);
  }

  initEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeColorDialog");
    const saveBtn = this.dialog.querySelector("#saveColorsBtn");
    const resetBtn = this.dialog.querySelector("#resetColorsBtn");

    closeBtn.addEventListener("click", this.close);
    saveBtn.addEventListener("click", this.handleSave);
    resetBtn.addEventListener("click", this.handleReset);
  }

  show() {
    this.dialog.showModal();
  }

  handleDialogKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();

      this.close();
    }
  }

  close() {
    if (this.dirty) {
      console.log("not saved...");
      if (confirm("Close without saving?")) {
        // Revert to original colors if not saved
        applyColors(this.shadow, this.originalColors);

        this.dialog.close();
      }
      console.log("returning...");

      return;
    }

    this.dialog.close();
  }

  handleDialogClose() {
    this.removeEventListeners();
  }

  removeEventListeners() {
    const closeBtn = this.dialog.querySelector("#closeColorDialog");
    const saveBtn = this.dialog.querySelector("#saveColorsBtn");
    const resetBtn = this.dialog.querySelector("#resetColorsBtn");

    closeBtn.removeEventListener("click", this.close);
    saveBtn.removeEventListener("click", this.handleSave);
    resetBtn.removeEventListener("click", this.handleReset);
  }
}
