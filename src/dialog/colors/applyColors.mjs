// Apply custom colors to CSS
export function applyColors(shadow, colorProps) {
  for (const [property, value] of Object.entries(colorProps)) {
    shadow.host.style.setProperty(property, value);
  }
}
