import { BlockGarden, tagName } from "./src/ui/BlockGarden.mjs";

export { BlockGarden, tagName };

if (!globalThis.customElements?.get(tagName)) {
  globalThis.customElements?.define(tagName, BlockGarden);
}
