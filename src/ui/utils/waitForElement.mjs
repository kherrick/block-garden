/**
 * Wait for an element to appear, or reject on timeout.
 *
 * waitForElement({
 *   getElement: () => shadow.getElementById('elementId'),
 *   intervalMs: 150,
 *   timeoutMs: 2000,
 * })
 *   .then((closeBtn) => {
 *     closeBtn.focus();
 *   })
 *   .catch((err) => {
 *     console.warn(err);
 *   });
 *
 * @param {Object} options
 * @param {() => (Element|null)} options.getElement
 * @param {number} [options.intervalMs=150]
 * @param {number} [options.timeoutMs=2000]
 *
 * @returns {Promise<Element>}
 */
export function waitForElement({
  getElement,
  intervalMs = 150,
  timeoutMs = 2000,
}) {
  return new Promise((resolve, reject) => {
    const start = performance.now();

    function poll() {
      const el = getElement();
      if (el) {
        resolve(el);

        return;
      }

      const elapsed = performance.now() - start;
      if (elapsed < timeoutMs) {
        setTimeout(poll, intervalMs);
      } else {
        reject(new Error("Timed out waiting for element"));
      }
    }

    poll();
  });
}
