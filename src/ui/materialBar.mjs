import { getBlockById } from "../core/world/config/blocks.mjs";

/** @typedef {import('../utils/colors/index.mjs').Colors} Colors */

/**
 *
 * @param {Colors} gameColors
 *
 * @returns {Function}
 */
export function initMaterialBar(gameColors) {
  /**
   * @param {ShadowRoot} shadow
   * @param {number[]} materialBar
   * @param {number} activeSlot
   * @param {Record<string, number>} [materialsInventory={}]
   * @param {Record<string, number>} [seedsInventory={}]
   *
   * @returns {void}
   */
  return function (
    shadow,
    materialBar,
    activeSlot,
    materialsInventory = {},
    seedsInventory = {},
  ) {
    const materialBarEl = shadow.getElementById("materialBar");

    if (!materialBarEl) {
      return;
    }

    const { gameConfig } = /** @type {any} */ (globalThis).blockGarden;
    const isCreative = gameConfig?.useCreativeMode.get();

    /**
     * @param {string} name
     */
    const toKey = (name) => name.toUpperCase().replace(/ /g, "_");

    materialBarEl.innerHTML = materialBar
      .map((blockId, index) => {
        const block = getBlockById(blockId);

        const blockNameKey =
          block?.name.toLowerCase().replace(/ /g, "-") || "air";

        const blockName = block?.name || "Air";

        const nameKey = toKey(blockName);
        const count = block?.isSeed
          ? seedsInventory[nameKey] || 0
          : materialsInventory[nameKey] || 0;

        const colorVar =
          gameColors.block[blockNameKey] || `var(--bg-color-gray-500)`;

        const isLightingBlock =
          (block?.emissive || 0) > 0 && block?.name !== "Lava";
        const displayCount = isLightingBlock ? "\u221E" : count;

        const activeClass = index === activeSlot ? "active" : "";
        const isDisabled =
          !isCreative && count === 0 && blockId !== 0 && !isLightingBlock;
        const disabledClass = isDisabled ? "is-disabled" : "";

        return `
          <div class="materialBar-slot ${activeClass} ${disabledClass}" data-index="${index}" tabindex="0" title="${blockName}${!isCreative ? ` (${displayCount})` : ""}">
            <div class="materialBar-slot-number">${index + 1}</div>
            ${!isCreative || typeof displayCount === "number" ? `<div class="materialBar-slot-count">${displayCount}</div>` : ""}
            <div class="materialBar-slot-cube">
              <div class="materialBar-cube-face materialBar-cube-front" style="background-color: ${colorVar};"></div>
              <div class="materialBar-cube-face materialBar-cube-top" style="background-color: ${colorVar};"></div>
              <div class="materialBar-cube-face materialBar-cube-right" style="background-color: ${colorVar};"></div>
            </div>
            <div class="materialBar-slot-name">${blockName}</div>
          </div>
        `;
      })
      .join("");
  };
}
