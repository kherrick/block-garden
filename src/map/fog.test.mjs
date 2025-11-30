/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { Signal } from "signal-polyfill";

import { FogMap } from "./fog.mjs";

describe("FogMap class", () => {
  const width = 100;
  const height = 50;
  const colors = {
    "--sg-tile-fog-color": "#000000",
  };

  describe("constructor", () => {
    test("creates a FogMap with correct dimensions", () => {
      const fog = new FogMap(width, height, colors);

      expect(fog.width).toBe(width);
      expect(fog.height).toBe(height);
      expect(fog.colors).toBe(colors);
    });

    test("initializes data array with correct size", () => {
      const fog = new FogMap(width, height, colors);

      expect(fog.data).toBeInstanceOf(Uint8Array);
      expect(fog.data.length).toBe(width * height);
    });

    test("initializes all tiles to 0 (unexplored) by default", () => {
      const fog = new FogMap(width, height, colors);

      for (let i = 0; i < fog.data.length; i++) {
        expect(fog.data[i]).toBe(0);
      }
    });

    test("initializes cache with correct structure", () => {
      const fog = new FogMap(width, height, colors);

      expect(fog.cache).toHaveProperty("canvas");
      expect(fog.cache).toHaveProperty("lastPlayerTileX");
      expect(fog.cache).toHaveProperty("lastPlayerTileY");
      expect(fog.cache).toHaveProperty("lastCameraGridX");
      expect(fog.cache).toHaveProperty("lastCameraGridY");
      expect(fog.cache).toHaveProperty("needsUpdate");
      expect(fog.cache.needsUpdate).toBe(true);
    });

    test("handles optional colors parameter", () => {
      const fog = new FogMap(width, height);

      expect(fog.colors).toBeUndefined();
      expect(fog.width).toBe(width);
      expect(fog.height).toBe(height);
    });
  });

  describe("isExplored", () => {
    test("returns false for unexplored tile", () => {
      const fog = new FogMap(width, height, colors);

      expect(fog.isExplored(5, 5)).toBe(false);
    });

    test("returns true for explored tile", () => {
      const fog = new FogMap(width, height, colors);
      fog.data[5 * width + 5] = 1;

      expect(fog.isExplored(5, 5)).toBe(true);
    });

    test("returns false for negative x coordinate", () => {
      const fog = new FogMap(width, height, colors);

      expect(fog.isExplored(-1, 5)).toBe(false);
    });

    test("returns false for x coordinate beyond width", () => {
      const fog = new FogMap(width, height, colors);

      expect(fog.isExplored(width, 5)).toBe(false);
    });

    test("returns false for negative y coordinate", () => {
      const fog = new FogMap(width, height, colors);

      expect(fog.isExplored(5, -1)).toBe(false);
    });

    test("returns false for y coordinate beyond height", () => {
      const fog = new FogMap(width, height, colors);

      expect(fog.isExplored(5, height)).toBe(false);
    });

    test("checks correct linear index for 2D coordinates", () => {
      const fog = new FogMap(width, height, colors);
      const x = 10;
      const y = 20;
      const index = y * width + x;

      fog.data[index] = 1;

      expect(fog.isExplored(x, y)).toBe(true);
    });
  });

  describe("setExplored", () => {
    test("marks a tile as explored", () => {
      const fog = new FogMap(width, height, colors);

      fog.setExplored(5, 5);

      expect(fog.isExplored(5, 5)).toBe(true);
    });

    test("returns true when marking a new tile as explored", () => {
      const fog = new FogMap(width, height, colors);

      const result = fog.setExplored(5, 5);

      expect(result).toBe(true);
    });

    test("returns false when marking an already explored tile", () => {
      const fog = new FogMap(width, height, colors);
      fog.setExplored(5, 5);

      const result = fog.setExplored(5, 5);

      expect(result).toBe(false);
    });

    test("returns false for negative x coordinate", () => {
      const fog = new FogMap(width, height, colors);

      const result = fog.setExplored(-1, 5);

      expect(result).toBe(false);
    });

    test("returns false for x coordinate beyond width", () => {
      const fog = new FogMap(width, height, colors);

      const result = fog.setExplored(width, 5);

      expect(result).toBe(false);
    });

    test("returns false for negative y coordinate", () => {
      const fog = new FogMap(width, height, colors);

      const result = fog.setExplored(5, -1);

      expect(result).toBe(false);
    });

    test("returns false for y coordinate beyond height", () => {
      const fog = new FogMap(width, height, colors);

      const result = fog.setExplored(5, height);

      expect(result).toBe(false);
    });

    test("sets multiple tiles independently", () => {
      const fog = new FogMap(width, height, colors);

      fog.setExplored(1, 1);
      fog.setExplored(2, 2);
      fog.setExplored(3, 3);

      expect(fog.isExplored(1, 1)).toBe(true);
      expect(fog.isExplored(2, 2)).toBe(true);
      expect(fog.isExplored(3, 3)).toBe(true);
      expect(fog.isExplored(4, 4)).toBe(false);
    });
  });

  describe("setExploredBatch", () => {
    test("marks multiple tiles as explored", () => {
      const fog = new FogMap(width, height, colors);
      const tiles = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ];

      fog.setExploredBatch(tiles);

      expect(fog.isExplored(1, 1)).toBe(true);
      expect(fog.isExplored(2, 2)).toBe(true);
      expect(fog.isExplored(3, 3)).toBe(true);
    });

    test("returns true if any tiles are newly explored", () => {
      const fog = new FogMap(width, height, colors);
      const tiles = [{ x: 1, y: 1 }];

      const result = fog.setExploredBatch(tiles);

      expect(result).toBe(true);
    });

    test("returns false if no tiles are newly explored", () => {
      const fog = new FogMap(width, height, colors);
      fog.setExplored(1, 1);
      const tiles = [{ x: 1, y: 1 }];

      const result = fog.setExploredBatch(tiles);

      expect(result).toBe(false);
    });

    test("returns true if any tiles in batch are newly explored", () => {
      const fog = new FogMap(width, height, colors);
      fog.setExplored(1, 1);
      const tiles = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ];

      const result = fog.setExploredBatch(tiles);

      expect(result).toBe(true);
    });

    test("handles empty tile array", () => {
      const fog = new FogMap(width, height, colors);

      const result = fog.setExploredBatch([]);

      expect(result).toBe(false);
    });

    test("handles out-of-bounds tiles gracefully", () => {
      const fog = new FogMap(width, height, colors);
      const tiles = [
        { x: -1, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: height + 1 },
      ];

      const result = fog.setExploredBatch(tiles);

      expect(fog.isExplored(5, 5)).toBe(true);
      expect(result).toBe(true);
    });
  });

  describe("reset", () => {
    test("clears all explored tiles", () => {
      const fog = new FogMap(width, height, colors);
      fog.setExplored(5, 5);
      fog.setExplored(10, 10);

      fog.reset();

      expect(fog.isExplored(5, 5)).toBe(false);
      expect(fog.isExplored(10, 10)).toBe(false);
    });

    test("sets needsUpdate flag to true", () => {
      const fog = new FogMap(width, height, colors);
      fog.cache.needsUpdate = false;

      fog.reset();

      expect(fog.cache.needsUpdate).toBe(true);
    });

    test("clears entire data array", () => {
      const fog = new FogMap(width, height, colors);

      // Mark all tiles as explored
      for (let i = 0; i < fog.data.length; i++) {
        fog.data[i] = 1;
      }

      fog.reset();

      for (let i = 0; i < fog.data.length; i++) {
        expect(fog.data[i]).toBe(0);
      }
    });
  });

  describe("fromObject", () => {
    test("creates FogMap from object representation", () => {
      const fogObj = {
        "5,5": true,
        "10,10": true,
      };

      const fog = FogMap.fromObject(fogObj, width, height, colors);

      expect(fog.isExplored(5, 5)).toBe(true);
      expect(fog.isExplored(10, 10)).toBe(true);
      expect(fog.isExplored(6, 6)).toBe(false);
    });

    test("handles empty object", () => {
      const fog = FogMap.fromObject({}, width, height, colors);

      expect(fog.width).toBe(width);
      expect(fog.height).toBe(height);
      expect(fog.isExplored(5, 5)).toBe(false);
    });

    test("handles null object", () => {
      const fog = FogMap.fromObject(null, width, height, colors);

      expect(fog.width).toBe(width);
      expect(fog.height).toBe(height);
    });

    test("ignores false values in object", () => {
      const fogObj = {
        "5,5": false,
        "10,10": true,
      };

      const fog = FogMap.fromObject(fogObj, width, height, colors);

      expect(fog.isExplored(5, 5)).toBe(false);
      expect(fog.isExplored(10, 10)).toBe(true);
    });

    test("handles large coordinate values", () => {
      const fogObj = {
        "99,49": true,
      };

      const fog = FogMap.fromObject(fogObj, width, height, colors);

      expect(fog.isExplored(99, 49)).toBe(true);
    });

    test("ignores out-of-bounds coordinates", () => {
      const fogObj = {
        "1000,1000": true,
        "5,5": true,
      };

      const fog = FogMap.fromObject(fogObj, width, height, colors);

      expect(fog.isExplored(5, 5)).toBe(true);
      expect(fog.isExplored(1000, 1000)).toBe(false);
    });

    test("initializes with correct dimensions and colors", () => {
      const fogObj = { "5,5": true };

      const fog = FogMap.fromObject(fogObj, width, height, colors);

      expect(fog.width).toBe(width);
      expect(fog.height).toBe(height);
      expect(fog.colors).toBe(colors);
    });
  });

  describe("toObject", () => {
    test("converts FogMap to object representation", () => {
      const fog = new FogMap(width, height, colors);
      fog.setExplored(5, 5);
      fog.setExplored(10, 10);

      const obj = fog.toObject();

      expect(obj["5,5"]).toBe(1);
      expect(obj["10,10"]).toBe(1);
    });

    test("returns sparse object with only explored tiles", () => {
      const fog = new FogMap(5, 5, colors);
      fog.setExplored(2, 2);

      const obj = fog.toObject();

      expect(Object.keys(obj).length).toBe(1);
      expect(obj["2,2"]).toBe(1);
    });

    test("returns empty object for fully unexplored map", () => {
      const fog = new FogMap(width, height, colors);

      const obj = fog.toObject();

      expect(Object.keys(obj).length).toBe(0);
    });

    test("includes all explored tiles", () => {
      const fog = new FogMap(10, 10, colors);
      fog.setExplored(0, 0);
      fog.setExplored(5, 5);
      fog.setExplored(9, 9);

      const obj = fog.toObject();

      expect(obj["0,0"]).toBe(1);
      expect(obj["5,5"]).toBe(1);
      expect(obj["9,9"]).toBe(1);
      expect(Object.keys(obj).length).toBe(3);
    });
  });

  describe("updateFromPlayer", () => {
    test("updates explored map based on player position", () => {
      const fog = new FogMap(100, 100, colors);
      const player = new Signal.State({
        x: 160,
        y: 160,
        width: 8,
        height: 8,
      });
      const tileSize = 16;

      fog.updateFromPlayer(player, tileSize, 5);

      // Player center is at (164, 164), which is tile (10, 10)
      expect(fog.isExplored(10, 10)).toBe(true);
    });

    test("returns true when map is updated", () => {
      const fog = new FogMap(100, 100, colors);
      const player = new Signal.State({
        x: 160,
        y: 160,
        width: 8,
        height: 8,
      });

      const result = fog.updateFromPlayer(player, 16, 5);

      expect(result).toBe(true);
    });

    test("returns false when map is not updated", () => {
      const fog = new FogMap(100, 100, colors);
      const player = new Signal.State({
        x: 160,
        y: 160,
        width: 8,
        height: 8,
      });

      fog.updateFromPlayer(player, 16, 5);
      const result = fog.updateFromPlayer(player, 16, 5);

      expect(result).toBe(false);
    });

    test("reveals tiles in circular radius around player", () => {
      const fog = new FogMap(100, 100, colors);
      const player = new Signal.State({
        x: 160,
        y: 160,
        width: 8,
        height: 8,
      });

      fog.updateFromPlayer(player, 16, 3);

      // Check nearby tiles are explored
      expect(fog.isExplored(10, 10)).toBe(true);
      expect(fog.isExplored(11, 10)).toBe(true);
      expect(fog.isExplored(10, 11)).toBe(true);
    });

    test("respects fogRevealRadius parameter", () => {
      const fog = new FogMap(100, 100, colors);
      const player = new Signal.State({
        x: 160,
        y: 160,
        width: 8,
        height: 8,
      });

      fog.updateFromPlayer(player, 16, 1);

      // With radius 1, should only reveal tiles very close to player
      expect(fog.isExplored(10, 10)).toBe(true);
      // Far away tiles should not be revealed
      expect(fog.isExplored(5, 5)).toBe(false);
    });

    test("uses default fog radius of 15", () => {
      const fog = new FogMap(100, 100, colors);
      const player = new Signal.State({
        x: 160,
        y: 160,
        width: 8,
        height: 8,
      });

      fog.updateFromPlayer(player, 16);

      // With default radius 15, should reveal large area
      // Tile at distance ~14 should be revealed
      expect(fog.isExplored(10, 10)).toBe(true);
    });

    test("handles player at world edge", () => {
      const fog = new FogMap(100, 100, colors);
      const player = new Signal.State({
        x: 0,
        y: 0,
        width: 8,
        height: 8,
      });

      const result = fog.updateFromPlayer(player, 16, 2);

      expect(result).toBe(true);
      expect(fog.isExplored(0, 0)).toBe(true);
    });
  });

  describe("render", () => {
    let canvas;
    let ctx;

    beforeEach(() => {
      canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;

      ctx = {
        fillRect: jest.fn(),
        fillStyle: "",
      };
    });

    test("does nothing if ctx is null", () => {
      const fog = new FogMap(width, height, colors);

      fog.render(null, canvas, 16, new Signal.State({ x: 0, y: 0 }));

      // Should not throw
    });

    test("does nothing if canvas is null", () => {
      const fog = new FogMap(width, height, colors);

      fog.render(ctx, null, 16, new Signal.State({ x: 0, y: 0 }));

      // Should not throw
    });

    test("sets fillStyle to fog color", () => {
      const fog = new FogMap(width, height, colors);
      const camera = new Signal.State({ x: 0, y: 0 });

      fog.render(ctx, canvas, 16, camera);

      expect(ctx.fillStyle).toBe(colors["--sg-tile-fog-color"]);
    });

    test("renders fog for unexplored tiles", () => {
      const fog = new FogMap(width, height, colors);
      fog.setExplored(5, 5);

      const camera = new Signal.State({ x: 0, y: 0 });
      fog.render(ctx, canvas, 16, camera);

      expect(ctx.fillRect).toHaveBeenCalled();
    });

    test("does not render fog for explored tiles", () => {
      const fog = new FogMap(5, 5, colors);
      // Explore all tiles

      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          fog.setExplored(x, y);
        }
      }

      const camera = new Signal.State({ x: 0, y: 0 });
      fog.render(ctx, canvas, 16, camera);

      expect(ctx.fillRect).not.toHaveBeenCalled();
    });

    test("respects camera position", () => {
      const fog = new FogMap(width, height, colors);
      fog.setExplored(0, 0);

      const camera = new Signal.State({ x: 100, y: 100 });
      fog.render(ctx, canvas, 16, camera);

      // Should still calculate correctly with camera offset
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe("renderScaled", () => {
    let canvas;
    let ctx;

    beforeEach(() => {
      canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;

      ctx = {
        fillRect: jest.fn(),
        fillStyle: "",
      };
    });

    test("does nothing if ctx is null", () => {
      const fog = new FogMap(width, height, colors);

      fog.renderScaled(null, canvas, 16, new Signal.State({ x: 0, y: 0 }));

      // Should not throw
    });

    test("does nothing if canvas is null", () => {
      const fog = new FogMap(width, height, colors);

      fog.renderScaled(ctx, null, 16, new Signal.State({ x: 0, y: 0 }));

      // Should not throw
    });

    test("uses default fogScale of 2", () => {
      const fog = new FogMap(width, height, colors);
      const camera = new Signal.State({ x: 0, y: 0 });

      fog.renderScaled(ctx, canvas, 16, camera);

      // Should render without error
      expect(ctx.fillStyle).toBe(colors["--sg-tile-fog-color"]);
    });

    test("renders scaled fog blocks", () => {
      const fog = new FogMap(width, height, colors);
      fog.setExplored(0, 0);

      const camera = new Signal.State({ x: 0, y: 0 });
      fog.renderScaled(ctx, canvas, 16, camera, 2);

      expect(ctx.fillRect).toHaveBeenCalled();
    });

    test("renders fog blocks only for unexplored areas", () => {
      const fog = new FogMap(100, 100, colors);

      // Leave most tiles unexplored
      const camera = new Signal.State({ x: 0, y: 0 });
      fog.renderScaled(ctx, canvas, 16, camera, 2);

      // Should render fog blocks for unexplored tiles
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    test("respects custom fogScale parameter", () => {
      const fog = new FogMap(width, height, colors);
      const camera = new Signal.State({ x: 0, y: 0 });

      fog.renderScaled(ctx, canvas, 16, camera, 4);

      expect(ctx.fillStyle).toBe(colors["--sg-tile-fog-color"]);
    });

    test("handles camera offset correctly with fogScale", () => {
      const fog = new FogMap(width, height, colors);
      const camera = new Signal.State({ x: 50, y: 50 });

      fog.renderScaled(ctx, canvas, 16, camera, 2);

      // Should render correctly with offset
      expect(ctx.fillStyle).toBe(colors["--sg-tile-fog-color"]);
    });

    test("handles out-of-bounds world coordinates", () => {
      const fog = new FogMap(100, 100, colors);
      const camera = new Signal.State({ x: 0, y: 0 });

      fog.renderScaled(ctx, canvas, 16, camera, 2);

      // Should handle gracefully
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    test("handles single tile map", () => {
      const fog = new FogMap(1, 1, colors);

      fog.setExplored(0, 0);

      expect(fog.isExplored(0, 0)).toBe(true);
    });

    test("handles very large map", () => {
      const fog = new FogMap(1000, 1000, colors);

      fog.setExplored(500, 500);

      expect(fog.isExplored(500, 500)).toBe(true);
    });

    test("handles rectangular map (wider than tall)", () => {
      const fog = new FogMap(200, 50, colors);

      fog.setExplored(100, 25);

      expect(fog.isExplored(100, 25)).toBe(true);
    });

    test("handles rectangular map (taller than wide)", () => {
      const fog = new FogMap(50, 200, colors);

      fog.setExplored(25, 100);

      expect(fog.isExplored(25, 100)).toBe(true);
    });

    test("round-trips through object conversion", () => {
      const fog1 = new FogMap(width, height, colors);
      fog1.setExplored(5, 5);
      fog1.setExplored(10, 10);

      const obj = fog1.toObject();

      const fog2 = FogMap.fromObject(obj, width, height, colors);
      expect(fog2.isExplored(5, 5)).toBe(true);
      expect(fog2.isExplored(10, 10)).toBe(true);
      expect(fog2.isExplored(6, 6)).toBe(false);
    });
  });

  describe("data persistence", () => {
    test("data persists after setting and getting multiple times", () => {
      const fog = new FogMap(width, height, colors);

      fog.setExplored(1, 1);
      fog.setExplored(2, 2);
      fog.setExplored(3, 3);

      expect(fog.isExplored(1, 1)).toBe(true);
      expect(fog.isExplored(2, 2)).toBe(true);
      expect(fog.isExplored(3, 3)).toBe(true);

      fog.reset();

      expect(fog.isExplored(1, 1)).toBe(false);
      expect(fog.isExplored(2, 2)).toBe(false);
      expect(fog.isExplored(3, 3)).toBe(false);
    });

    test("different coordinates do not interfere with each other", () => {
      const fog = new FogMap(width, height, colors);

      fog.setExplored(10, 20);
      fog.setExplored(20, 10);

      expect(fog.isExplored(10, 20)).toBe(true);
      expect(fog.isExplored(20, 10)).toBe(true);
      expect(fog.isExplored(10, 10)).toBe(false);
      expect(fog.isExplored(20, 20)).toBe(false);
    });
  });
});
