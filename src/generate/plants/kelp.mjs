/** @typedef {import('../../state/config/tiles.mjs').TileMap} TileMap */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} progress
 * @param {TileMap} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generateKelpStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.KELP_GROWING });

    return blocks;
  }

  const maxHeight = 6;
  const currentHeight = Math.max(1, Math.ceil(maxHeight * progress));

  // Kelp grows upward in wavy pattern
  for (let i = 0; i < currentHeight; i++) {
    // Create wavy effect
    const wave = Math.floor(Math.sin(i * 0.5) * 1.5);

    blocks.push({ x: x + wave, y: y - i, tile: tiles.KELP_BLADE });

    // Add bulbs periodically
    if (progress > 0.5 && i % 2 === 1 && i < currentHeight - 1) {
      blocks.push({ x: x + wave, y: y - i, tile: tiles.KELP_BULB });
    }
  }

  return blocks;
}
