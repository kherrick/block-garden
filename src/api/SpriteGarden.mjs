import qrcode from "../../deps/qrcode.mjs";

import { markWaterRegionDirty } from "../water/markWaterRegionDirty.mjs";
import { resizeCanvas } from "../util/resizeCanvas.mjs";
import { sleep } from "../util/sleep.mjs";

import { characters as Characters } from "./characters.mjs";
import { codeMap as CodeMap, keyMap as KeyMap } from "./keys.mjs";

export class SpriteGarden {
  constructor() {
    this.gThis = globalThis;
    this.doc = this.gThis.document;

    this.config = this.gThis.spriteGarden.config;
    this.state = this.gThis.spriteGarden.state;
    this.tiles = this.config.TILES;
  }

  get shadow() {
    const findElement = (e, n) => {
      if (!e) {
        return null;
      }

      if (e.tagName === n.toUpperCase() && e.shadowRoot) {
        return e;
      }

      const children = [...(e.children || [])];

      if (e.shadowRoot) {
        children.push(e.shadowRoot);
      }

      return children.map((c) => findElement(c, n)).find(Boolean) || null;
    };

    const element = findElement(this.doc, "sprite-garden");
    return element ? element.shadowRoot : null;
  }

  getWorld() {
    return this.gThis.spriteGarden.getState("world");
  }

  setWorld(world) {
    this.gThis.spriteGarden.setState("world", world);
  }

  setFogMode(mode) {
    // 'fog', 'clear'
    this.config.fogMode.set(mode);
  }

  setBreakMode(mode) {
    // 'regular' or 'extra'
    this.config.breakMode.set(mode);
  }

  getInventory() {
    return this.state.materialsInventory?.get
      ? this.state.materialsInventory.get()
      : {};
  }

  getMaterialCount(materialType) {
    return this.getInventory()[materialType] || 0;
  }

  setMaterialCount(materialType, count) {
    const inventory = this.getInventory();

    inventory[materialType] = count;

    this.state.materialsInventory.set(inventory);
  }

  getTile(x, y) {
    const world = this.getWorld();

    return world.getTile(x, y);
  }

  setTile(x, y, tileType) {
    const world = this.getWorld();

    world.setTile(x, y, tileType);

    this.setWorld(world);
  }

  batchSetTiles(updates) {
    const world = this.getWorld();

    updates.forEach(({ x, y, tile }) => world.setTile(x, y, tile));

    this.setWorld(world);
  }

  fillRect(x, y, width, height, tileType) {
    const updates = [];

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        updates.push({ x: x + col, y: y + row, tile: tileType });
      }
    }

    this.batchSetTiles(updates);
  }

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

  drawSparseBitmapBottomCenter(
    bitmap,
    bottomCenterX,
    bottomCenterY,
    tile = this.tiles.LAVA,
  ) {
    const width = bitmap[0].length;
    const height = bitmap.length;
    const leftX = bottomCenterX - Math.floor(width / 2);

    // Use drawBitmap but need to flip Y coordinate
    const updates = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (bitmap[y][x] === 1) {
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
        markWaterRegionDirty({
          x: x,
          y: y,
          radius: Math.max(width, height) + 2,
          queue: this.state.waterPhysicsQueue,
          worldWidth: this.config.WORLD_WIDTH.get(),
          worldHeight: this.config.WORLD_HEIGHT.get(),
        });
      }

      this.setWorld(world);

      tileIndex = endIndex;

      if (tileIndex < bottomTiles.length) {
        requestAnimationFrame(processNextBatch);
      }
    };

    processNextBatch();
  }

  async drawQRCode(
    text,
    x,
    y,
    onTile = this.tiles.ICE,
    offTile = this.tiles.COAL,
  ) {
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

  async holdKey(keyCode) {
    this.shadow.dispatchEvent(this.createKeyEvent("keydown", keyCode));
  }

  async releaseKey(keyCode) {
    this.shadow.dispatchEvent(this.createKeyEvent("keyup", keyCode));
  }

  async pressKey(keyCode, holdTime = 100) {
    this.shadow.dispatchEvent(this.createKeyEvent("keydown", keyCode));

    await sleep(holdTime);

    this.shadow.dispatchEvent(this.createKeyEvent("keyup", keyCode));
  }

  async pressKeyRepeat(keyCode, times, delay = 100) {
    for (let i = 0; i < times; i++) {
      await this.pressKey(keyCode, delay / 2);
      await sleep(delay);
    }
  }

  async pressKeySequence(keyCodes, delay = 100) {
    for (const keyCode of keyCodes) {
      await this.pressKey(keyCode, delay / 2);
      await sleep(delay);
    }
  }

  async showFullScreen() {
    const resolutionSelect = this.shadow.getElementById("resolutionSelect");
    const fullscreenOption = resolutionSelect.querySelector(
      '[value="fullscreen"]',
    );

    fullscreenOption.removeAttribute("hidden");

    resolutionSelect.value = "fullscreen";
  }

  async setFullscreen() {
    this.showFullScreen();

    this.config.currentResolution.set("fullscreen");

    resizeCanvas(this.shadow, this.config);
  }

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
