import { blockNames } from "../../state/config/blocks.mjs";

import { applyColorsToShadowHost } from "../../util/colors/applyColorsToShadowHost.mjs";
import { cssColorToRGB } from "../../util/colors/cssColorToRGB.mjs";
import { nearestColor } from "../../util/colors/nearestColor.mjs";
import { transformStyleMapByStyleDeclaration } from "../../util/colors/transformStyleMapByStyleDeclaration.mjs";

import { BlockGarden } from "../BlockGarden.mjs";

export class DrawBitmap extends BlockGarden {
  async loadAndResizeImageData(imageUrl, maxSize = 64) {
    let image;

    try {
      image = await new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => res(img);
        img.onerror = () => rej(new Error(`Failed to load ${imageUrl}`));
        img.src = imageUrl;
      });
    } catch (e) {
      console.error("❌ Image load failed:", e.message);
      return null;
    }

    const targetWidth =
      image.width >= image.height
        ? maxSize
        : Math.round((image.width / image.height) * maxSize);
    const targetHeight =
      image.width >= image.height
        ? Math.round((image.height / image.width) * maxSize)
        : maxSize;

    const offCanvas = this.doc.createElement("canvas");

    offCanvas.width = targetWidth;
    offCanvas.height = targetHeight;

    const offCtx = offCanvas.getContext("2d");
    offCtx.drawImage(image, 0, 0, targetWidth, targetHeight);

    return {
      pixels: offCtx.getImageData(0, 0, targetWidth, targetHeight).data,
      targetWidth,
      targetHeight,
    };
  }

  /**
   * Get an ideal color map for an image.
   *
   * @param {string} imageUrl - URL of the image to analyze.
   * @param {number} [maxSize=64] - Maximum size to scale the image before processing.
   * @param {Set} [bannedBlocks=new Set()] - Set of blocks to exclude from consideration.
   *
   * @returns {Promise<{ [property: string]: string }>} Resolves to an object mapping CSS props to color hexes.
   */
  async getIdealColorMapForImage(
    imageUrl,
    maxSize = 64,
    bannedBlocks = new Set(),
  ) {
    const imageData = await this.loadAndResizeImageData(imageUrl, maxSize);
    if (!imageData) {
      return null;
    }

    const { pixels, targetWidth, targetHeight } = imageData;
    return this.getIdealColorMapForPixels(
      pixels,
      targetWidth,
      targetHeight,
      bannedBlocks,
    );
  }
  /**
   * Draw a bitmap with color quantization and 3D rotation
   */
  async drawQuantizedBitmap(
    imageUrl,
    modifyWorldColors = false,
    maxSize = 64,
    x = null,
    y = null,
    z = 0,
    rotation = { x: 0, y: 0, z: 0 },
  ) {
    console.log("🎨 Quantizing and drawing bitmap:", imageUrl);

    if (modifyWorldColors) {
      const idealColors = await this.getIdealColorMapForImage(
        imageUrl,
        maxSize,
      );

      if (idealColors) {
        await applyColorsToShadowHost(this.shadow, idealColors);
      }
    }

    const blockColorMap = transformStyleMapByStyleDeclaration(
      this.gThis.getComputedStyle(this.shadow.host),
      "--bg-block-",
    );

    const paletteRGB = [];
    const rgbToBlockName = {};
    const blockNameToId = {};

    for (const [rawBlockName, cssColor] of Object.entries(blockColorMap)) {
      const blockName = this.normalizeBlockName(rawBlockName);
      const displayName = blockNames[blockName];
      if (!displayName) {
        continue;
      }

      const blockId = this.getBlockIdByName(displayName);
      if (blockId === -1) {
        continue;
      }

      const blockDef = this.config.blocks.find((b) => b.id === blockId);
      if (blockDef && blockDef.gravity) {
        continue;
      }

      const rgb = cssColorToRGB(this.doc, cssColor);
      if (!rgb) {
        continue;
      }

      paletteRGB.push(rgb);
      rgbToBlockName[rgb.join(",")] = blockName;
      blockNameToId[blockName] = blockId;
    }

    if (paletteRGB.length === 0) {
      return;
    }

    const imageData = await this.loadAndResizeImageData(imageUrl, maxSize);
    if (!imageData) {
      return;
    }

    const rotated = this.rotatePixels(
      imageData.pixels,
      imageData.targetWidth,
      imageData.targetHeight,
      rotation.z,
    );

    const bitmapIds = [];
    for (let py = 0; py < rotated.height; py++) {
      const row = [];
      for (let px = 0; px < rotated.width; px++) {
        const i = (py * rotated.width + px) * 4;
        if (rotated.pixels[i + 3] < 128) {
          row.push(-1);
          continue;
        }

        const nearest = nearestColor(
          paletteRGB,
          rotated.pixels[i],
          rotated.pixels[i + 1],
          rotated.pixels[i + 2],
        );

        const blockName = rgbToBlockName[nearest.join(",")];
        row.push(blockNameToId[blockName] ?? 3); // Fallback Stone
      }

      bitmapIds.push(row);
    }

    const flipped = bitmapIds.reverse();
    const cx = x ?? Math.floor((this.config.WORLD_WIDTH?.get() ?? 64) / 2);
    const cy = y ?? Math.floor((this.config.SURFACE_LEVEL?.get() ?? 64) - 10);
    const updates = [];

    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    const radZ = (rotation.z * Math.PI) / 180;

    const cosX = Math.cos(radX),
      sinX = Math.sin(radX);
    const cosY = Math.cos(radY),
      sinY = Math.sin(radY);
    const cosZ = Math.cos(radZ),
      sinZ = Math.sin(radZ);

    for (let py = 0; py < flipped.length; py++) {
      for (let px = 0; px < flipped[0].length; px++) {
        const blockId = flipped[py][px];
        if (blockId === -1) {
          continue;
        }

        let lx = px - rotated.width / 2;
        let ly = py - rotated.height / 2;
        let lz = 0;

        // Roll (Z)
        let x1 = lx * cosZ - ly * sinZ;
        let y1 = lx * sinZ + ly * cosZ;
        let z1 = lz;
        // Yaw (Y)
        let x2 = x1 * cosY + z1 * sinY;
        let y2 = y1;
        let z2 = -x1 * sinY + z1 * cosY;
        // Pitch (X)
        let x3 = x2;
        let y3 = y2 * cosX - z2 * sinX;
        let z3 = y2 * sinX + z2 * cosX;

        updates.push({
          x: Math.round(cx + x3),
          y: Math.round(cy + y3),
          z: Math.round(z + z3),
          block: blockId,
        });
      }
    }

    this.batchSetBlocks(updates);
  }
}

export async function demo() {
  const api = new DrawBitmap();

  await api.setFullscreen();

  console.log("🎮 BlockGarden Demo: Quantized Bitmap Image");

  const blockGardenPhoto =
    "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";

  await api.drawQuantizedBitmap(
    `data:image/png;base64,${blockGardenPhoto}`,
    true, // optimize colors
    48, // size
    0, // x
    80, // y
    25, // z
    { x: 0, y: 0, z: 0 }, // NO ROTATION - x: Pitch 0°, y: yaw 0°, z: Roll 0°
  );

  console.log(
    "💡 Use: blockGarden.demo.photo.drawQuantizedBitmap(img, optimize?, size?, x?, y?, z?, rotation?)",
    "\n   rotation = { x: pitchDegrees, y: yawDegrees, z: rollDegrees }",
  );

  api.gThis.blockGarden.demo = {
    ...api.gThis.blockGarden.demo,
    photo: api,
  };
}
