import { gameConfig } from "../state/state.mjs";

export class WorldMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);

    this.initializeTileMapping();
  }

  initializeTileMapping() {
    // Get tiles
    const tiles = gameConfig.TILES;

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
      return gameConfig.TILES.AIR;
    }

    const tileId = this.data[y * this.width + x];

    return this.reverseTileMap.get(tileId) || gameConfig.TILES.AIR;
  }

  setTile(x, y, tile) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

    const tileId = this.tileIdMap.get(tile);

    if (tileId !== undefined) {
      this.data[y * this.width + x] = tileId;
    }
  }

  // Convert from array format
  static fromArray(worldData, width, height) {
    const worldMap = new WorldMap(width, height);
    const tiles = gameConfig.TILES;

    // Create a map of tile IDs to tile objects for faster lookup
    const tileIdMap = new Map();
    for (const [_, tile] of Object.entries(tiles)) {
      if (tile && typeof tile.id === "number") {
        tileIdMap.set(tile.id, tile);
      }
    }

    for (let x = 0; x < width; x++) {
      if (!worldData[x]) {
        continue;
      }

      for (let y = 0; y < height; y++) {
        const savedTile = worldData[x][y];

        if (!savedTile || savedTile.id === undefined || savedTile.id === null) {
          worldMap.setTile(x, y, tiles.AIR);

          continue;
        }

        // Find the matching tile from our tile map
        const matchingTile = tileIdMap.get(savedTile.id);

        if (matchingTile) {
          worldMap.setTile(x, y, matchingTile);
        } else {
          console.warn(
            `Unknown tile ID ${savedTile.id} at (${x}, ${y}), defaulting to AIR`,
          );

          worldMap.setTile(x, y, tiles.AIR);
        }
      }
    }

    return worldMap;
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
