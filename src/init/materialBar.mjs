/** @typedef {import('../state/config/blocks.mjs').BlockDefinition} BlockDefinition */
/** @typedef {import('../util/colors/index.mjs').Colors} Colors */
import { getBlockById } from "../state/config/blocks.mjs";

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
   * @param {BlockDefinition[]} blocks
   *
   * @returns {void}
   */
  return function (shadow, materialBar, activeSlot, blocks) {
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
          <div class="materialBar-slot ${activeClass}" data-index="${index}" title="${blockName}">
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
