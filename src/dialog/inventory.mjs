import { gameConfig } from "../state/config/index.mjs";
import { getBlockIdByName } from "../state/config/getBlockIdByName.mjs";
import { setMaterialBarItem } from "../state/state.mjs";

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
  }

  async initBlockColors() {
    try {
      const colorsModule = await import("../state/config/colors.mjs");
      this.blockColors = colorsModule.colors.block || {};
    } catch (e) {
      console.error("Failed to load block colors", e);
    }
  }

  async createDialog() {
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

        .inventory-slot:hover {
          background-color: rgba(255, 255, 255, 0.1);
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
          line-height: 1;
          max-width: 3rem;
          text-align: center;
          text-shadow: 0 0 2px black;
          word-break: break-word;
        }
      </style>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
        <h3 style="margin: 0">Material Inventory</h3>
        <button id="closeInventoryDialog" style="background: var(--bg-color-red-500); border: none; color: white; border-radius: 0.25rem; cursor: pointer; padding: 0.25rem 0.5rem;">&times;</button>
      </div>
      <div id="inventoryGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr)); gap: 0.5rem;">
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

    grid.innerHTML = blocks
      .filter((block) => block.name !== "Air")
      .map((block) => {
        const blockNameKey = block.name.toLowerCase().replace(/ /g, "-");
        const colorVar =
          this.blockColors[blockNameKey] || `var(--bg-color-gray-500)`;

        return `
         <div
            class="inventory-slot"
            data-id="${getBlockIdByName(block.name)}"
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
      })
      .join("");

    grid.querySelectorAll(".inventory-slot").forEach((slot) => {
      slot.addEventListener("click", (e) => {
        const target =
          e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
        if (target) {
          const id = Number(target.dataset.id);
          this.handleBlockClick(id);
        }
      });
    });
  }

  handleBlockClick(blockId) {
    setMaterialBarItem(blockId);
  }

  open() {
    if (!this.dialog) {
      this.createDialog();
    }
    this.dialog.showModal();
    this.isOpen = true;

    // Unlock pointer if locked
    if (this.doc.pointerLockElement) {
      this.doc.exitPointerLock();
    }
  }

  close() {
    if (this.dialog) {
      this.dialog.close();
    }

    this.isOpen = false;
    // Don't auto-lock pointer
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
