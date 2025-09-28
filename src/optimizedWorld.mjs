import { configSignals } from "./state.mjs";

export class OptimizedWorld {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);

    // Initialize tile mapping - this is the key fix
    this.initializeTileMapping();
  }

  initializeTileMapping() {
    // Get tiles from config signals (they should be available)
    const tiles = configSignals.TILES;

    this.tileIdMap = new Map();
    this.reverseTileMap = new Map();

    let id = 0;
    for (const [name, tile] of Object.entries(tiles)) {
      this.tileIdMap.set(tile, id);
      this.reverseTileMap.set(id, tile);
      id++;
    }
  }

  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return configSignals.TILES.AIR;
    }
    const tileId = this.data[y * this.width + x];
    return this.reverseTileMap.get(tileId) || configSignals.TILES.AIR;
  }

  setTile(x, y, tile) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const tileId = this.tileIdMap.get(tile);
    if (tileId !== undefined) {
      this.data[y * this.width + x] = tileId;
    }
  }

  // Convert from old array format
  static fromArray(oldWorld, width, height) {
    const optimizedWorld = new OptimizedWorld(width, height);
    const TILES = configSignals.TILES;

    for (let x = 0; x < width; x++) {
      if (!oldWorld[x]) continue;
      for (let y = 0; y < height; y++) {
        const savedTile = oldWorld[x][y];

        if (!savedTile) {
          optimizedWorld.setTile(x, y, TILES.AIR);

          continue;
        }

        // Find the matching tile from TILES by comparing properties
        let matchingTile = TILES.AIR;

        for (const [_, tile] of Object.entries(TILES)) {
          if (tile.id === savedTile.id) {
            matchingTile = tile;

            break;
          }
        }

        optimizedWorld.setTile(x, y, matchingTile);
      }
    }

    return optimizedWorld;
  }

  // Convert to array format for saving
  toArray() {
    const arrayWorld = [];

    for (let x = 0; x < this.width; x++) {
      arrayWorld[x] = [];

      for (let y = 0; y < this.height; y++) {
        arrayWorld[x][y] = this.getTile(x, y);
      }
    }
    return arrayWorld;
  }
}
