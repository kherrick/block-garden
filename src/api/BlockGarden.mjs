import { characters as Characters } from "./misc/characters.mjs";
import { sleep } from "./misc/sleep.mjs";

import { cssColorToRGB } from "../util/colors/cssColorToRGB.mjs";
import { getShadowRoot } from "../util/getShadowRoot.mjs";
import { nearestColor } from "../util/colors/nearestColor.mjs";
import { rgbToHex } from "../util/colors/rgbToHex.mjs";
import { transformStyleMapByStyleDeclaration } from "../util/colors/transformStyleMapByStyleDeclaration.mjs";

import { createKeyEvent } from "./player/createKeyEvent.mjs";
import { pressKey } from "./player/pressKey.mjs";

import { blockNames } from "../state/config/blocks.mjs";

import { resizeCanvas } from "./ui/resizeCanvas.mjs";

/**
 * @typedef {import('../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 */

export class BlockGarden {
  /**
   * Initializes references to global objects and configuration.
   * Sets up shortcuts to globalThis, document, config, state, and blocks.
   */
  constructor() {
    this.gThis = globalThis;
    this.doc = this.gThis.document;

    this.config = this.gThis.blockGarden.config;
    this.state = this.gThis.blockGarden.state;
    this.computed = this.gThis.blockGarden.computed;
    this.blocks = this.config.blocks;

    /** @type {Function[]} */
    this.blockBreakListeners = [];
    this.isInterceptingSetBlock = false;
  }

  /**
   * Getter that returns the shadow root of the "block-garden" element within the document.
   *
   * @returns {ShadowRoot} The shadow root object for the block-garden element.
   */
  get shadow() {
    return getShadowRoot(this.doc, "block-garden");
  }

  /**
   * Gets the current world state object from the global blockGarden state store.
   *
   * @returns {*} The current world state.
   */
  getWorld() {
    return this.state.world;
  }

  /**
   * Updates the global blockGarden state store with a new world state.
   *
   * @param {*} world - The new world state to set.
   */
  setWorld(world) {
    this.state.world = world;
  }

  /**
   * Get an ideal color map for raw pixel data.
   *
   * @param {Uint8ClampedArray|number[]} pixels - RGBA pixel data.
   * @param {number} width - Width of the image data.
   * @param {number} height - Height of the image data.
   * @param {Set} [bannedBlocks=new Set()] - Set of blocks to exclude.
   *
   * @returns {Object.<string, string>} Mapping of CSS props to color hexes.
   */
  getIdealColorMapForPixels(pixels, width, height, bannedBlocks = new Set()) {
    const blockColorMap = transformStyleMapByStyleDeclaration(
      this.gThis.getComputedStyle(this.shadow.host),
      "--bg-block-",
    );

    const paletteRGB = [];
    const rgbToBlockName = {};
    const blockNamesList = [];

    for (const [rawBlockName, cssColor] of Object.entries(blockColorMap)) {
      const blockName = this.normalizeBlockName(rawBlockName);
      if (bannedBlocks.has(blockName)) {
        continue;
      }

      const rgb = cssColorToRGB(this.doc, cssColor);
      if (!rgb) {
        continue;
      }

      paletteRGB.push(rgb);
      rgbToBlockName[rgb.join(",")] = blockName;
      blockNamesList.push(blockName);
    }

    const blockColorAccum = {};
    const blockColorCount = {};

    for (const blockName of blockNamesList) {
      blockColorAccum[blockName] = [0, 0, 0];
      blockColorCount[blockName] = 0;
    }

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i],
        g = pixels[i + 1],
        b = pixels[i + 2],
        a = pixels[i + 3];

      if (a < 128) {
        continue;
      }

      const nearest = nearestColor(paletteRGB, r, g, b);
      const blockName = rgbToBlockName[nearest.join(",")];

      if (blockName) {
        blockColorAccum[blockName][0] += r;
        blockColorAccum[blockName][1] += g;
        blockColorAccum[blockName][2] += b;
        blockColorCount[blockName]++;
      }
    }

    /** @type {Object.<string, string>} */
    const idealColorMap = {};
    for (const blockName of blockNamesList) {
      const count = blockColorCount[blockName];
      if (count > 0) {
        const avg = blockColorAccum[blockName].map((c) =>
          Math.round(c / count),
        );
        const cssKey = `--bg-block-${blockName.toLowerCase().replace(/_/g, "-")}-color`;
        idealColorMap[cssKey] = rgbToHex(avg[0], avg[1], avg[2]);
      }
    }

    return idealColorMap;
  }

  /**
   * Finds the index of a block by its name within the provided blocks array.
   *
   * @param {string} rawBlockName
   *
   * @returns {string}
   */
  getBlockNameFromCss(rawBlockName) {
    const cssKey = rawBlockName.replace("--bg-color-", "").toLowerCase();

    // Direct match
    const directKey = cssKey.toUpperCase().replace(/-/g, "_");
    if (blockNames[directKey]) {
      return directKey;
    }

    // Fuzzy match against blockNames
    for (const [key] of Object.entries(blockNames)) {
      if (key.toLowerCase().replace(/_/g, "-") === cssKey) {
        return key;
      }
    }

    return null;
  }

  getBlockIdByName(name, blocks = this.config.blocks) {
    const block = blocks.find((block) => block.name === name);

    return block ? block.id : -1;
  }

  /**
   * Helper to normalize a raw block name from CSS (e.g. "dirt" -> "DIRT")
   *
   * @param {string} rawBlockName
   *
   * @returns {string}
   */
  normalizeBlockName(rawBlockName) {
    if (typeof rawBlockName !== "string") {
      return null;
    }
    return rawBlockName.toUpperCase().replace(/-/g, "_");
  }

  /**
   * Check if an object is a map of strings to strings
   *
   * @param {any} obj
   *
   * @returns {boolean}
   */
  isStringMap(obj) {
    if (typeof obj !== "object" || obj === null) {
      return false;
    }

    return Object.values(obj).every((value) => typeof value === "string");
  }

  /**
   * Rotate pixels by an angle in degrees
   */
  rotatePixels(pixels, width, height, angleDeg = 0) {
    if (angleDeg === 0) {
      return { pixels, width, height };
    }

    const rad = (angleDeg * Math.PI) / 180;
    const cosRad = Math.abs(Math.cos(rad));
    const sinRad = Math.abs(Math.sin(rad));
    const newWidth = Math.floor(height * sinRad + width * cosRad);
    const newHeight = Math.floor(height * cosRad + width * sinRad);

    const canvas = this.doc.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    const imgData = ctx.createImageData(width, height);
    imgData.data.set(pixels);
    ctx.putImageData(imgData, 0, 0);

    const rotatedCanvas = this.doc.createElement("canvas");
    rotatedCanvas.width = newWidth;
    rotatedCanvas.height = newHeight;

    const rotatedCtx = rotatedCanvas.getContext("2d");
    rotatedCtx.save();
    rotatedCtx.translate(newWidth / 2, newHeight / 2);
    rotatedCtx.rotate(rad);
    rotatedCtx.drawImage(canvas, -width / 2, -height / 2);
    rotatedCtx.restore();

    return {
      pixels: rotatedCtx.getImageData(0, 0, newWidth, newHeight).data,
      width: newWidth,
      height: newHeight,
    };
  }

  /**
   * Retrieves the block at the given world coordinates from the current world.
   *
   * @param {number} x - X coordinate of the block.
   * @param {number} y - Y coordinate of the block (height).
   * @param {number} z - Z coordinate of the block.
   *
   * @returns {*} The block type at the specified coordinates.
   */
  getBlock(x, y, z) {
    const world = this.getWorld();

    return world.getBlock(x, y, z);
  }

  /**
   * Sets a single block in the current world at the given coordinates and
   * writes the updated world state back.
   *
   * @param {number} x - X coordinate of the block to set.
   * @param {number} y - Y coordinate of the block to set (height).
   * @param {number} z - Z coordinate of the block to set.
   * @param {*} blockType - Block type to place at the coordinates.
   */
  setBlock(x, y, z, blockType) {
    const world = this.getWorld();

    world.setBlock(x, y, z, blockType, true);

    this.setWorld(world);
  }

  /**
   * Applies multiple block updates to the current world in a single batch,
   * then writes the updated world state back.
   *
   * @param {{x:number, y:number, z:number, block:*}[]} updates - Array of block update descriptors.
   */
  batchSetBlocks(updates) {
    const world = this.getWorld();

    updates.forEach(({ x, y, z, block }) =>
      world.setBlock(x, y, z, block, true),
    );

    this.setWorld(world);
  }

  /**
   * Registers a callback to be called when a block is broken (set to Air).
   *
   * @param {function(number, number, number): void} callback - Function to call with x, y, z coordinates.
   */
  onBlockBreak(callback) {
    this.blockBreakListeners.push(callback);

    if (!this.isInterceptingSetBlock) {
      this.setupBlockBreakInterception();
    }
  }

  /**
   * Internal helper to intercept world.setBlock calls and notify listeners.
   *
   * @private
   */
  setupBlockBreakInterception() {
    this.isInterceptingSetBlock = true;

    const world = this.getWorld();
    const originalSetBlock = world.setBlock.bind(world);
    const airId = this.getBlockIdByName("Air");

    world.setBlock = (x, y, z, blockType, updateChunk) => {
      const result = originalSetBlock(x, y, z, blockType, updateChunk);

      if (blockType === 0 || blockType === airId) {
        this.blockBreakListeners.forEach((cb) => cb(x, y, z));
      }

      return result;
    };
  }

  /**
   * Opens the specified URL in a new window or tab.
   *
   * @param {string} url - The URL to open.
   * @param {string} [target="_blank"] - The target window/tab name (default is "_blank").
   */
  openUrl(url, target = "_blank") {
    if (this.gThis.window) {
      this.gThis.window.open(url, target);
    } else if (typeof window !== "undefined") {
      window.open(url, target);
    } else {
      console.warn("⚠️ Navigation failed: No window object found.");
    }
  }

  /**
   * Replaces the current window's location with the specified URL.
   *
   * @param {string} url - The URL to navigate to.
   */
  replaceWindow(url) {
    if (this.gThis.window) {
      this.gThis.window.location.href = url;
    } else if (typeof window !== "undefined") {
      window.location.href = url;
    } else {
      console.warn("⚠️ Navigation failed: No window object found.");
    }
  }

  /**
   * Renders a string using bitmap glyphs into a block grid and returns its bounds.
   * For each character, this draws its bitmap starting at the current x position,
   * then adds the configured spacing columns using the offBlock.
   *
   * @param {string} text - Text to draw.
   * @param {number} x - X coordinate (in blocks) of the top-left text position.
   * @param {number} y - Y coordinate (in blocks) of the top-left text position.
   * @param {number} z - Z coordinate (depth) of the text.
   * @param {*} onBlock - Block used for "on" pixels of the character bitmap.
   * @param {*} [offBlock=this.blocks.DIRT] - Block used for "off" pixels and spacing.
   * @param {number} [spacing=1] - Number of blank columns between characters.
   * @param {{ [char: string]: string[] }} [characters=Characters] - Map of characters to bitmap rows.
   * @param {number} [rotate=0] - Rotation in degrees (0, 90, 180, 270).
   *
   * @returns {{x:number, y:number, z:number, width:number, height:number}} The drawn text bounds.
   */
  drawText(
    text,
    x,
    y,
    z,
    onBlock,
    offBlock = this.getBlockIdByName("Dirt"),
    spacing = 1,
    characters = Characters,
    rotate = 0,
  ) {
    const updates = [];
    let currentX = x;
    let currentZ = z;

    // Calculate direction vector from rotation
    // 0 -> (1, 0)
    // 90 -> (0, 1)
    // 180 -> (-1, 0)
    // 270 -> (0, -1)
    const rad = (rotate * Math.PI) / 180;
    const directionX = Math.round(Math.cos(rad));
    const directionZ = Math.round(Math.sin(rad));

    for (const char of text.toUpperCase()) {
      const bitmap = characters[char];
      if (!bitmap) {
        continue;
      }

      // Draw bitmap rows in reverse order (top-down in array = bottom-up in world)
      for (let row = 0; row < bitmap.length; row++) {
        // Iterate columns left to right
        for (let col = 0; col < bitmap[row].length; col++) {
          const pixel = bitmap[row][col];
          const block = pixel === "1" ? onBlock : offBlock;

          // Flip Y coordinate: higher row index = lower Y position
          const drawY = y + (bitmap.length - 1 - row);
          const drawX = currentX + col * directionX;
          const drawZ = currentZ + col * directionZ;

          updates.push({ x: drawX, y: drawY, z: drawZ, block });
        }
      }

      // Add spacing (also flipped vertically)
      for (let row = 0; row < bitmap.length; row++) {
        for (let s = 0; s < spacing; s++) {
          const drawY = y + (bitmap.length - 1 - row);
          updates.push({
            x: currentX + (bitmap[0].length + s) * directionX,
            y: drawY,
            z: currentZ + (bitmap[0].length + s) * directionZ,
            block: offBlock,
          });
        }
      }

      currentX += (bitmap[0].length + spacing) * directionX;
      currentZ += (bitmap[0].length + spacing) * directionZ;
    }

    this.batchSetBlocks(updates);

    return {
      x,
      y,
      z,
      width: Math.abs(currentX - x) || Math.abs(currentZ - z),
      height: 5,
    };
  }

  /**
   * Dynamically imports and returns the QR code generation module.
   *
   * @returns {Promise<Function>} The QR code module for creating codes.
   */
  async getQRCodeModule() {
    const mod = "https://kherrick.github.io/block-garden/deps/qrcode.mjs";
    const { qrcode } = await import(mod);

    return qrcode;
  }

  /**
   * Draws a QR code that encodes the given text, using specified blocks for dark and light modules.
   *
   * @param {string} text - Text data to encode as QR code.
   * @param {number} x - X coordinate (in blocks) of the top-left corner to draw the QR code.
   * @param {number} y - Y coordinate (in blocks) of the top-left corner to draw the QR code.
   * @param {number} z - Z coordinate (depth) to draw the QR code on.
   * @param {*} [onBlock=this.getBlockIdByName("Coal")] - Block used for dark modules (1s)
   * @param {*} [offBlock=this.getBlockIdByName("Ice")] - Block used for light modules (0s) + quiet zone
   *
   * @returns {Promise<{x:number, y:number, z:number, width:number, height:number, data:string, size:number, totalSize:number}>} The position and size of the drawn QR code.
   */
  async drawQRCode(
    text,
    x,
    y,
    z,
    onBlock = this.getBlockIdByName("Coal"),
    offBlock = this.getBlockIdByName("Ice"),
  ) {
    if (!text || text.length === 0) {
      throw new Error("QR code text cannot be empty");
    }

    const qrcode = await this.getQRCodeModule();
    const qr = qrcode(0, "L");

    qr.addData(text);
    qr.make();

    const size = qr.getModuleCount();
    const MARGIN = 4; // Standard QR quiet zone
    const totalSize = size + MARGIN * 2; // Include border on all sides

    console.log(
      `📱 Generating ${size}x${size} QR code (total: ${totalSize}x${totalSize} with margin)`,
    );

    const updates = [];

    // Fill entire area (QR + quiet zone) with light background first
    for (let row = 0; row < totalSize; row++) {
      for (let col = 0; col < totalSize; col++) {
        updates.push({
          x: x + col,
          y: y + row,
          z,
          block: offBlock, // Light background everywhere initially
        });
      }
    }

    // Draw QR modules INSIDE the quiet zone (not on border)
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const isDark = qr.isDark(row, col);
        const block = isDark ? onBlock : offBlock;

        // Offset by MARGIN to leave quiet zone clear
        updates.push({
          x: x + MARGIN + col,
          y: y + MARGIN + row,
          z,
          block,
        });
      }
    }

    this.batchSetBlocks(updates);

    return {
      x,
      y,
      z,
      width: totalSize,
      height: totalSize,
      data: qr.createDataURL(),
      size, // Raw QR size (without margin)
      totalSize, // Size including quiet zone
    };
  }

  /**
   * Dispatches a 'keydown' event with the given keyCode to the shadow DOM root.
   *
   * @param {number} keyCode - The keyCode to dispatch a keydown event for.
   *
   * @returns {Promise<void>}
   */
  async holdKey(keyCode) {
    this.shadow.dispatchEvent(createKeyEvent("keydown", keyCode));
  }

  /**
   * Dispatches a 'keyup' event with the given keyCode to the shadow DOM root.
   *
   * @param {number} keyCode - The keyCode to dispatch a keyup event for.
   *
   * @returns {Promise<void>}
   */
  async releaseKey(keyCode) {
    this.shadow.dispatchEvent(createKeyEvent("keyup", keyCode));
  }

  /**
   * Release all provided keys.
   *
   * @returns {Promise<void>}
   */
  async releaseAllKeys(keys, delay = 50) {
    for (const k of keys) {
      await this.releaseKey(k);
    }

    await sleep(delay);
  }

  /**
   * Performs multiple repeated key presses with a delay between presses.
   *
   * @param {number} keyCode - The keyCode of the key to press repeatedly.
   * @param {number} times - Number of times to press the key.
   * @param {number} [delay=100] - Delay in milliseconds between presses.
   * @returns {Promise<void>}
   */
  async pressKeyRepeat(keyCode, times, delay = 100) {
    for (let i = 0; i < times; i++) {
      await pressKey(this.shadow, keyCode, delay / 2);
      await sleep(delay);
    }
  }

  /**
   * Sequentially presses a series of keys, each followed by a delay.
   *
   * @param {number[]} keyCodes - Array of key codes to press in sequence.
   * @param {number} [delay=100] - Delay in milliseconds between key presses.
   * @param {Function} [cb] - callback function if supplied
   *
   * @returns {Promise<void>}
   */
  async pressKeySequence(keyCodes, delay = 100, cb = undefined) {
    for (const keyCode of keyCodes) {
      if (cb) {
        cb(keyCode);
      }

      await pressKey(this.shadow, keyCode, delay / 2);
      await sleep(delay);
    }
  }

  /**
   * Shows the fullscreen option in the resolution selection element and sets
   * its value to 'fullscreen'.
   *
   * @returns {void}
   */
  showFullScreen() {
    const resolutionSelect = this.shadow.getElementById("resolutionSelect");
    const fullscreenOption = resolutionSelect.querySelector(
      '[value="fullscreen"]',
    );

    fullscreenOption?.removeAttribute("hidden");

    if (resolutionSelect instanceof HTMLSelectElement) {
      resolutionSelect.value = "fullscreen";
    }
  }

  /**
   * Sets the display to fullscreen mode by showing the fullscreen option,
   * updating the current resolution configuration, and resizing the canvas.
   *
   * @returns {void}
   */
  setFullscreen() {
    this.showFullScreen();
    this.config.currentResolution.set("fullscreen");

    resizeCanvas(this.shadow, this.config.currentResolution);
  }

  extractBlockKey(prop) {
    const match = prop.match(/--bg-(block|color)-(.+?)(?:-color)?$/i);
    if (match) {
      const candidate = this.normalizeBlockName(match[2]);
      return blockNames[candidate] ? candidate : null;
    }

    return null;
  }
}
