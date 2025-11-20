/**
 * @param {any} x
 * @param {any} y
 * @param {any} progress
 * @param {any} tiles
 *
 * @returns {{ x: any; y: any; tile: any; }[]}
 */
export function generatePumpkinStructure(x, y, progress, tiles) {
  const blocks = [];

  // Early stage
  if (progress < 0.1) {
    blocks.push({ x, y, tile: tiles.PUMPKIN_GROWING });

    return blocks;
  }

  // Vines spread along ground
  if (progress > 0.2) {
    const vineLength = Math.ceil(progress * 3);

    for (let i = 0; i < vineLength; i++) {
      blocks.push({ x: x + i, y, tile: tiles.PUMPKIN_VINE });
      blocks.push({ x: x - i, y, tile: tiles.PUMPKIN_VINE });
    }
  }

  // Add leaves along vines
  if (progress > 0.4) {
    const leafSpacing = 2;
    const vineLength = Math.ceil(progress * 3);

    for (let i = leafSpacing; i < vineLength; i += leafSpacing) {
      blocks.push({ x: x + i, y: y - 1, tile: tiles.PUMPKIN_LEAVES });
      blocks.push({ x: x - i, y: y - 1, tile: tiles.PUMPKIN_LEAVES });
    }
  }

  // Pumpkin fruit grows
  if (progress > 0.6) {
    const fruitSize = Math.ceil((progress - 0.6) * 5);

    blocks.push({ x, y, tile: tiles.PUMPKIN_FRUIT });

    if (fruitSize > 1) {
      blocks.push({ x: x + 1, y, tile: tiles.PUMPKIN_FRUIT });
      blocks.push({ x: x - 1, y, tile: tiles.PUMPKIN_FRUIT });
    }

    if (fruitSize > 2) {
      blocks.push({ x: x + 1, y: y + 1, tile: tiles.PUMPKIN_FRUIT });
      blocks.push({ x: x - 1, y: y + 1, tile: tiles.PUMPKIN_FRUIT });
    }
  }

  // Add stem when mature
  if (progress > 0.9) {
    blocks.push({ x, y: y - 1, tile: tiles.PUMPKIN_STEM });
  }

  return blocks;
}
