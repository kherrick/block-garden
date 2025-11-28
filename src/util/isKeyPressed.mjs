/**
 * Checks if a key or touch button is currently pressed.
 *
 * Checks both keyboard input and touch control buttons from shadow host.
 *
 * @param {ShadowRoot} shadow - Shadow root containing the host element with input state
 * @param {string} key - The key code or touch button name to check
 *
 * @returns {boolean} True if the key or button is pressed, false otherwise
 */
export function isKeyPressed(shadow, key) {
  const host = shadow.host;
  if (
    host &&
    typeof host === "object" &&
    "keys" in host &&
    "touchKeys" in host
  ) {
    return host.keys[key] || host.touchKeys[key];
  }
  return false;
}
