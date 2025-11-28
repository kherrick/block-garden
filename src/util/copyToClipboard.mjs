/**
 * Copies text to the system clipboard using the modern Clipboard API.
 *
 * Silently fails if not in secure context or API unavailable.
 * Should only be called in response to user interaction.
 *
 * @param {typeof globalThis} gThis - Global this (window object)
 * @param {string} text - The text to copy to clipboard
 *
 * @returns {Promise<void>} Promise that resolves when copy is complete (or fails silently)
 */
export async function copyToClipboard(gThis, text) {
  const nav = gThis.navigator;

  if (nav.clipboard && gThis.isSecureContext) {
    try {
      await nav.clipboard.writeText(text);
    } catch (e) {}
  }
}
