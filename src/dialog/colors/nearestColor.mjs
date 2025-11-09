// Find nearest palette color by Euclidean distance
export function nearestColor(paletteRGB, r, g, b) {
  let minDist = Infinity;
  let best = paletteRGB[0];

  for (const col of paletteRGB) {
    const dist = (r - col[0]) ** 2 + (g - col[1]) ** 2 + (b - col[2]) ** 2;

    if (dist < minDist) {
      minDist = dist;
      best = col;
    }
  }

  return best;
}
