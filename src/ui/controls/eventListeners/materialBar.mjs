import { InventoryDialog } from "../../dialog/inventory.mjs";
import { selectMaterialBarSlot } from "../../../core/systems/game/state.mjs";

/** @typedef {import('../../../core/systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */

/**
 * Toggles the visibility of the material bar and manages game state/focus.
 *
 * @param {ShadowRoot} shadow
 * @param {import('../../../core/systems/game/state.mjs').GameState} gameState
 * @param {HTMLCanvasElement} cnvs
 * @param {boolean} [forceClose=false]
 */
export function toggleMaterialBar(shadow, gameState, cnvs, forceClose = false) {
  const materialBar = shadow.getElementById("materialBar");
  const material = shadow.querySelector("#material .ui-grid__corner--heading");

  if (!materialBar || !material) {
    return;
  }

  if (forceClose) {
    materialBar.setAttribute("hidden", "hidden");
  } else {
    materialBar.toggleAttribute("hidden");
  }

  const isHidden = materialBar.hasAttribute("hidden");

  if (isHidden) {
    material.textContent = "🔍 Material";

    cnvs.focus();
  } else {
    material.textContent = "❌ Material";

    // Focus the active slot when opening
    const activeSlotIndex = gameState.activeMaterialBarSlot.get();
    const slots = materialBar.querySelectorAll(".materialBar-slot");
    if (slots[activeSlotIndex]) {
      /** @type {HTMLElement} */ (slots[activeSlotIndex]).focus();
    }
  }
}

/**
 * Initialize material bar event listeners.
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 *
 * @returns {void}
 */
export function initMaterialBarEventListeners(shadow, cnvs) {
  const materialBarEl = shadow.getElementById("materialBar");
  if (!materialBarEl) {
    return;
  }

  // Add click listeners to material bar slots
  materialBarEl.addEventListener("click", (e) => {
    const slot =
      e.target instanceof Element
        ? e.target.closest(".materialBar-slot")
        : null;

    if (slot instanceof HTMLElement) {
      const index = parseInt(slot.dataset.index || "0");

      e.stopPropagation();

      selectMaterialBarSlot(index);

      cnvs.focus();
    }
  });

  materialBarEl.addEventListener("keydown", (/** @type {any} */ e) => {
    const slot =
      e.target instanceof Element
        ? e.target.closest(".materialBar-slot")
        : null;

    if (!(slot instanceof HTMLElement)) {
      return;
    }

    if (e.key === "e" || e.key === "i") {
      e.preventDefault();

      const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
      const inventoryDialog = new InventoryDialog(
        gThis,
        gThis.document,
        shadow,
      );

      inventoryDialog.open();

      return;
    }

    // Handle Enter or Space to select the current slot
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();

      const index = parseInt(slot.dataset.index || "0");
      selectMaterialBarSlot(index);

      cnvs.focus();

      return;
    }

    // Handle arrow keys to navigate between slots
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();

      const allSlots = Array.from(
        materialBarEl.querySelectorAll(".materialBar-slot"),
      );

      const currentIndex = allSlots.indexOf(slot);

      let nextIndex = currentIndex;

      if (e.key === "ArrowLeft") {
        nextIndex = currentIndex === 0 ? allSlots.length - 1 : currentIndex - 1;
      } else if (e.key === "ArrowRight") {
        nextIndex = currentIndex === allSlots.length - 1 ? 0 : currentIndex + 1;
      }

      /** @type {HTMLElement} */ (allSlots[nextIndex]).focus();
    }
  });
}
