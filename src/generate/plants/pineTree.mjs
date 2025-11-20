/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generatePineTreeStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.PINE_TREE_GROWING });

    return blocks;
  }

  const maxHeight = 8;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Trunk grows first
  for (let i = 0; i < currentHeight; i++) {
    blocks.push({ x, y: y - i, tile: tiles.PINE_TRUNK });
  }

  // Needles in conical shape when tree is growing
  if (progress > 0.25) {
    const needleStartY = y - Math.floor(currentHeight * 0.3);
    const needleLayers = Math.ceil(currentHeight * 0.7);

    for (let layer = 0; layer < needleLayers; layer++) {
      const layerY = needleStartY - layer;
      const layerWidth = Math.max(1, Math.floor((needleLayers - layer) / 2));

      for (let dx = -layerWidth; dx <= layerWidth; dx++) {
        if (dx !== 0 || layer !== 0) {
          blocks.push({ x: x + dx, y: layerY, tile: tiles.PINE_NEEDLES });
        }
      }
    }
  }

  // Pine cones when mature
  if (progress > 0.9) {
    const midY = y - Math.floor(currentHeight * 0.5);

    if (Math.random() < 0.5)
      blocks.push({ x: x - 1, y: midY, tile: tiles.PINE_CONE });

    if (Math.random() < 0.5)
      blocks.push({ x: x + 1, y: midY, tile: tiles.PINE_CONE });
  }

  return blocks;
}
