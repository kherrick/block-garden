import { SpriteGarden } from "../SpriteGarden.mjs";

export class Heart extends SpriteGarden {
  drawBigBitmapHeart(bottomCenterX, bottomCenterY, tile = this.tiles.LAVA) {
    const heartBitmap = [
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    const width = heartBitmap[0].length;
    const height = heartBitmap.length;
    const leftX = bottomCenterX - Math.floor(width / 2);

    // Use drawBitmap but need to flip Y coordinate
    const updates = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (heartBitmap[y][x] === 1) {
          // Y index runs bottom up
          let tileX = leftX + x;
          let tileY = bottomCenterY - (height - 1 - y);
          updates.push({ x: tileX, y: tileY, tile });
        }
      }
    }

    this.batchSetTiles(updates);

    return {
      x: leftX,
      y: bottomCenterY - height,
      width,
      height,
    };
  }
}

export async function demo() {
  const api = new Heart();

  // Setup
  await api.setFullscreen();
  api.setFogMode("clear");
  api.setBreakMode("extra");

  console.log("🎮 SpriteGarden Demo: Big Bitmap Heart");

  // Draw a big lava heart
  api.drawBigBitmapHeart(225, 50, api.tiles.LAVA);

  const apiText = "spriteGarden.demo.heartAPI";

  console.log("❤️ Big heart drawn!");
  console.log(`💡 Use ${apiText}.drawBigBitmapHeart(x, y, tile) to draw more!`);
  console.log(
    `💡 Example: ${apiText}.drawBigBitmapHeart(300, 50, ${apiText}.tiles.ICE)`,
  );

  // Expose to console for interaction
  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    heartAPI: api,
  };
}
