import { colors } from "../state/config/colors.mjs";

/**
 * Generate a texture atlas for all blocks.
 * Currently generates procedural 16x16 textures based on block colors.
 *
 * @param {import('../state/config/blocks.mjs').BlockDefinition[]} blockDefs
 * @returns {HTMLCanvasElement}
 */
export function generateTextureAtlas(blockDefs) {
  const tileSize = 16;
  const atlasSize = 256;
  const canvas = document.createElement("canvas");
  canvas.width = atlasSize;
  canvas.height = atlasSize;
  const ctx = canvas.getContext("2d");

  // Helper to get hex color from block name
  const getColor = (blockName) => {
    const key = blockName.toLowerCase().replace(/ /g, "-");
    const colorVar = colors.block[key];
    if (colorVar && colorVar.startsWith("var(--bg-color-")) {
      const colorKey = colorVar.replace("var(--bg-color-", "").replace(")", "");
      return colors.color[colorKey] || "#ffffff";
    }
    return "#ffffff";
  };

  blockDefs.forEach((block, index) => {
    if (block.name === "Air") return;

    // Calculate position in atlas using block ID
    const id = block.id || 0;
    const x = (id % 16) * tileSize;
    const y = Math.floor(id / 16) * tileSize;

    const baseColor = getColor(block.name);

    // Draw base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, tileSize, tileSize);

    // Add simple procedural pattern (border/noise)
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(x, y, tileSize, 1);
    ctx.fillRect(x, y, 1, tileSize);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x + tileSize - 1, y, 1, tileSize);
    ctx.fillRect(x, y + tileSize - 1, tileSize, 1);

    // Add some "grain"
    for (let i = 0; i < 4; i++) {
      const gx = Math.floor(Math.random() * tileSize);
      const gy = Math.floor(Math.random() * tileSize);
      ctx.fillStyle =
        i % 2 === 0 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
      ctx.fillRect(x + gx, y + gy, 2, 2);
    }
  });

  return canvas;
}
