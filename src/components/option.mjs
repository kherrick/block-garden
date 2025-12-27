export const optionTagName = "block-garden-option";

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

if (!globalThis.customElements?.get(optionTagName)) {
  globalThis.customElements.define(optionTagName, BlockGardenOption);
}
