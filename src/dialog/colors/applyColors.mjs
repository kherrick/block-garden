/**
 * Apply custom colors to CSS
 *
 * @param {any} shadow
 * @param {any} colorProps
 *
 * @returns {void}
 */
export function applyColors(shadow, colorProps) {
  for (const [property, value] of Object.entries(colorProps)) {
    shadow.host.style.setProperty(property, value);
  }
}
