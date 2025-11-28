import { markWaterRegionDirty } from "../water/markWaterRegionDirty.mjs";
import { resizeCanvas } from "../util/resizeCanvas.mjs";
import { sleep } from "../util/sleep.mjs";

import { characters as Characters } from "./characters.mjs";
import { codeMap as CodeMap, keyMap as KeyMap } from "./keys.mjs";
import { getShadowRoot } from "../util/getShadowRoot.mjs";

export class SpriteGarden {
  /**
   * Class constructor initializing references to global objects and configuration.
   * Sets up shortcuts to globalThis, document, config, state, and tiles.
   */
  constructor() {
    this.gThis = globalThis;
    this.doc = this.gThis.document;

    this.config = this.gThis.spriteGarden.config;
    this.state = this.gThis.spriteGarden.state;
    this.tiles = this.config.TILES;
  }

  /**
   * Getter that returns the shadow root of the "sprite-garden" element within the document.
   *
   * @returns {ShadowRoot} The shadow root object for the sprite-garden element.
   */
  get shadow() {
    return getShadowRoot(this.doc, "sprite-garden");
  }

  /**
   * Gets the current world state object from the global spriteGarden state store.
   *
   * @returns {*} The current world state.
   */
  getWorld() {
    return this.gThis.spriteGarden.getState("world");
  }

  /**
   * Updates the global spriteGarden state store with a new world state.
   *
   * @param {*} world - The new world state to set.
   */
  setWorld(world) {
    this.gThis.spriteGarden.setState("world", world);
  }

  /**
   * Sets the fog mode configuration.
   * Expected modes might include 'fog' to enable fog or 'clear' to disable it.
   *
   * @param {string} mode - The fog mode to set ('fog', 'clear', etc.).
   */
  setFogMode(mode) {
    // 'fog', 'clear'
    this.config.fogMode.set(mode);
  }

  /**
   * Sets the break mode configuration.
   * Expected modes might include 'regular' or 'extra' to control break behavior.
   *
   * @param {string} mode - The break mode to set ('regular', 'extra', etc.).
   */
  setBreakMode(mode) {
    // 'regular' or 'extra'
    this.config.breakMode.set(mode);
  }

  /**
   * Retrieves the current materials inventory object.
   * Returns an empty object if no inventory is available.
   *
   * @returns {{ [material: string]: number }} An object mapping material types to counts.
   */
  getInventory() {
    return this.state.materialsInventory?.get
      ? this.state.materialsInventory.get()
      : {};
  }

  /**
   * Gets the count of a specific material type from the inventory.
   *
   * @param {string} materialType - The material type to query.
   *
   * @returns {number} The count of the given material type, or 0 if not present.
   */
  getMaterialCount(materialType) {
    return this.getInventory()[materialType] || 0;
  }

  /**
   * Sets the count of a specific material type in the inventory.
   * If the material is not already present, it will be added.
   *
   * @param {string} materialType - The material type to update.
   * @param {number} count - The count to set for the material type.
   */
  setMaterialCount(materialType, count) {
    const inventory = this.getInventory();

    inventory[materialType] = count;

    this.state.materialsInventory.set(inventory);
  }

  /**
   * Retrieves the tile at the given world coordinates from the current world.
   *
   * @param {number} x - X coordinate of the tile.
   * @param {number} y - Y coordinate of the tile.
   *
   * @returns {*} The tile object or value at the specified coordinates.
   */
  getTile(x, y) {
    const world = this.getWorld();

    return world.getTile(x, y);
  }

  /**
   * Sets a single tile in the current world at the given coordinates and
   * writes the updated world state back.
   *
   * @param {number} x - X coordinate of the tile to set.
   * @param {number} y - Y coordinate of the tile to set.
   * @param {*} tileType - Tile type or value to place at the coordinates.
   */
  setTile(x, y, tileType) {
    const world = this.getWorld();

    world.setTile(x, y, tileType);

    this.setWorld(world);
  }

  /**
   * Applies multiple tile updates to the current world in a single batch,
   * then writes the updated world state back.
   *
   * @param {{x:number, y:number, tile:*}[]} updates - Array of tile update descriptors.
   */
  batchSetTiles(updates) {
    const world = this.getWorld();

    updates.forEach(({ x, y, tile }) => world.setTile(x, y, tile));

    this.setWorld(world);
  }

  /**
   * Fills a rectangular region in the tile grid with a single tile type.
   * The rectangle is defined by its top-left coordinate and its dimensions.
   *
   * @param {number} x - X coordinate of the top-left corner of the rectangle.
   * @param {number} y - Y coordinate of the top-left corner of the rectangle.
   * @param {number} width - Width of the rectangle in tiles.
   * @param {number} height - Height of the rectangle in tiles.
   *
   * @param {*} tileType - Tile type or value to fill the region with.
   */
  fillRect(x, y, width, height, tileType) {
    const updates = [];

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        updates.push({ x: x + col, y: y + row, tile: tileType });
      }
    }

    this.batchSetTiles(updates);
  }

  /**
   * Draws a rectangular border in the tile grid using the given tile type.
   * Only the outermost rows and columns are updated; the interior is left unchanged.
   *
   * @param {number} x - X coordinate (in tiles) of the top-left corner of the border.
   * @param {number} y - Y coordinate (in tiles) of the top-left corner of the border.
   * @param {number} width - Width of the border in tiles.
   * @param {number} height - Height of the border in tiles.
   * @param {*} tileType - Tile type to use for the border.
   */
  drawBorder(x, y, width, height, tileType) {
    const updates = [];

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const onBorder =
          row === 0 || row === height - 1 || col === 0 || col === width - 1;

        if (onBorder) {
          updates.push({ x: x + col, y: y + row, tile: tileType });
        }
      }
    }

    this.batchSetTiles(updates);
  }

  /**
   * Draws a bitmap into the tile grid at the given coordinates.
   * Each bitmap entry is treated as a pixel, mapping value 1 to onTile and
   * any other value to offTile.
   *
   * @param {number[][]} bitmap - 2D array representing the bitmap pixels.
   * @param {number} x - X coordinate (in tiles) of the top-left bitmap position.
   * @param {number} y - Y coordinate (in tiles) of the top-left bitmap position.
   * @param {*} onTile - Tile to use where the bitmap value is 1.
   * @param {*} [offTile=this.tiles.AIR] - Tile to use where the bitmap value is not 1.
   */
  drawBitmap(bitmap, x, y, onTile, offTile = this.tiles.AIR) {
    const updates = [];

    for (let row = 0; row < bitmap.length; row++) {
      for (let col = 0; col < bitmap[row].length; col++) {
        const pixel = bitmap[row][col];
        const tile = pixel === 1 ? onTile : offTile;

        updates.push({ x: x + col, y: y + row, tile });
      }
    }

    this.batchSetTiles(updates);
  }

  /**
   * Draws a sparse bitmap composed of named tiles, aligned so that its bottom
   * center is at the given coordinates. Falsy entries in the bitmap are skipped.
   *
   * @param {string[][]} bitmapTileNames - 2D array of tile name strings (or falsy to skip).
   * @param {number} bottomCenterX - X coordinate (in tiles) of the bitmap bottom center.
   * @param {number} bottomCenterY - Y coordinate (in tiles) of the bitmap bottom center.
   *
   * @returns {{x:number, y:number, width:number, height:number}} Bounds of the drawn bitmap.
   */
  drawSparseBitmapBottomCenterMultiTiles(
    bitmapTileNames,
    bottomCenterX,
    bottomCenterY,
  ) {
    const width = bitmapTileNames[0].length;
    const height = bitmapTileNames.length;
    const leftX = bottomCenterX - Math.floor(width / 2);
    const updates = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileName = bitmapTileNames[y][x];

        if (tileName) {
          const tileX = leftX + x;
          const tileY = bottomCenterY - (height - 1 - y);

          let tile = this.tiles[tileName];
          if (!tile) {
            console.warn(`Tile not found for ${tileName}, falling back to AIR`);

            tile = this.tiles.AIR;
          }

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

  /**
   * Draws a sparse bitmap using a single tile type, aligned so that its bottom
   * center is at the given coordinates. Only entries with value 1 are drawn.
   *
   * @param {number[][]} bitmap - 2D array with 1 indicating a filled pixel.
   * @param {number} bottomCenterX - X coordinate (in tiles) of the bitmap bottom center.
   * @param {number} bottomCenterY - Y coordinate (in tiles) of the bitmap bottom center.
   * @param {*} [tile=this.tiles.LAVA] - Tile type to use for filled pixels.
   *
   * @returns {{x:number, y:number, width:number, height:number}} Bounds of the drawn bitmap.
   */
  drawSparseBitmapBottomCenter(
    bitmap,
    bottomCenterX,
    bottomCenterY,
    tile = this.tiles.LAVA,
  ) {
    const width = bitmap[0].length;
    const height = bitmap.length;
    const leftX = bottomCenterX - Math.floor(width / 2);

    // Use a flipped Y coordinate so the bitmap definition is top-down
    const updates = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (bitmap[y][x] === 1) {
          // Y index runs bottom up
          const tileX = leftX + x;
          const tileY = bottomCenterY - (height - 1 - y);

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

  /**
   * Computes the pixel width of a text string using bitmap character glyphs.
   * Each character contributes its bitmap width plus one column of spacing,
   * and the final trailing spacing column is removed.
   *
   * @param {string} text - The text to measure.
   * @param {{ [char: string]: string[] }} characters - Map of characters to bitmap rows.
   *
   * @returns {number} The total width of the rendered text in columns.
   */
  getTextWidth(text, characters) {
    let width = 0;

    for (const c of text) {
      const bmp = characters[c.toUpperCase()];

      if (bmp) {
        width += bmp[0].length + 1;
      }
    }

    return Math.max(0, width - 1);
  }

  /**
   * Renders a string using bitmap glyphs into a tile grid and returns its bounds.
   * For each character, this draws its bitmap starting at the current x position,
   * then adds the configured spacing columns using the offTile.
   *
   * @param {string} text - Text to draw.
   * @param {number} x - X coordinate (in tiles) of the top-left text position.
   * @param {number} y - Y coordinate (in tiles) of the top-left text position.
   * @param {*} onTile - Tile used for "on" pixels of the character bitmap.
   * @param {*} [offTile=this.tiles.DIRT] - Tile used for "off" pixels and spacing.
   * @param {number} [spacing=1] - Number of blank columns between characters.
   * @param {{ [char: string]: string[] }} [characters=Characters] - Map of characters to bitmap rows.
   *
   * @returns {{x:number, y:number, width:number, height:number}} The drawn text bounds.
   */
  drawText(
    text,
    x,
    y,
    onTile,
    offTile = this.tiles.DIRT,
    spacing = 1,
    characters = Characters,
  ) {
    const updates = [];
    let currentX = x;

    for (const char of text.toUpperCase()) {
      const bitmap = characters[char];

      if (!bitmap) {
        continue;
      }

      for (let row = 0; row < bitmap.length; row++) {
        for (let col = 0; col < bitmap[row].length; col++) {
          const pixel = bitmap[row][col];
          const tile = pixel === "1" ? onTile : offTile;

          updates.push({ x: currentX + col, y: y + row, tile });
        }
      }

      // Add spacing
      for (let row = 0; row < 5; row++) {
        for (let s = 0; s < spacing; s++) {
          updates.push({
            x: currentX + bitmap[0].length + s,
            y: y + row,
            tile: offTile,
          });
        }
      }

      currentX += bitmap[0].length + spacing;
    }

    this.batchSetTiles(updates);

    return { x, y, width: currentX - x, height: 5 };
  }

  /**
   * Returns the maximum number of monospaced characters that can be fully drawn
   * inside a text box of the given width (in tiles), assuming each glyph uses
   * 5 columns plus 1 column of spacing.
   *
   * @param {number} boxWidth - The total width of the text box in tiles.
   * @param {Object} [characters=Characters] - Character glyph data used for rendering.
   *
   * @returns {number} The maximum number of visible characters that fit in the box.
   */
  getMaxVisibleChars(boxWidth, characters = Characters) {
    // Approximate: measure max 'M' width (widest char in font) + spacing
    return Math.max(1, Math.floor((boxWidth - 1) / 5)); // 5 columns per glyph + 1 spacing
  }

  /**
   * Returns the portion of a string that should be visible in a horizontally
   * scrollable text area for a given scroll offset and visible character count.
   *
   * @param {string} text - The full text to display.
   * @param {number} scrollXChars - Horizontal scroll offset in characters.
   * @param {number} visibleChars - Maximum number of characters that can be shown.
   *
   * @returns {string} The substring that should be rendered in the visible area.
   */
  getScrollableTextLine(text, scrollXChars, visibleChars) {
    if (text.length <= visibleChars) {
      return text;
    }

    // Clamp scrollXChars to reasonable value
    const maxScroll = Math.max(0, text.length - visibleChars);
    const start = Math.min(scrollXChars, maxScroll);

    return text.substring(start, start + visibleChars);
  }

  /**
   * Draws a horizontally scrollable single-line text box that can display text
   * of any length, clipping and scrolling horizontally as needed.
   *
   * @param {string} text - The text to render inside the box.
   * @param {number} x - X coordinate (in tiles) of the top-left corner of the box.
   * @param {number} y - Y coordinate (in tiles) of the top-left corner of the box.
   * @param {number} [boxWidth=30] - Total width of the box in tiles.
   * @param {Object} [config={}] - Rendering options.
   * @param {number} [config.padding=1] - Inner padding (in tiles) between border and text.
   * @param {number} [config.scrollX=0] - Horizontal scroll offset in characters.
   * @param {*} [config.textTile=this.tiles.WATER] - Tile used to draw text glyphs.
   * @param {*} [config.backgroundTile=this.tiles.DIRT] - Tile used for the box background.
   * @param {*} [config.borderTile=this.tiles.CLAY] - Tile used for the box border.
   * @param {Object} [characters=Characters] - Character glyph data used for rendering.
   *
   * @returns {{x:number, y:number, width:number, height:number, maxVisibleChars:number}}
   * An object describing the box geometry and the maximum visible characters.
   */
  drawScrollableTextBox(
    text,
    x,
    y,
    boxWidth = 30,
    config = {},
    characters = Characters,
  ) {
    const {
      textTile = this.tiles.WATER,
      backgroundTile = this.tiles.DIRT,
      borderTile = this.tiles.CLAY,
      padding = 1,
      scrollX = 0,
    } = config;
    // Only a single text line for now; extend for multiline if desired
    const textHeight = 5;
    const boxHeight = textHeight + padding * 2;

    this.drawBorder(x, y, boxWidth, boxHeight, borderTile);
    this.fillRect(x + 1, y + 1, boxWidth - 2, boxHeight - 2, backgroundTile);

    const maxVisibleChars = this.getMaxVisibleChars(boxWidth, characters) + 1;
    const dispText = this.getScrollableTextLine(text, scrollX, maxVisibleChars);

    // Always vertically center line in box (assuming line height=5)
    const textY = y + padding;

    // Use your existing drawText (no wrapping, just right number of letters)
    this.drawText(
      dispText,
      x + padding,
      textY,
      textTile,
      backgroundTile,
      1,
      characters,
    );

    return {
      x,
      y,
      width: boxWidth,
      height: boxHeight,
      maxVisibleChars,
    };
  }

  /**
   * Draws text inside a bordered box with a background and optional water drop effect.
   *
   * @param {string} text - The text to display inside the box.
   * @param {number} x - X coordinate (in tiles) of the top-left corner of the box.
   * @param {number} y - Y coordinate (in tiles) of the top-left corner of the box.
   * @param {Object} [config={}] - Configuration options.
   * @param {*} [config.textTile=this.tiles.WATER] - Tile type for drawing text glyphs.
   * @param {*} [config.backgroundTile=this.tiles.DIRT] - Tile type for the box background.
   * @param {*} [config.borderTile=this.tiles.CLAY] - Tile type for the box border.
   * @param {number} [config.padding=1] - Padding (in tiles) around the text inside the box.
   * @param {number} [config.waterDropDelay=500] - Delay in milliseconds before triggering water drop effect; 0 to disable.
   * @param {Object} [characters=Characters] - Character glyph data used for rendering.
   *
   * @returns {{x: number, y: number, width: number, height: number}} The position and size of the drawn box.
   */
  drawTextWithBox(text, x, y, config = {}, characters = Characters) {
    const {
      textTile = this.tiles.WATER,
      backgroundTile = this.tiles.DIRT,
      borderTile = this.tiles.CLAY,
      padding = 1,
      waterDropDelay = 500,
    } = config;

    const textWidth = this.getTextWidth(text, characters);
    const textHeight = 5;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = textHeight + padding * 2;

    // Draw border
    this.drawBorder(x, y, boxWidth, boxHeight, borderTile);

    // Fill interior
    this.fillRect(x + 1, y + 1, boxWidth - 2, boxHeight - 2, backgroundTile);

    // Draw text
    this.drawText(
      text,
      x + padding,
      y + padding,
      textTile,
      backgroundTile,
      1,
      characters,
    );

    // Schedule water drop effect
    if (waterDropDelay > 0) {
      setTimeout(
        () => this.createWaterDropEffect(x, y, boxWidth, boxHeight),
        waterDropDelay,
      );
    }

    return { x, y, width: boxWidth, height: boxHeight };
  }

  /**
   * Creates a water drop effect animation by clearing the bottom row tiles of a box gradually.
   *
   * @param {number} x - X coordinate of the top-left corner of the box.
   * @param {number} y - Y coordinate of the top-left corner of the box.
   * @param {number} width - Width of the box in tiles.
   * @param {number} height - Height of the box in tiles.
   *
   * @returns {Promise<void>} Resolves when the effect completes.
   */
  async createWaterDropEffect(x, y, width, height) {
    const world = this.getWorld();
    const bottomTiles = [];

    for (let col = x; col < x + width; col++) {
      bottomTiles.push(col);
    }

    let tileIndex = 0;
    const tilesPerFrame = 5;

    const processNextBatch = () => {
      const endIndex = Math.min(tileIndex + tilesPerFrame, bottomTiles.length);

      for (let i = tileIndex; i < endIndex; i++) {
        world.setTile(bottomTiles[i], y + height - 1, this.tiles.AIR);
      }

      if (tileIndex === 0) {
        markWaterRegionDirty(
          x,
          y,
          this.state.waterPhysicsQueue,
          this.config.WORLD_WIDTH.get(),
          this.config.WORLD_HEIGHT.get(),
          Math.max(width, height) + 2,
        );
      }

      this.setWorld(world);

      tileIndex = endIndex;

      if (tileIndex < bottomTiles.length) {
        requestAnimationFrame(processNextBatch);
      }
    };

    processNextBatch();
  }

  /**
   * Dynamically imports and returns the QR code generation module.
   *
   * @returns {Promise<Function>} The QR code module for creating codes.
   */
  async getQRCodeModule() {
    const mod = "https://kherrick.github.io/sprite-garden/deps/qrcode.mjs";
    const { qrcode } = await import(mod);

    return qrcode;
  }

  /**
   * Draws a QR code that encodes the given text, using specified tiles for dark and light modules.
   *
   * @param {string} text - Text data to encode as QR code.
   * @param {number} x - X coordinate (in tiles) of the top-left corner to draw the QR code.
   * @param {number} y - Y coordinate (in tiles) of the top-left corner to draw the QR code.
   * @param {*} [onTile=this.tiles.ICE] - Tile used for dark modules of the QR code.
   * @param {*} [offTile=this.tiles.COAL] - Tile used for light modules of the QR code.
   *
   * @returns {Promise<{x:number, y:number, width:number, height:number}>} The position and size of the drawn QR code.
   */
  async drawQRCode(
    text,
    x,
    y,
    onTile = this.tiles.ICE,
    offTile = this.tiles.COAL,
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
        const tile = isDark ? onTile : offTile;

        updates.push({ x: x + col, y: y + row, tile });
      }
    }

    this.batchSetTiles(updates);

    return { x, y, width: size, height: size };
  }

  /**
   * Creates a synthetic KeyboardEvent with specified type and keyCode, mapping
   * key and code values from provided maps or using defaults.
   *
   * @param {string} type - The event type ('keydown', 'keyup', etc.).
   * @param {number} keyCode - The numeric key code for the event.
   * @param {Object} [codeMap=CodeMap] - Map from keyCode to code string.
   * @param {Object} [keyMap=KeyMap] - Map from keyCode to key string.
   *
   * @returns {KeyboardEvent} The constructed KeyboardEvent object.
   */
  createKeyEvent(type, keyCode, codeMap = CodeMap, keyMap = KeyMap) {
    return new KeyboardEvent(type, {
      key: keyMap[keyCode] || "",
      code: codeMap[keyCode] || "",
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
  }

  /**
   * Dispatches a 'keydown' event with the given keyCode to the shadow DOM root.
   *
   * @param {number} keyCode - The keyCode to dispatch a keydown event for.
   *
   * @returns {Promise<void>}
   */
  async holdKey(keyCode) {
    this.shadow.dispatchEvent(this.createKeyEvent("keydown", keyCode));
  }

  /**
   * Dispatches a 'keyup' event with the given keyCode to the shadow DOM root.
   *
   * @param {number} keyCode - The keyCode to dispatch a keyup event for.
   *
   * @returns {Promise<void>}
   */
  async releaseKey(keyCode) {
    this.shadow.dispatchEvent(this.createKeyEvent("keyup", keyCode));
  }

  /**
   * Simulates a key press by dispatching a 'keydown' event, awaiting a hold time,
   * then dispatching a corresponding 'keyup' event.
   *
   * @param {number} keyCode - The keyCode of the key to press.
   * @param {number} [holdTime=100] - Time in milliseconds to hold the key down.
   *
   * @returns {Promise<void>}
   */
  async pressKey(keyCode, holdTime = 100) {
    this.shadow.dispatchEvent(this.createKeyEvent("keydown", keyCode));

    await sleep(holdTime);

    this.shadow.dispatchEvent(this.createKeyEvent("keyup", keyCode));
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
      await this.pressKey(keyCode, delay / 2);
      await sleep(delay);
    }
  }

  /**
   * Sequentially presses a series of keys, each followed by a delay.
   *
   * @param {number[]} keyCodes - Array of key codes to press in sequence.
   * @param {number} [delay=100] - Delay in milliseconds between key presses.
   *
   * @returns {Promise<void>}
   */
  async pressKeySequence(keyCodes, delay = 100) {
    for (const keyCode of keyCodes) {
      await this.pressKey(keyCode, delay / 2);
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

    resizeCanvas(this.shadow, this.config);
  }

  /**
   * Moves in the specified direction while performing a dig operation repeatedly
   * in chunks until the total steps are completed.
   *
   * @param {number} directionKey - The key code representing the movement direction.
   * @param {number} totalSteps - Total steps to move and dig.
   * @param {number} [chunkSize=50] - Maximum steps per move-dig chunk.
   *
   * @returns {Promise<void>}
   */
  async moveAndDig(directionKey, totalSteps, chunkSize = 50) {
    let moved = 0;

    while (moved < totalSteps) {
      const steps = Math.min(chunkSize, totalSteps - moved);

      console.log(
        `Moving with directionKey ${directionKey} and digging ${steps} tiles`,
      );

      await this.holdKey(directionKey);
      await this.pressKeyRepeat(82, steps, 100);
      await this.releaseKey(directionKey);

      moved += steps;
    }
  }
}
