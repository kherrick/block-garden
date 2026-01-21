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
