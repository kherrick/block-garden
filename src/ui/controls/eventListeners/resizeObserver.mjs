import { debounce } from "../../../utils/debounce.mjs";
import { resizeCanvas } from "../../../api/ui/resizeCanvas.mjs";

/** @typedef {import('signal-polyfill').Signal.State} Signal.State */

/**
 * Initializes a ResizeObserver for the shadow host.
 *
 * @param {ShadowRoot} shadow
 * @param {Signal.State} currentResolution
 */
export function initResizeObserver(shadow, currentResolution) {
  const debouncedResize = debounce(() => {
    resizeCanvas(shadow, currentResolution);
  }, 200);

  const resizeObserver = new ResizeObserver((entries) => {
    debouncedResize();
  });

  resizeObserver.observe(shadow.host);

  return resizeObserver;
}
