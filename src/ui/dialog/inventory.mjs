import { gameConfig } from "../../core/world/config/index.mjs";

import {
  setMaterialBarItem,
  toInventoryKey,
} from "../../core/systems/game/state.mjs";

/** @typedef {import('../../api/BlockGarden.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */
/** @typedef {import('../../core/systems/game/state.mjs').GameState} GameState */

/**
 * @typedef {Object} CategoryBlock
 * @property {number} [id]
 * @property {string} name
 * @property {string | number} count
 * @property {boolean} [isSeed]
 * @property {boolean} [crop]
 * @property {number} [emissive]
 */

/**
 * @typedef {Object} BlockCategory
 * @property {string} title
 * @property {CategoryBlock[]} blocks
 */

export class InventoryDialog {
  /**
   * @param {BlockGardenGlobalThis} globalThis
   * @param {Document} doc
   * @param {ShadowRoot} shadow
   */
  constructor(globalThis, doc, shadow) {
    this.gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
    this.doc = doc;
    this.shadow = shadow;

    /** @type {HTMLDialogElement | null} */
    this.dialog = null;
    this.isOpen = false;
    /** @type {Object<string, string>} */
    this.blockColors = {};

    this.initBlockColors();

    this.handleClose = this.handleClose.bind(this);
  }

  async initBlockColors() {
    try {
      const colorsModule = await import("../../core/world/config/colors.mjs");

      this.blockColors = colorsModule.colors.block || {};
    } catch (e) {
      console.error("Failed to load block colors", e);
    }
  }

  async createDialog() {
    // disable canvas while dialog is open
    const bg = /** @type {BlockGardenGlobalThis} */ (this.gThis);
    bg.blockGarden.state.isCanvasActionDisabled = true;

    if (this.dialog) {
      return this.dialog;
    }

    const dialog = this.doc.createElement("dialog");
    dialog.setAttribute("id", "inventoryDialog");
    dialog.style.cssText = `
      background: var(--bg-color-gray-800);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--bg-color-gray-900);
      color: var(--bg-color-white);
      font-family: monospace;
      max-height: 80vh;
      max-width: 50rem;
      overflow-y: auto;
      padding: 1.25rem;
      width: 90%;
      z-index: 10000;
    `;

    dialog.innerHTML = `
      <style>
        .inventory-slot {
          align-items: center;
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 0.25rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          justify-content: center;
          padding: 0.5rem;
          position: relative;
          transition: all 0.2s;
        }

        .inventory-slot:hover,
        .inventory-slot:focus-visible {
          background-color: rgba(255, 255, 255, 0.1);
          outline: 0.125rem solid var(--bg-color-gray-600);
          outline-offset: 0.125rem;
          transform: translateY(-0.25rem);
        }

        .inventory-slot.is-disabled {
          cursor: not-allowed;
          filter: grayscale(1);
          opacity: 0.5;
        }

        .inventory-slot.is-disabled:hover {
          background-color: rgba(0, 0, 0, 0.3);
          outline: none;
          transform: none;
        }

        .inventory-slot-cube {
          height: 2rem;
          perspective: 62.5rem;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(20deg) rotateY(-30deg);
          width: 2rem;
        }

        .inventory-slot.is-seed {
          background-color: rgba(76, 175, 80, 0.3);
          box-shadow: inset 0 0 10px rgba(76, 175, 80, 0.2);
        }

        .inventory-slot-count {
          background: rgba(0, 0, 0, 0.6);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 0.625rem;
          font-weight: bold;
          padding: 0.125rem 0.375rem;
          position: absolute;
          right: 0.25rem;
          top: 0.25rem;
        }

        .cube-face {
          border: 0.0625rem solid rgba(0, 0, 0, 0.3);
          height: 2rem;
          position: absolute;
          width: 2rem;
        }

        .cube-front {
          transform: translateZ(1rem);
        }

        .cube-top {
          filter: brightness(1.2);
          transform: rotateX(90deg) translateZ(1rem);
        }

        .cube-right {
          filter: brightness(0.8);
          transform: rotateY(90deg) translateZ(1rem);
        }

        .inventory-slot-name {
          color: var(--bg-color-white);
          font-size: 0.625rem;
          line-height: 1.1;
          max-width: 4rem;
          text-align: center;
          text-shadow: 0 0 2px black;
          word-break: break-word;
        }

        .inventory-category-title {
          background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%);
          border-left: 0.25rem solid var(--bg-color-gray-500);
          color: var(--bg-color-gray-300);
          font-size: 0.75rem;
          grid-column: 1 / -1;
          margin-bottom: 0.5rem;
          margin-top: 1rem;
          padding: 0.25rem 0.75rem;
          text-transform: uppercase;
        }

        .inventory-category-title:first-of-type {
          margin-top: 0;
        }
      </style>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
        <h3 style="margin: 0; font-size: 1.25rem; letter-spacing: 0.05rem;">Material Inventory</h3>
        <button id="closeInventoryDialog" autofocus="autofocus" style="background: var(--bg-color-red-500); border: none; color: white; border-radius: 0.25rem; cursor: pointer; padding: 0.25rem 1rem; font-weight: bold;">&times;</button>
      </div>
      <div id="inventoryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr)); gap: 0.75rem;">
        <!-- Blocks will be populated here -->
      </div>
    `;

    this.shadow.append(dialog);
    this.dialog = dialog;

    this.renderInventory();

    const closeBtn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#closeInventoryDialog")
    );
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    dialog.addEventListener("cancel", () => this.close());

    return dialog;
  }

  renderInventory() {
    if (!this.dialog) {
      return;
    }

    const grid = /** @type {HTMLElement | null} */ (
      this.dialog.querySelector("#inventoryGrid")
    );
    if (!grid) {
      return;
    }

    const blocks = this.gThis.blockGarden.config.blocks;
    const isCreative = this.gThis.blockGarden.config?.useCreativeMode.get();
    const state = this.gThis.blockGarden.state;
    const materials = state.materialsInventory.get();
    const seeds = state.seedsInventory.get();

    // Identify all seed blocks for grouping
    const seedBlocks = blocks.filter((b) => b.isSeed);
    const plantPrefixes = seedBlocks.flatMap((s) => {
      const prefixes = [s.name];
      if (s.name.endsWith(" Tree")) {
        prefixes.push(s.name.replace(" Tree", ""));
      }

      return prefixes;
    });

    // Categorize all blocks
    /** @type {Object<string, BlockCategory>} */
    const categories = {
      plants: { title: "🌱 Plants & Seeds", blocks: [] },
      natural: { title: "⛰️ Natural Materials", blocks: [] },
      lighting: { title: "🏮 Lighting", blocks: [] },
      system: { title: "⚙️ System Utilities", blocks: [] },
    };

    blocks
      .filter((block) => block.name !== "Air")
      .forEach((block) => {
        const nameKey = toInventoryKey(block.name);
        const count = block.isSeed
          ? seeds[nameKey] || 0
          : materials[nameKey] || 0;

        const showFullCatalog =
          this.gThis.blockGarden.config.showFullCatalog.get();
        const isLightingBlock =
          (block.emissive || 0) > 0 && block.name !== "Lava";

        // In non-creative mode, we hide things we don't have unless showFullCatalog is enabled
        // However, lighting blocks are always available
        if (!isCreative && count <= 0 && !showFullCatalog && !isLightingBlock) {
          return;
        }

        const name = block.name.toUpperCase();

        // System - Link and Text blocks are unlocked by extrasHandler.
        // They are available in both creative and non-creative modes once unlocked.
        // In the future, these could be craftable instead.
        const hasUnlockedExtras = state.hasEnabledExtras?.get?.() ?? false;
        if (name === "LINK" || name === "TEXT") {
          if (hasUnlockedExtras) {
            categories.system.blocks.push({
              ...block,
              count: isCreative ? "\u221E" : count,
            });
          }
        }
        // Lighting - always available (even in non-creative mode) with infinite count
        // Use actual count with crafting implementation
        else if (isLightingBlock) {
          categories.lighting.blocks.push({
            ...block,
            count: "\u221E",
          });
        }
        // Plants
        else if (
          block.isSeed ||
          block.crop ||
          plantPrefixes.some((p) => block.name.startsWith(p))
        ) {
          categories.plants.blocks.push({
            ...block,
            count: isCreative ? "\u221E" : count,
          });
        }
        // Natural
        else {
          categories.natural.blocks.push({
            ...block,
            count: isCreative ? "\u221E" : count,
          });
        }
      });

    // Special sorting for Plants: Group by plant type, seed first
    categories.plants.blocks.sort((a, b) => {
      // Find the root plant name for both
      const rootA = plantPrefixes.find((p) => a.name.startsWith(p)) || a.name;
      const rootB = plantPrefixes.find((p) => b.name.startsWith(p)) || b.name;

      if (rootA !== rootB) {
        return rootA.localeCompare(rootB);
      }

      // Within the same plant, seed always comes first
      if (a.isSeed) {
        return -1;
      }

      if (b.isSeed) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });

    // Sort other categories alphabetically
    /** @type {(a: CategoryBlock, b: CategoryBlock) => number} */
    const alphaSort = (a, b) => a.name.localeCompare(b.name);
    categories.natural.blocks.sort(alphaSort);
    categories.system.blocks.sort(alphaSort);
    categories.lighting.blocks.sort(alphaSort);

    // Build HTML
    let html = "";
    Object.values(categories).forEach((cat) => {
      if (cat.blocks.length === 0) {
        return;
      }

      html += `<div class="inventory-category-title">${cat.title}</div>`;

      cat.blocks.forEach((block) => {
        const blockNameKey = block.name.toLowerCase().replace(/ /g, "-");

        const colorVar =
          this.blockColors[blockNameKey] || `var(--bg-color-gray-500)`;

        const isSeedClass = block.isSeed ? "is-seed" : "";
        // Blocks are disabled if in non-creative mode AND count is 0 (but always enabled if count is ∞)
        const isDisabled = !isCreative && block.count === 0;
        const disabledClass = isDisabled ? "is-disabled" : "";

        html += `
          <div
            class="inventory-slot ${isSeedClass} ${disabledClass}"
            data-id="${block.id}"
            data-count="${block.count}"
            tabindex="${isDisabled ? "-1" : "0"}"
            title="${block.name}${!isCreative ? ` (${block.count})` : ""}"
          >
            ${!isCreative || typeof block.count === "number" ? `<div class="inventory-slot-count">${block.count}</div>` : ""}
            <div class="inventory-slot-cube">
              <div class="cube-face cube-front" style="background-color: ${colorVar};"></div>
              <div class="cube-face cube-top" style="background-color: ${colorVar};"></div>
              <div class="cube-face cube-right" style="background-color: ${colorVar};"></div>
            </div>
            <div class="inventory-slot-name">${block.name}</div>
          </div>
        `;
      });
    });

    grid.innerHTML = html;

    grid.querySelectorAll(".inventory-slot").forEach((slot) => {
      slot.addEventListener("click", (e) => {
        const target =
          e.currentTarget instanceof HTMLElement ? e.currentTarget : null;

        if (target && !target.classList.contains("is-disabled")) {
          const id = Number(target.dataset.id);

          this.handleBlockClick(id);
        }
      });

      slot.addEventListener("keydown", (/** @type {Event} */ evt) => {
        if (!(evt instanceof KeyboardEvent)) {
          return;
        }

        if (evt.key === "Enter" || evt.key === " ") {
          const target =
            evt.currentTarget instanceof HTMLElement ? evt.currentTarget : null;

          if (target && !target.classList.contains("is-disabled")) {
            evt.preventDefault();
            const id = Number(target.dataset.id);

            this.handleBlockClick(id);
          }
        }
      });
    });
  }

  /**
   * @param {number} blockId
   *
   * @returns {void}
   */
  handleBlockClick(blockId) {
    setMaterialBarItem(blockId);

    this.close();
  }

  handleClose() {
    setTimeout(() => {
      // re-enable canvas after dialog is closed
      this.gThis.blockGarden.state.isCanvasActionDisabled = false;

      if (this.dialog) {
        this.dialog.removeEventListener("close", this.handleClose);
      }
    }, 300);
  }

  open() {
    // disable canvas while dialog is open
    this.gThis.blockGarden.state.isCanvasActionDisabled = true;

    if (!this.dialog) {
      this.createDialog();
    } else {
      this.renderInventory();
    }

    if (this.dialog instanceof HTMLDialogElement) {
      this.dialog.showModal();
    }

    this.isOpen = true;

    if (this.dialog) {
      const autofocusElement = this.dialog.querySelector("[autofocus]");
      if (autofocusElement instanceof HTMLElement) {
        autofocusElement.focus();
      }
    }

    // Unlock pointer if locked
    if (this.doc.pointerLockElement) {
      this.doc.exitPointerLock();
    }

    if (this.dialog instanceof HTMLDialogElement) {
      this.dialog.addEventListener("close", this.handleClose);
    }
  }

  close() {
    if (this.dialog) {
      this.dialog.close();
    }

    this.isOpen = false;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
