/**
 * Poll for an element and run a callback when found.
 *
 * pollForElement({
 *   getElement: () => shadow.getElementById('elementId'),
 *   onFound: (closeBtn) => {
 *     closeBtn.focus();
 *   },
 *   intervalMs: 150,
 *   timeoutMs: 2000,
 * });
 *
 * @param {Object} options
 * @param {() => (Element|null)} options.getElement - Function that returns the element (or null/undefined).
 * @param {(el: Element) => void} options.onFound - Called when the element is found.
 * @param {number} [options.intervalMs=150] - Interval between polls in ms.
 * @param {number} [options.timeoutMs=2000] - Max total time to poll in ms.
 */
export function pollForElement({
  getElement,
  onFound,
  intervalMs = 150,
  timeoutMs = 2000,
}) {
  const start = performance.now();

  function poll() {
    const el = getElement();

    if (el) {
      onFound(el);

      return;
    }

    const elapsed = performance.now() - start;
    if (elapsed < timeoutMs) {
      setTimeout(poll, intervalMs);
    }
  }

  poll();
}
