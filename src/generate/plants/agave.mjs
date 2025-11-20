/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateAgaveStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.AGAVE_GROWING });

    return blocks;
  }

  // Central base
  blocks.push({ x, y, tile: tiles.AGAVE_BASE });

  // Rosette of spiky leaves
  if (progress > 0.2) {
    const spikeRadius = Math.min(3, Math.ceil((progress - 0.2) * 4));

    // Create radial spike pattern
    for (let dx = -spikeRadius; dx <= spikeRadius; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;

        const distance = Math.abs(dx) + Math.abs(dy);

        if (distance <= spikeRadius && distance > 0) {
          blocks.push({ x: x + dx, y: y + dy, tile: tiles.AGAVE_SPIKE });
        }
      }
    }
  }

  // Tall flower stalk when very mature
  if (progress > 0.8) {
    const stalkHeight = Math.ceil((progress - 0.8) * 30);

    for (let i = 1; i <= stalkHeight; i++) {
      blocks.push({ x, y: y - i, tile: tiles.AGAVE_FLOWER_STALK });
    }

    // Flowers at top
    if (progress > 0.95) {
      const flowerY = y - stalkHeight;

      blocks.push({ x, y: flowerY, tile: tiles.AGAVE_FLOWER });
      blocks.push({ x: x - 1, y: flowerY, tile: tiles.AGAVE_FLOWER });
      blocks.push({ x: x + 1, y: flowerY, tile: tiles.AGAVE_FLOWER });
    }
  }

  return blocks;
}
