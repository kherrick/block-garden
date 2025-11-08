export async function copyToClipboard(gThis, text) {
  const nav = gThis.navigator;

  if (nav.clipboard && gThis.isSecureContext) {
    try {
      await nav.clipboard.writeText(text);
    } catch (e) {}
  }
}
