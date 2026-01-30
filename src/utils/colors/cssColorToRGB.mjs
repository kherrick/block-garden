/**
 * Converts a CSS color string to an RGB array.
 *
 * Supports hex colors (#rgb, #rgba, #rrggbb, #rrggbbaa) and rgb(a) strings.
 * Alpha channel is ignored, and fallback is black ([0,0,0]) if the input color is invalid.
 *
 * @param {Document} doc - The document object used to create a canvas context for parsing.
 * @param {string} cssColor - The CSS color string to convert (e.g., "#ff0000", "rgb(255, 0, 0)", "red").
 * @returns {number[]} An array of three integers [red, green, blue], each in the range 0–255.
 */
export function cssColorToRGB(doc, cssColor) {
  const ctx = doc.createElement("canvas").getContext("2d");
  ctx.fillStyle = cssColor;

  const computed = ctx.fillStyle;

  // Match hex colors (#rgb, #rgba, #rrggbb, #rrggbbaa)
  const hexMatch = computed.match(
    /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  );

  if (hexMatch) {
    let hex = hexMatch[1];

    if (hex.length === 3 || hex.length === 4)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return [r, g, b];
  }

  // Match rgb or rgba with optional spaces
  const rgbMatch = computed.match(
    /^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)/i,
  );

  if (rgbMatch)
    return [
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3]),
    ];

  // Fallback black if parsing fails
  return [0, 0, 0];
}
