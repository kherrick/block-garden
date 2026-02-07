import { debounce } from "../../../utils/debounce.mjs";
import { resizeCanvas } from "../../../api/ui/resizeCanvas.mjs";

/** @typedef {import('signal-polyfill').Signal.State<any>} Signal.State */

/**
 * Initializes a ResizeObserver for the shadow host.
 *
 * @param {ShadowRoot} shadow
 * @param {import('signal-polyfill').Signal.State<string>} currentResolution
 */
export function initResizeObserver(shadow, currentResolution) {
  const debouncedResize = debounce(() => {
    resizeCanvas(shadow, /** @type {any} */ (currentResolution));
  }, 200);

  const resizeObserver = new ResizeObserver((entries) => {
    debouncedResize();
  });

  resizeObserver.observe(shadow.host);

  return resizeObserver;
}
