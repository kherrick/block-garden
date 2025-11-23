/**
 * Apply custom colors to ShadowRoot Host
 *
 * @param {any} shadow
 * @param {any} colorProps
 *
 * @returns {void}
 */
export function applyColorsToShadowHost(shadow, colorProps) {
  for (const [property, value] of Object.entries(colorProps)) {
    shadow.host.style.setProperty(property, value);
  }
}
