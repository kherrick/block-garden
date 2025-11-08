// Combined input check
export function isKeyPressed(shadow, key) {
  return shadow.host?.keys[key] || shadow.host?.touchKeys[key];
}
