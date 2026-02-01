import { getBlockById } from "../world/config/blocks.mjs";

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
   *
   * @returns {void}
   */
  return function (shadow, materialBar, activeSlot) {
    const materialBarEl = shadow.getElementById("materialBar");

    if (!materialBarEl) {
      return;
    }

    materialBarEl.innerHTML = materialBar
      .map((blockId, index) => {
        const block = getBlockById(blockId);

        const blockNameKey =
          block?.name.toLowerCase().replace(/ /g, "-") || "air";

        const blockName = block?.name || "Air";

        const colorVar =
          gameColors.block[blockNameKey] || `var(--bg-color-gray-500)`;

        const activeClass = index === activeSlot ? "active" : "";

        return `
          <div class="materialBar-slot ${activeClass}" data-index="${index}" tabindex="0" title="${blockName}">
            <div class="materialBar-slot-number">${index + 1}</div>
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
