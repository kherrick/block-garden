/**
 * Extract all --sg CSS custom properties
 *
 * @param {any} gThis
 * @param {any} shadow
 *
 * @returns {{}}
 */
export function getCustomProperties(gThis, shadow) {
  const styles = gThis.getComputedStyle(shadow.host);
  const sgProperties = {};

  for (const propName of styles) {
    if (propName.startsWith("--sg-")) {
      const value = styles.getPropertyValue(propName).trim();

      sgProperties[propName] = value;
    }
  }

  return sgProperties;
}
