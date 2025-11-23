import { applyColorsToShadowHost } from "../../util/colors/applyColorsToShadowHost.mjs";
import { cssColorToRGB } from "../../util/colors/cssColorToRGB.mjs";
import { nearestColor } from "../../util/colors/nearestColor.mjs";
import { rgbToHex } from "../../util/colors/rgbToHex.mjs";

import { transformStyleMapByStyleDeclaration } from "../../util/colors/transformStyleMapByStyleDeclaration.mjs";

import { normalizeTileName } from "../../state/config/tiles.mjs";

import { SpriteGarden } from "../SpriteGarden.mjs";

export class DrawBitmap extends SpriteGarden {
  async loadAndResizeImageData(imageUrl, maxSize = 64) {
    let image;

    try {
      image = await new Promise((res, rej) => {
        const img = new Image();

        img.crossOrigin = "Anonymous";
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = imageUrl;
      });
    } catch (e) {
      console.error("❌ Failed to load image:", imageUrl);
      return null;
    }

    // Compute new size preserving aspect ratio
    let targetWidth, targetHeight;

    if (image.width >= image.height) {
      targetWidth = maxSize;
      targetHeight = Math.round((image.height / image.width) * maxSize);
    } else {
      targetHeight = maxSize;
      targetWidth = Math.round((image.width / image.height) * maxSize);
    }

    // Draw to offscreen canvas
    const offCanvas = this.doc.createElement("canvas");
    offCanvas.width = targetWidth;
    offCanvas.height = targetHeight;

    const offCtx = offCanvas.getContext("2d");
    offCtx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const imageData = offCtx.getImageData(0, 0, targetWidth, targetHeight);
    const pixels = imageData.data;

    return { pixels, targetWidth, targetHeight };
  }

  // compute and return ideal color map based on image and banned tiles
  async getIdealColorMapForImage(
    imageUrl,
    maxSize = 64,
    bannedTiles = new Set(),
  ) {
    console.log("🎨 Computing ideal color map for image:", imageUrl);

    const tileColorMap = transformStyleMapByStyleDeclaration(
      this.gThis.getComputedStyle(this.shadow.host),
      "--sg-tile-color-",
    );

    // Build tile palette arrays and maps
    const paletteRGB = [];
    const rgbToTileName = {};
    const tileNamesList = [];

    for (const [rawTileName, cssColor] of Object.entries(tileColorMap)) {
      const tileName = normalizeTileName(rawTileName);

      if (bannedTiles.has(tileName)) {
        console.log(`Skipping banned tile color: ${tileName}`);

        continue; // Skip banned tile/color
      }

      const rgb = cssColorToRGB(this.doc, cssColor);

      paletteRGB.push(rgb);

      rgbToTileName[rgb.join(",")] = tileName;

      tileNamesList.push(tileName);
    }

    const { pixels } = await this.loadAndResizeImageData(imageUrl, maxSize);

    // Accumulate color sums and counts for each tile
    const tileColorAccum = {};
    const tileColorCount = {};

    for (const tileName of tileNamesList) {
      tileColorAccum[tileName] = [0, 0, 0];
      tileColorCount[tileName] = 0;
    }

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i],
        g = pixels[i + 1],
        b = pixels[i + 2];

      const nearest = nearestColor(paletteRGB, r, g, b);
      const tileName = rgbToTileName[nearest.join(",")];

      if (tileName && !bannedTiles.has(tileName)) {
        tileColorAccum[tileName][0] += r;
        tileColorAccum[tileName][1] += g;
        tileColorAccum[tileName][2] += b;
        tileColorCount[tileName]++;
      }
    }

    // Calculate average colors as ideal colors
    const idealColorMap = {};

    for (const tileName of tileNamesList) {
      const count = tileColorCount[tileName];

      if (count > 0) {
        const avg = tileColorAccum[tileName].map((c) => Math.round(c / count));

        const [r, g, b] = avg;

        idealColorMap[
          `--sg-tile-color-${tileName.toLowerCase().replace("_", "-")}`
        ] = rgbToHex(r, g, b);
      }
    }

    return idealColorMap;
  }

  async drawQuantizedBitmap(
    imageUrl,
    modifyWorldColors = false,
    maxSize = 64,
    x = null,
    y = null,
  ) {
    console.log("🎨 Loading and quantizing image:", imageUrl);

    if (modifyWorldColors === true) {
      await applyColorsToShadowHost(
        this.shadow,
        await this.getIdealColorMapForImage(imageUrl, maxSize),
      );
    }

    // Get tile colors keyed by tile name
    const tileColorMap = transformStyleMapByStyleDeclaration(
      this.gThis.getComputedStyle(this.shadow.host),
      "--sg-tile-color-",
    );

    // List of banned tile names (normalized form to match keys)
    const bannedTiles = new Set(["XRAY", "LOADING_PIXEL"]);

    // Build palette array and reverse map RGB string -> tileName
    const paletteRGB = [];
    const rgbToTileName = {};

    for (const [rawTileName, cssColor] of Object.entries(tileColorMap)) {
      const tileName = normalizeTileName(rawTileName);

      if (bannedTiles.has(tileName)) {
        console.log(`Skipping banned tile color: ${tileName}`);

        continue; // Skip banned tile/color
      }

      const rgb = cssColorToRGB(this.doc, cssColor);

      paletteRGB.push(rgb);

      rgbToTileName[rgb.join(",")] = tileName;
    }

    const { pixels, targetWidth, targetHeight } =
      await this.loadAndResizeImageData(imageUrl, maxSize);

    // Build bitmap as 2D array of tileNames
    const bitmapTileNames = [];

    for (let y = 0; y < targetHeight; y++) {
      const row = [];

      for (let x = 0; x < targetWidth; x++) {
        const i = (y * targetWidth + x) * 4;

        const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];

        const nearest = nearestColor(paletteRGB, r, g, b);

        const tileName = rgbToTileName[nearest.join(",")] || "LAVA"; // fallback

        row.push(tileName);
      }

      bitmapTileNames.push(row);
    }

    let bottomCenterX = x;

    if (bottomCenterX === null) {
      bottomCenterX = this.config.WORLD_WIDTH.get() / 2;
    }

    let bottomCenterY = y;

    if (bottomCenterY === null) {
      bottomCenterY = this.config.SURFACE_LEVEL.get() - 10;
    }

    // Draw the bitmap of multiple tiles, centered bottom
    this.drawSparseBitmapBottomCenterMultiTiles(
      bitmapTileNames,
      bottomCenterX,
      bottomCenterY,
    );

    console.log("🖼️ Quantized bitmap drawn with tile mapping!");
  }
}

export async function demo() {
  const api = new DrawBitmap();

  await api.setFullscreen();
  api.setFogMode("clear");

  console.log("🎮 SpriteGarden Demo: Quantized Bitmap Image");

  await api.drawQuantizedBitmap(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAAAAXNSR0IB2cksfwAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAA1dJREFUeNrt3b9LlHEcwPHvxVWkYCAcxE0NF4hERYOBBFckrpKEDSHUUHFQYzQ1RYg0S4gNDTnUPyBoPwYhaEgaw6RJdHByCSLBtrjofK6eu+Oe73Ov16Q+epwPb758+fjlsTCztrMfICcOuQUIGgQNggZBI2gQNAgaBA2CRtAgaBA0CBoEjaAhUkW3gFgtvL1ghcaWAwQNggZBg6ARNAgaBA2CBkEjaBA0CBoETW9zHpoDNTpv3E63r3y0QoOgETQIGgQNggZBk3/m0ESr0RzbCo0tBwgaBA2CRtAgaMgcc2hSqy3vJl5/Nn7cCg2CBkEjaBA0CBoEDYWZtZ19t4E0ig+HEq/vzX5p6fWPnVy0QmPLAYIGQYOgQdAIGuLnPDSpHX71KPl6WGzp9X9ef2yFxpYDBA2CBkGDoBE0xK+jc+gY/89dL0lz3rhemjmxFRoEjaBB0CBoEDT8C8dH2+jN/NPw+fWLhtfOTd0MY3cfuEmCjsv9yljoKx4NN05dDiGEsPj1ffi+9yOspnit8aVriddXa1dbeq9ZnCPX+1aZsuXIgo3d7VDuHwzl/sGwsbvththDx22+eq/hxwgaBI2gQdCQNcZ2bTa3vhLm1lf++vqZ87fcnLwHncX/c9eKkcnpMDI5/fvz6rs7dVdXQ2mpvee3uz1Hftl3MfH6aLlshY7ZQOnEH5+XBo64KfbQIGgQNIIGQYOgIYWOju2aPjdjeai1n29Rs/PGeZfmvHG9USs0CBoEjaBB0CBoEDQ0l+njo70+J36+OZz8DZVhBVuhETQIGgQNggZBI2jIusQ5dMfnwJdO5/rmNp0jk+jD1lbi9UbP/bBCY8sBggZBg6ARNAgaMqfw6Ul1v1d/eXNiKzQIGgQNgkbQIGgQNHRcpp/L0ek5cZrztlihQdAgaATtFiBoEDQIGv5L4hw67+eFzZnj1ujvCFZobDlA0CBoEDSCBkFD5hQ9myJenT7P3ez1m+nGnN8KjS0HCBoEDYJG0CBoyJxCrVbL7fOhPXfDCg2CBkGDoEHQCBoEDV1XzPMv1+05c+xz8BjfvxUaWw4QNAgaBI2gQdCQOYWzExMHnod2Xpgs83xobDlA0CBoEDQIGkFDFIoxz5o9d6O3zVY2rdDYckA0fgEa6oZBoRXoGwAAAABJRU5ErkJggg==",
    false,
    api.config.WORLD_HEIGHT.get() / 4,
    api.config.WORLD_WIDTH.get() / 2 - 50,
    api.config.WORLD_HEIGHT.get() / 3,
  );

  console.log(
    "💡 Use spriteGarden.demo.photo.drawQuantizedBitmap(imageUrl: any, modifyWorldColors?: boolean, maxSize?: number, x?: null, y?: null) to draw more!",
  );

  api.gThis.spriteGarden.demo = {
    ...api.gThis.spriteGarden.demo,
    photo: api,
  };
}
