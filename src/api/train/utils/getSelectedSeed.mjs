/**
 * Retrieves the text content of the currently selected seed element from the UI.
 *
 * @param {ShadowRoot|null|undefined} shadowRoot - The shadow root to query for the selected seed element.
 * @returns {string} The trimmed text content of the selected seed element, or an empty string if not found or an error occurs.
 */
export function getSelectedSeed(shadowRoot) {
  if (!shadowRoot) {
    return "";
  }
  try {
    return shadowRoot.querySelector("#selectedSeed")?.textContent?.trim() || "";
  } catch {
    return "";
  }
}
