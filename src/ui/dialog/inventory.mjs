import { gameConfig } from "../../world/config/index.mjs";

import { setMaterialBarItem } from "../../core/systems/game/state.mjs";

export class InventoryDialog {
  /**
   * @param {typeof globalThis} globalThis
   * @param {Document} doc
   * @param {ShadowRoot} shadow
   */
  constructor(globalThis, doc, shadow) {
    this.gThis = globalThis;
    this.doc = doc;
    this.shadow = shadow;

    this.dialog = null;
    this.isOpen = false;
    this.blockColors = {};

    this.initBlockColors();

    this.handleClose = this.handleClose.bind(this);
  }

  async initBlockColors() {
    try {
      const colorsModule = await import("../../world/config/colors.mjs");

      this.blockColors = colorsModule.colors.block || {};
    } catch (e) {
      console.error("Failed to load block colors", e);
    }
  }

  async createDialog() {
    // disable canvas while dialog is open
    this.gThis.blockGarden.state.isCanvasActionDisabled = true;

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
          transition: all 0.2s;
        }

        .inventory-slot:hover,
        .inventory-slot:focus-visible {
          background-color: rgba(255, 255, 255, 0.1);
          outline: 0.125rem solid var(--bg-color-gray-600);
          outline-offset: 0.125rem;
          transform: translateY(-0.25rem);
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

    const closeBtn = dialog.querySelector("#closeInventoryDialog");
    closeBtn.addEventListener("click", () => this.close());

    dialog.addEventListener("cancel", () => this.close());

    return dialog;
  }

  renderInventory() {
    const grid = this.dialog.querySelector("#inventoryGrid");
    const blocks = gameConfig.blocks;

    // Identify all seed blocks for grouping
    const seeds = blocks.filter((b) => b.isSeed);
    const plantPrefixes = seeds.flatMap((s) => {
      const prefixes = [s.name];
      if (s.name.endsWith(" Tree")) {
        prefixes.push(s.name.replace(" Tree", ""));
      }

      return prefixes;
    });

    // Categorize all blocks
    const categories = {
      plants: { title: "🌱 Plants & Seeds", blocks: [] },
      natural: { title: "⛰️ Natural Materials", blocks: [] },
      lighting: { title: "🏮 Lighting", blocks: [] },
      system: { title: "⚙️ System Utilities", blocks: [] },
    };

    blocks
      .filter((block) => block.name !== "Air")
      .forEach((block) => {
        const name = block.name.toUpperCase();

        // System
        if (name === "LINK" || name === "TEXT") {
          categories.system.blocks.push(block);
        }
        // Lighting
        else if (block.emissive > 0) {
          categories.lighting.blocks.push(block);
        }
        // Plants
        else if (
          block.isSeed ||
          block.crop ||
          plantPrefixes.some((p) => block.name.startsWith(p))
        ) {
          categories.plants.blocks.push(block);
        }
        // Natural
        else {
          categories.natural.blocks.push(block);
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
    const alphaSort = (a, b) => a.name.localeCompare(b.name);
    categories.natural.blocks.sort(alphaSort);
    categories.system.blocks.sort(alphaSort);
    categories.lighting.blocks.sort(alphaSort);

    // Build HTML
    let html = "";
    Object.values(categories).forEach((cat) => {
      if (cat.blocks.length === 0) return;

      html += `<div class="inventory-category-title">${cat.title}</div>`;

      cat.blocks.forEach((block) => {
        const blockNameKey = block.name.toLowerCase().replace(/ /g, "-");

        const colorVar =
          this.blockColors[blockNameKey] || `var(--bg-color-gray-500)`;

        const isSeedClass = block.isSeed ? "is-seed" : "";

        html += `
          <div
            class="inventory-slot ${isSeedClass}"
            data-id="${block.id}"
            tabindex="0"
            title="${block.name}"
          >
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

        if (target) {
          const id = Number(target.dataset.id);

          this.handleBlockClick(id);
        }
      });

      slot.addEventListener("keydown", (/** @type {KeyboardEvent} */ e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();

          const target =
            e.currentTarget instanceof HTMLElement ? e.currentTarget : null;

          if (target) {
            const id = Number(target.dataset.id);

            this.handleBlockClick(id);
          }
        }
      });
    });
  }

  handleBlockClick(blockId) {
    setMaterialBarItem(blockId);

    this.close();
  }

  handleClose() {
    setTimeout(() => {
      // re-enable canvas after dialog is closed
      this.gThis.blockGarden.state.isCanvasActionDisabled = false;

      this.dialog.removeEventListener("close", this.handleClose);
    }, 300);
  }

  open() {
    // disable canvas while dialog is open
    this.gThis.blockGarden.state.isCanvasActionDisabled = true;

    if (!this.dialog) {
      this.createDialog();
    }

    this.dialog.showModal();

    this.isOpen = true;

    const autofocusElement = this.dialog.querySelector("[autofocus]");
    if (autofocusElement instanceof HTMLElement) {
      autofocusElement.focus();
    }

    // Unlock pointer if locked
    if (this.doc.pointerLockElement) {
      this.doc.exitPointerLock();
    }

    this.dialog.addEventListener("close", this.handleClose);
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
