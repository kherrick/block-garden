import { characters as Characters } from "./misc/characters.mjs";
import { sleep } from "./misc/sleep.mjs";

import { getShadowRoot } from "../util/getShadowRoot.mjs";
import { resizeCanvas } from "./ui/resizeCanvas.mjs";

import { createKeyEvent } from "./player/createKeyEvent.mjs";
import { pressKey } from "./player/pressKey.mjs";

/**
 * @typedef {import('../state/config/blocks.mjs').BlockDefinition} BlockDefinition
 */

export class BlockGarden {
  /**
   * Class constructor initializing references to global objects and configuration.
   * Sets up shortcuts to globalThis, document, config, state, and blocks.
   */
  constructor() {
    this.gThis = globalThis;
    this.doc = this.gThis.document;

    this.config = this.gThis.blockGarden.config;
    this.state = this.gThis.blockGarden.state;
    this.computed = this.gThis.blockGarden.computed;
    this.blocks = this.config.blocks;
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
   * Finds the index of a block by its name within the provided blocks array.
   *
   * @param {string} name
   * @param {BlockDefinition[]} blocks
   *
   * @returns {number} Index of the block with the given name, or -1 if not found.
   */
  getBlockIdByName(name, blocks = this.config.blocks) {
    return blocks.findIndex((block) => block.name === name);
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

    world.setBlock(x, y, z, blockType);

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

    updates.forEach(({ x, y, z, block }) => world.setBlock(x, y, z, block));

    this.setWorld(world);
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
    offBlock = this.blocks.DIRT,
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
   * @param {*} [onBlock=this.blocks.ICE] - Block used for dark modules of the QR code.
   * @param {*} [offBlock=this.blocks.COAL] - Block used for light modules of the QR code.
   *
   * @returns {Promise<{x:number, y:number, z:number, width:number, height:number, data:string }>} The position and size of the drawn QR code, with resulting dataURL.
   */
  async drawQRCode(
    text,
    x,
    y,
    z,
    onBlock = this.blocks.ICE,
    offBlock = this.blocks.COAL,
  ) {
    const qrcode = await this.getQRCodeModule();
    const qr = qrcode(0, "L");

    qr.addData(text);
    qr.make();

    const size = qr.getModuleCount();
    const updates = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const isDark = qr.isDark(row, col);
        const block = isDark ? onBlock : offBlock;

        updates.push({ x: x + col, y: y + row, z, block });
      }
    }

    this.batchSetBlocks(updates);

    return { x, y, z, width: size, height: size, data: qr.createDataURL() };
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
   * @returns {Promise<void>}
   */
  async showFullScreen() {
    const resolutionSelect = this.shadow.getElementById("resolutionSelect");
    const fullscreenOption = resolutionSelect.querySelector(
      '[value="fullscreen"]',
    );

    fullscreenOption.removeAttribute("hidden");

    if (resolutionSelect instanceof HTMLSelectElement) {
      resolutionSelect.value = "fullscreen";
    }
  }

  /**
   * Sets the display to fullscreen mode by showing the fullscreen option,
   * updating the current resolution configuration, and resizing the canvas.
   *
   * @returns {Promise<void>}
   */
  async setFullscreen() {
    this.showFullScreen();

    this.config.currentResolution.set("fullscreen");

    resizeCanvas(this.shadow, this.config.currentResolution);
  }
}
