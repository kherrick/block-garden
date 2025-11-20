/**
 * Combined input check
 *
 * @param {any} shadow
 * @param {any} key
 *
 * @returns {any}
 */
export function isKeyPressed(shadow, key) {
  return shadow.host?.keys[key] || shadow.host?.touchKeys[key];
}
