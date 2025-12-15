/**
 * Finds and returns all seed button elements from a given shadow root.
 *
 * @param {ShadowRoot} shadow - The shadow root to query for seed buttons.
 *
 * @returns {HTMLButtonElement[]} An array of found seed button elements. Returns an empty array if no shadow root is provided or if an error occurs.
 */
export function getSeedButtons(shadow) {
  if (!shadow) {
    return [];
  }
  try {
    return Array.from(
      /** @type {NodeListOf<HTMLButtonElement>} */ (
        shadow.querySelectorAll("button.seed-btn") || []
      ),
    );
  } catch {
    return [];
  }
}
