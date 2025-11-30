/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

import { WorldMap } from "./world.mjs";
import { gameConfig } from "../state/state.mjs";

describe("WorldMap class", () => {
  const width = 100;
  const height = 50;

  // Use actual tiles from gameConfig
  const airTile = gameConfig.TILES.AIR;
  const dirtTile = gameConfig.TILES.DIRT;
  const stoneTile = gameConfig.TILES.STONE;
  const grassTile = gameConfig.TILES.GRASS;
  const waterTile = gameConfig.TILES.WATER;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    test("creates a world with correct dimensions", () => {
      const world = new WorldMap(width, height);

      expect(world.width).toBe(width);
      expect(world.height).toBe(height);
    });

    test("initializes data array with correct size", () => {
      const world = new WorldMap(width, height);

      expect(world.data).toBeInstanceOf(Uint8Array);
      expect(world.data.length).toBe(width * height);
    });

    test("initializes all tiles to zero (air) by default", () => {
      const world = new WorldMap(width, height);

      for (let i = 0; i < world.data.length; i++) {
        expect(world.data[i]).toBe(0);
      }
    });

    test("initializes tile mapping", () => {
      const world = new WorldMap(width, height);

      expect(world.tileIdMap).toBeDefined();
      expect(world.reverseTileMap).toBeDefined();
      expect(world.tileIdMap.size).toBeGreaterThan(0);
      expect(world.reverseTileMap.size).toBeGreaterThan(0);
    });
  });

  describe("initializeTileMapping", () => {
    test("maps tile objects to numeric IDs", () => {
      const world = new WorldMap(width, height);

      // The tileIdMap should map the actual tile object to its ID
      expect(world.tileIdMap.get(airTile)).toBeDefined();
      expect(world.tileIdMap.get(dirtTile)).toBeDefined();
      expect(world.tileIdMap.get(stoneTile)).toBeDefined();
    });

    test("creates reverse map from IDs to tiles", () => {
      const world = new WorldMap(width, height);

      expect(world.reverseTileMap.size).toBeGreaterThan(0);
    });

    test("maintains consistent mapping between forward and reverse maps", () => {
      const world = new WorldMap(width, height);

      // For each tile in the forward map, there should be a matching entry in reverse
      for (const [tile, id] of world.tileIdMap.entries()) {
        const reverseTile = world.reverseTileMap.get(id);
        expect(reverseTile).toBeDefined();
        expect(reverseTile).toBe(tile);
      }
    });

    test("maps all tiles from gameConfig", () => {
      const world = new WorldMap(width, height);

      // Every tile in gameConfig should be in the mapping
      for (const [tileName, tile] of Object.entries(gameConfig.TILES)) {
        expect(world.tileIdMap.get(tile)).toBeDefined();
      }
    });
  });

  describe("getTile", () => {
    test("returns AIR tile for unset coordinates", () => {
      const world = new WorldMap(width, height);
      const tile = world.getTile(0, 0);

      expect(tile.id).toBe(airTile.id);
      expect(tile.solid).toBe(false);
    });

    test("returns correct tile after setting it", () => {
      const world = new WorldMap(width, height);

      world.setTile(10, 10, dirtTile);

      const retrieved = world.getTile(10, 10);

      expect(retrieved.id).toBe(dirtTile.id);
      expect(retrieved.solid).toBe(dirtTile.solid);
    });

    test("returns AIR for negative x coordinate", () => {
      const world = new WorldMap(width, height);

      const tile = world.getTile(-1, 0);

      expect(tile.id).toBe(airTile.id);
    });

    test("returns AIR for x coordinate beyond world width", () => {
      const world = new WorldMap(width, height);

      const tile = world.getTile(width, 0);

      expect(tile.id).toBe(airTile.id);
    });

    test("returns AIR for negative y coordinate", () => {
      const world = new WorldMap(width, height);

      const tile = world.getTile(0, -1);

      expect(tile.id).toBe(airTile.id);
    });

    test("returns AIR for y coordinate beyond world height", () => {
      const world = new WorldMap(width, height);

      const tile = world.getTile(0, height);

      expect(tile.id).toBe(airTile.id);
    });

    test("retrieves tiles from all corners of the world", () => {
      const world = new WorldMap(width, height);

      // Top-left
      world.setTile(0, 0, stoneTile);

      expect(world.getTile(0, 0).id).toBe(stoneTile.id);

      // Top-right
      world.setTile(width - 1, 0, stoneTile);

      expect(world.getTile(width - 1, 0).id).toBe(stoneTile.id);

      // Bottom-left
      world.setTile(0, height - 1, stoneTile);

      expect(world.getTile(0, height - 1).id).toBe(stoneTile.id);

      // Bottom-right
      world.setTile(width - 1, height - 1, stoneTile);

      expect(world.getTile(width - 1, height - 1).id).toBe(stoneTile.id);
    });

    test("uses correct linear indexing for 2D coordinates", () => {
      const world = new WorldMap(10, 10);

      // Set tile at (5, 3)
      world.setTile(5, 3, grassTile);

      // Linear index should be 3 * 10 + 5 = 35
      const grassIdInMap = world.tileIdMap.get(grassTile);

      expect(world.data[35]).toBe(grassIdInMap);
      expect(world.getTile(5, 3).id).toBe(grassTile.id);
    });

    test("returns AIR when reverseTileMap lookup fails", () => {
      const world = new WorldMap(width, height);

      // Manually corrupt the reverse map to test fallback
      world.reverseTileMap.delete(0);
      world.data[0] = 0;

      const tile = world.getTile(0, 0);

      expect(tile).toBe(airTile);
    });
  });

  describe("setTile", () => {
    test("sets a tile at valid coordinates", () => {
      const world = new WorldMap(width, height);

      world.setTile(10, 10, dirtTile);

      expect(world.getTile(10, 10).id).toBe(dirtTile.id);
    });

    test("ignores setTile for negative x coordinate", () => {
      const world = new WorldMap(width, height);

      world.setTile(-1, 0, stoneTile);

      // Should remain as AIR
      expect(world.getTile(-1, 0).id).toBe(airTile.id);
    });

    test("ignores setTile for x coordinate beyond world width", () => {
      const world = new WorldMap(width, height);

      world.setTile(width, 0, stoneTile);

      expect(world.getTile(width, 0).id).toBe(airTile.id);
    });

    test("ignores setTile for negative y coordinate", () => {
      const world = new WorldMap(width, height);

      world.setTile(0, -1, stoneTile);

      expect(world.getTile(0, -1).id).toBe(airTile.id);
    });

    test("ignores setTile for y coordinate beyond world height", () => {
      const world = new WorldMap(width, height);

      world.setTile(0, height, stoneTile);

      expect(world.getTile(0, height).id).toBe(airTile.id);
    });

    test("overwrites existing tile", () => {
      const world = new WorldMap(width, height);

      world.setTile(5, 5, dirtTile);

      expect(world.getTile(5, 5).id).toBe(dirtTile.id);

      world.setTile(5, 5, stoneTile);

      expect(world.getTile(5, 5).id).toBe(stoneTile.id);
    });

    test("ignores setting tile with unknown tile object", () => {
      const world = new WorldMap(width, height);
      const unknownTile = { id: 999999, solid: true };

      world.setTile(5, 5, unknownTile);

      // Should remain as AIR because the tile ID is not in the mapping
      expect(world.getTile(5, 5).id).toBe(airTile.id);
    });

    test("sets multiple tiles independently", () => {
      const world = new WorldMap(width, height);

      world.setTile(0, 0, dirtTile);
      world.setTile(10, 10, stoneTile);
      world.setTile(20, 20, grassTile);

      expect(world.getTile(0, 0).id).toBe(dirtTile.id);
      expect(world.getTile(10, 10).id).toBe(stoneTile.id);
      expect(world.getTile(20, 20).id).toBe(grassTile.id);
    });

    test("correctly stores tile ID in data array", () => {
      const world = new WorldMap(width, height);

      world.setTile(5, 5, dirtTile);
      const dirtId = world.tileIdMap.get(dirtTile);

      // Linear index for (5, 5) in 100-width world is 5*100 + 5 = 505
      expect(world.data[5 * width + 5]).toBe(dirtId);
    });
  });

  describe("toArray", () => {
    test("returns a 2D array representation of the world", () => {
      const world = new WorldMap(10, 10);

      const array = world.toArray();

      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBe(10);
      expect(Array.isArray(array[0])).toBe(true);
      expect(array[0].length).toBe(10);
    });

    test("preserves all tile data when converting to array", () => {
      const world = new WorldMap(10, 10);

      world.setTile(3, 5, dirtTile);
      world.setTile(7, 2, stoneTile);

      const array = world.toArray();

      expect(array[3][5]).toBe(dirtTile.id);
      expect(array[7][2]).toBe(stoneTile.id);
    });

    test("includes air tiles in array representation", () => {
      const world = new WorldMap(5, 5);

      const array = world.toArray();

      // All tiles should be air by default
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          expect(array[x][y]).toBe(airTile.id);
        }
      }
    });

    test("creates independent array copy", () => {
      const world = new WorldMap(10, 10);

      world.setTile(5, 5, dirtTile);

      const array1 = world.toArray();

      expect(array1[5][5]).toBe(dirtTile.id);

      // Modify world
      world.setTile(5, 5, stoneTile);

      // Original array should be unchanged
      expect(array1[5][5]).toBe(dirtTile.id);

      // New array should have the update
      const array2 = world.toArray();

      expect(array2[5][5]).toBe(stoneTile.id);
    });

    test("handles world with mixed tile types", () => {
      const world = new WorldMap(5, 5);

      world.setTile(0, 0, dirtTile);
      world.setTile(1, 0, stoneTile);
      world.setTile(2, 0, grassTile);
      world.setTile(3, 0, waterTile);

      const array = world.toArray();

      expect(array[0][0]).toBe(dirtTile.id);
      expect(array[1][0]).toBe(stoneTile.id);
      expect(array[2][0]).toBe(grassTile.id);
      expect(array[3][0]).toBe(waterTile.id);
    });
  });

  describe("fromArray", () => {
    test("creates a world from 2D array data", () => {
      const worldData = [];

      for (let x = 0; x < 5; x++) {
        worldData[x] = [];
        for (let y = 0; y < 5; y++) {
          worldData[x][y] = airTile;
        }
      }

      const world = WorldMap.fromArray(worldData, 5, 5);

      expect(world.width).toBe(5);
      expect(world.height).toBe(5);
    });

    test("initializes tiles from array data", () => {
      const worldData = [
        [dirtTile, stoneTile],
        [airTile, grassTile],
      ];

      const world = WorldMap.fromArray(worldData, 2, 2);

      expect(world.getTile(0, 0).id).toBe(dirtTile.id);
      expect(world.getTile(0, 1).id).toBe(stoneTile.id);
      expect(world.getTile(1, 0).id).toBe(airTile.id);
      expect(world.getTile(1, 1).id).toBe(grassTile.id);
    });

    test("defaults to AIR for missing array rows", () => {
      const worldData = [
        [dirtTile],
        // Second column missing
      ];

      const world = WorldMap.fromArray(worldData, 2, 2);

      expect(world.getTile(0, 0).id).toBe(dirtTile.id);
      expect(world.getTile(1, 0).id).toBe(airTile.id);
    });

    test("defaults to AIR for null tiles", () => {
      const worldData = [
        [null, dirtTile],
        [stoneTile, null],
      ];

      const world = WorldMap.fromArray(worldData, 2, 2);

      expect(world.getTile(0, 0).id).toBe(airTile.id);
      expect(world.getTile(0, 1).id).toBe(dirtTile.id);
      expect(world.getTile(1, 0).id).toBe(stoneTile.id);
      expect(world.getTile(1, 1).id).toBe(airTile.id);
    });

    test("defaults to AIR for tiles with missing ID property", () => {
      const worldData = [[{ solid: true }]];

      const world = WorldMap.fromArray(worldData, 1, 1);

      // Tile with no ID should default to air
      expect(world.getTile(0, 0).id).toBe(airTile.id);
    });

    test("handles sparse array data", () => {
      const worldData = [];
      worldData[2] = [stoneTile];

      const world = WorldMap.fromArray(worldData, 5, 2);

      // Empty columns should be air
      expect(world.getTile(0, 0).id).toBe(airTile.id);
      expect(world.getTile(1, 0).id).toBe(airTile.id);

      // Populated column
      expect(world.getTile(2, 0).id).toBe(stoneTile.id);
      expect(world.getTile(3, 0).id).toBe(airTile.id);
    });

    test("handles large world data", () => {
      const worldDataWidth = 100;
      const worldDataHeight = 50;
      const worldData = [];

      for (let x = 0; x < worldDataWidth; x++) {
        worldData[x] = [];
        for (let y = 0; y < worldDataHeight; y++) {
          // Alternate between air and dirt
          worldData[x][y] = (x + y) % 2 === 0 ? airTile : dirtTile;
        }
      }

      const world = WorldMap.fromArray(
        worldData,
        worldDataWidth,
        worldDataHeight,
      );

      expect(world.width).toBe(worldDataWidth);
      expect(world.height).toBe(worldDataHeight);

      const expectedId = (50 + 25) % 2 === 0 ? airTile.id : dirtTile.id;

      expect(world.getTile(50, 25).id).toBe(expectedId);
    });

    test("round-trips array conversion", () => {
      const world1 = new WorldMap(10, 10);

      world1.setTile(3, 5, dirtTile);
      world1.setTile(7, 2, stoneTile);

      const array = world1.toArray();
      const world2 = WorldMap.fromArray(array, 10, 10);

      expect(world2.getTile(3, 5).id).toBe(dirtTile.id);
      expect(world2.getTile(7, 2).id).toBe(stoneTile.id);
      expect(world2.getTile(0, 0).id).toBe(airTile.id);
    });

    test("logs warning for unknown tile IDs", () => {
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const worldData = [
        [{ id: 999999, solid: true }], // Unknown ID
      ];

      WorldMap.fromArray(worldData, 1, 1);

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain("Unknown tile ID");

      consoleSpy.mockRestore();
    });

    test("defaults unknown tiles to AIR", () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});

      const worldData = [[{ id: 999999, solid: true }]];

      const world = WorldMap.fromArray(worldData, 1, 1);

      expect(world.getTile(0, 0).id).toBe(airTile.id);

      jest.restoreAllMocks();
    });

    test("handles undefined ID property", () => {
      const worldData = [[{ id: undefined }]];

      const world = WorldMap.fromArray(worldData, 1, 1);

      expect(world.getTile(0, 0).id).toBe(airTile.id);
    });

    test("handles null ID property", () => {
      const worldData = [[{ id: null }]];

      const world = WorldMap.fromArray(worldData, 1, 1);

      expect(world.getTile(0, 0).id).toBe(airTile.id);
    });
  });

  describe("edge cases", () => {
    test("handles single tile world", () => {
      const world = new WorldMap(1, 1);

      world.setTile(0, 0, dirtTile);

      expect(world.getTile(0, 0).id).toBe(dirtTile.id);
    });

    test("handles very large world", () => {
      const world = new WorldMap(1000, 1000);

      expect(world.data.length).toBe(1000000);
      expect(world.getTile(500, 500).id).toBe(airTile.id);
    });

    test("handles rectangular world (wider than tall)", () => {
      const world = new WorldMap(200, 50);

      expect(world.width).toBe(200);
      expect(world.height).toBe(50);

      world.setTile(150, 25, dirtTile);

      expect(world.getTile(150, 25).id).toBe(dirtTile.id);
    });

    test("handles rectangular world (taller than wide)", () => {
      const world = new WorldMap(50, 200);

      expect(world.width).toBe(50);
      expect(world.height).toBe(200);

      world.setTile(25, 150, dirtTile);

      expect(world.getTile(25, 150).id).toBe(dirtTile.id);
    });
  });

  describe("data persistence", () => {
    test("data persists after setting and getting multiple times", () => {
      const world = new WorldMap(10, 10);

      world.setTile(3, 3, dirtTile);
      world.setTile(5, 7, stoneTile);

      expect(world.getTile(3, 3).id).toBe(dirtTile.id);
      expect(world.getTile(5, 7).id).toBe(stoneTile.id);

      // Setting again
      world.setTile(3, 3, stoneTile);

      expect(world.getTile(3, 3).id).toBe(stoneTile.id);
      expect(world.getTile(5, 7).id).toBe(stoneTile.id);
    });

    test("different coordinates do not interfere with each other", () => {
      const world = new WorldMap(10, 10);

      world.setTile(0, 0, dirtTile);
      world.setTile(9, 9, stoneTile);

      expect(world.getTile(0, 0).id).toBe(dirtTile.id);
      expect(world.getTile(9, 9).id).toBe(stoneTile.id);
      expect(world.getTile(5, 5).id).toBe(airTile.id);
    });
  });
});
