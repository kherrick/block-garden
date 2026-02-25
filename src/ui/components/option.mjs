export const optionTagName = "block-garden-option";

/** @typedef {import('../../core/systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */

/**
 * Option component for Block Garden Select
 */
export class BlockGardenOption extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  get value() {
    return this.getAttribute("value") || "";
  }

  set value(val) {
    this.setAttribute("value", val);
  }
}

const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
if (!gThis.customElements?.get(optionTagName)) {
  gThis.customElements.define(optionTagName, BlockGardenOption);
}
