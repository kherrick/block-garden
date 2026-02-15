import { colors } from "../config/colors.mjs";

/** @typedef {import('../config/blocks.mjs').BlockDefinition} BlockDefinition */

/** @typedef {import('../../systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */

/**
 * Generate a texture atlas for all blocks.
 * Currently generates procedural 16x16 textures based on block colors.
 *
 * @param {BlockDefinition[]} blockDefs
 *
 * @returns {HTMLCanvasElement}
 */
export function generateTextureAtlas(blockDefs) {
  const tileSize = 16;
  const atlasSize = 256;
  const gThis = /** @type {BlockGardenGlobalThis} */ (globalThis);
  const canvas = gThis.document.createElement("canvas");

  canvas.width = atlasSize;
  canvas.height = atlasSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D canvas context");
  }

  // Seeded pseudo-random function for deterministic grain
  const seededRandom =
    /** @type {function(number): number} */
    (seed) => {
      const x = Math.sin(seed) * 10000;

      return x - Math.floor(x);
    };

  /** @param {string} _blockName */
  const getColor = (_blockName) => {
    return "#ffffff";
  };

  blockDefs.forEach((block) => {
    if (block.name === "Air") {
      return;
    }

    // Calculate position in atlas using block ID
    const id = block.id || 0;
    const x = (id % 16) * tileSize;
    const y = Math.floor(id / 16) * tileSize;

    const baseColor = getColor(block.name);

    // Draw base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, tileSize, tileSize);

    // Add slight highlights and shadows for depth without darkening
    // Use lighter colors for highlights, darker accents for depth
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + tileSize - 2, y, 2, tileSize);
    ctx.fillRect(x, y + tileSize - 2, tileSize, 2);

    // Subtle dark accents for contrast
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(x, y, tileSize, 1);
    ctx.fillRect(x, y, 1, tileSize);

    // Add grain for visual interest using block ID as seed for consistency
    for (let i = 0; i < 8; i++) {
      const seed = id * 73 + i * 41;
      const gx = Math.floor(seededRandom(seed) * tileSize);
      const gy = Math.floor(seededRandom(seed + 1) * tileSize);
      const isDark = seededRandom(seed + 2) < 0.5;

      ctx.fillStyle = isDark
        ? `rgba(0,0,0,${0.04 + seededRandom(seed + 3) * 0.04})`
        : `rgba(255,255,255,${0.04 + seededRandom(seed + 4) * 0.04})`;

      ctx.fillRect(x + gx, y + gy, 2, 2);
    }
  });

  // Draw crack stages at reserved IDs 240-249 (10 stages)
  // Stage 0 (ID 240) = subtle cracks, Stage 9 (ID 249) = extreme cracks
  for (let stage = 0; stage < 10; stage++) {
    const id = 240 + stage;
    const x = (id % 16) * tileSize;
    const y = Math.floor(id / 16) * tileSize;

    // Background should be transparent for cracks
    ctx.clearRect(x, y, tileSize, tileSize);

    // Draw crack pattern
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    const numCracks = stage + 1;
    for (let i = 0; i < numCracks; i++) {
      let curX = x + Math.random() * tileSize;
      let curY = y + Math.random() * tileSize;

      ctx.moveTo(curX, curY);

      const segments = 3 + stage;
      for (let j = 0; j < segments; j++) {
        curX += (Math.random() - 0.5) * (tileSize / 2);
        curY += (Math.random() - 0.5) * (tileSize / 2);

        // Clamp to tile bounds
        curX = Math.max(x, Math.min(x + tileSize, curX));
        curY = Math.max(y, Math.min(y + tileSize, curY));

        ctx.lineTo(curX, curY);
      }
    }

    ctx.stroke();
  }

  return canvas;
}
