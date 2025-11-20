/**
 * @param {any} gThis
 * @param {any} text
 *
 * @returns {Promise<void>}
 */
export async function copyToClipboard(gThis, text) {
  const nav = gThis.navigator;

  if (nav.clipboard && gThis.isSecureContext) {
    try {
      await nav.clipboard.writeText(text);
    } catch (e) {}
  }
}
