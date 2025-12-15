/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { Signal } from "signal-polyfill";

import { createSaveState } from "./createSave.mjs";

describe("createSaveState function", () => {
  let gThis;

  beforeEach(() => {
    // Create mock config signals
    const configSignals = {
      breakMode: new Signal.State(false),
      canvasScale: new Signal.State(1),
      currentResolution: new Signal.State("normal"),
      fogMode: new Signal.State("none"),
      fogScale: new Signal.State(1),
      FRICTION: new Signal.State(0.8),
      GRAVITY: new Signal.State(0.5),
      isFogScaled: new Signal.State(false),
      MAX_FALL_SPEED: new Signal.State(10),
      SURFACE_LEVEL: new Signal.State(32),
      TILE_SIZE: new Signal.State(16),
      version: new Signal.State("1.0.0"),
      WORLD_HEIGHT: new Signal.State(100),
      WORLD_WIDTH: new Signal.State(100),
      worldSeed: new Signal.State(12345),
    };

    // Create mock state signals with toObject and toArray methods
    const mockExploredMap = {
      toObject: jest.fn(() => ({ "50,50": true, "51,51": true })),
    };

    const mockWorld = {
      toArray: jest.fn(() => [0, 1, 1, 0, 1, 1, 0, 1, 1]),
    };

    const stateSignals = {
      camera: new Signal.State({ x: 50, y: 50 }),
      exploredMap: new Signal.State(mockExploredMap),
      gameTime: new Signal.State(1000),
      growthTimers: new Signal.State({ seed1: 100, seed2: 200 }),
      materialsInventory: new Signal.State({ dirt: 50, stone: 30 }),
      plantStructures: new Signal.State({ structure1: { x: 0, y: 0 } }),
      player: new Signal.State({ x: 100, y: 100, width: 8, height: 8 }),
      seedInventory: new Signal.State({ wheat: 10, carrot: 5 }),
      seeds: new Signal.State({ wheat: { name: "Wheat" } }),
      selectedMaterialType: new Signal.State("dirt"),
      selectedSeedType: new Signal.State("wheat"),
      viewMode: new Signal.State("normal"),
      world: new Signal.State(mockWorld),
    };

    // Mock spriteGarden object
    gThis = {
      spriteGarden: {
        config: configSignals,
        state: stateSignals,
      },
    };
  });

  test("creates save object with config and state properties", () => {
    const saveState = createSaveState(gThis);

    expect(saveState).toHaveProperty("config");
    expect(saveState).toHaveProperty("state");
    expect(typeof saveState.config).toBe("object");
    expect(typeof saveState.state).toBe("object");
  });

  test("extracts all config signal values", () => {
    const saveState = createSaveState(gThis);
    const { config } = saveState;

    expect(config.breakMode).toBe(false);
    expect(config.canvasScale).toBe(1);
    expect(config.currentResolution).toBe("normal");
    expect(config.fogMode).toBe("none");
    expect(config.fogScale).toBe(1);
    expect(config.FRICTION).toBe(0.8);
    expect(config.GRAVITY).toBe(0.5);
    expect(config.isFogScaled).toBe(false);
    expect(config.MAX_FALL_SPEED).toBe(10);
    expect(config.SURFACE_LEVEL).toBe(32);
    expect(config.TILE_SIZE).toBe(16);
    expect(config.version).toBe("1.0.0");
    expect(config.WORLD_HEIGHT).toBe(100);
    expect(config.WORLD_WIDTH).toBe(100);
    expect(config.worldSeed).toBe(12345);
  });

  test("extracts all state signal values", () => {
    const saveState = createSaveState(gThis);
    const { state } = saveState;

    expect(state.camera).toEqual({ x: 50, y: 50 });
    expect(state.gameTime).toBe(1000);
    expect(state.growthTimers).toEqual({ seed1: 100, seed2: 200 });
    expect(state.materialsInventory).toEqual({ dirt: 50, stone: 30 });
    expect(state.plantStructures).toEqual({ structure1: { x: 0, y: 0 } });
    expect(state.player).toEqual({
      x: 100,
      y: 100,
      width: 8,
      height: 8,
    });
    expect(state.seedInventory).toEqual({ wheat: 10, carrot: 5 });
    expect(state.selectedMaterialType).toBe("dirt");
    expect(state.selectedSeedType).toBe("wheat");
    expect(state.viewMode).toBe("normal");
  });

  test("calls toObject on exploredMap", () => {
    const saveState = createSaveState(gThis);
    const exploredMapSignal = gThis.spriteGarden.state.exploredMap.get();

    expect(exploredMapSignal.toObject).toHaveBeenCalled();
    expect(saveState.state.exploredMap).toEqual({
      "50,50": true,
      "51,51": true,
    });
  });

  test("calls toArray on world", () => {
    const saveState = createSaveState(gThis);
    const worldSignal = gThis.spriteGarden.state.world.get();

    expect(worldSignal.toArray).toHaveBeenCalled();
    expect(saveState.state.world).toEqual([0, 1, 1, 0, 1, 1, 0, 1, 1]);
  });

  test("preserves config changes when signals are updated", () => {
    // Update signals
    gThis.spriteGarden.config.breakMode.set(true);
    gThis.spriteGarden.config.FRICTION.set(0.9);
    gThis.spriteGarden.config.worldSeed.set(54321);

    const saveState = createSaveState(gThis);

    expect(saveState.config.breakMode).toBe(true);
    expect(saveState.config.FRICTION).toBe(0.9);
    expect(saveState.config.worldSeed).toBe(54321);
  });

  test("preserves state changes when signals are updated", () => {
    // Update signals
    gThis.spriteGarden.state.gameTime.set(5000);
    gThis.spriteGarden.state.player.set({
      x: 200,
      y: 200,
      width: 8,
      height: 8,
    });
    gThis.spriteGarden.state.selectedMaterialType.set("stone");

    const saveState = createSaveState(gThis);

    expect(saveState.state.gameTime).toBe(5000);
    expect(saveState.state.player).toEqual({
      x: 200,
      y: 200,
      width: 8,
      height: 8,
    });
    expect(saveState.state.selectedMaterialType).toBe("stone");
  });

  test("handles empty inventory objects", () => {
    gThis.spriteGarden.state.materialsInventory.set({});
    gThis.spriteGarden.state.seedInventory.set({});

    const saveState = createSaveState(gThis);

    expect(saveState.state.materialsInventory).toEqual({});
    expect(saveState.state.seedInventory).toEqual({});
  });

  test("handles large inventory values", () => {
    gThis.spriteGarden.state.materialsInventory.set({
      dirt: 999999,
      stone: 888888,
    });

    const saveState = createSaveState(gThis);

    expect(saveState.state.materialsInventory.dirt).toBe(999999);
    expect(saveState.state.materialsInventory.stone).toBe(888888);
  });

  test("handles zero values in inventories", () => {
    gThis.spriteGarden.state.seedInventory.set({ wheat: 0, carrot: 0 });

    const saveState = createSaveState(gThis);

    expect(saveState.state.seedInventory).toEqual({ wheat: 0, carrot: 0 });
  });

  test("handles negative growth timers gracefully", () => {
    gThis.spriteGarden.state.growthTimers.set({ seed1: -100, seed2: 0 });

    const saveState = createSaveState(gThis);

    expect(saveState.state.growthTimers).toEqual({ seed1: -100, seed2: 0 });
  });

  test("handles complex plant structures", () => {
    const complexStructure = {
      structure1: {
        x: 0,
        y: 0,
        type: "tree",
        health: 100,
        growth: 0.5,
      },
      structure2: {
        x: 10,
        y: 20,
        type: "bush",
        health: 50,
        growth: 0.3,
      },
    };

    gThis.spriteGarden.state.plantStructures.set(complexStructure);

    const saveState = createSaveState(gThis);

    expect(saveState.state.plantStructures).toEqual(complexStructure);
  });

  test("handles high canvasScale values", () => {
    gThis.spriteGarden.config.canvasScale.set(4);

    const saveState = createSaveState(gThis);

    expect(saveState.config.canvasScale).toBe(4);
  });

  test("handles different resolutions", () => {
    const resolutions = ["normal", "fullscreen", "windowed"];

    for (const res of resolutions) {
      gThis.spriteGarden.config.currentResolution.set(res);

      const saveState = createSaveState(gThis);

      expect(saveState.config.currentResolution).toBe(res);
    }
  });

  test("handles fog modes", () => {
    const fogModes = ["none", "fog", "explored"];

    for (const mode of fogModes) {
      gThis.spriteGarden.config.fogMode.set(mode);

      const saveState = createSaveState(gThis);

      expect(saveState.config.fogMode).toBe(mode);
    }
  });

  test("handles view modes", () => {
    const viewModes = ["normal", "xray"];

    for (const mode of viewModes) {
      gThis.spriteGarden.state.viewMode.set(mode);

      const saveState = createSaveState(gThis);

      expect(saveState.state.viewMode).toBe(mode);
    }
  });

  test("handles large world dimensions", () => {
    gThis.spriteGarden.config.WORLD_HEIGHT.set(500);
    gThis.spriteGarden.config.WORLD_WIDTH.set(500);

    const saveState = createSaveState(gThis);

    expect(saveState.config.WORLD_HEIGHT).toBe(500);
    expect(saveState.config.WORLD_WIDTH).toBe(500);
  });

  test("handles small world dimensions", () => {
    gThis.spriteGarden.config.WORLD_HEIGHT.set(10);
    gThis.spriteGarden.config.WORLD_WIDTH.set(10);

    const saveState = createSaveState(gThis);

    expect(saveState.config.WORLD_HEIGHT).toBe(10);
    expect(saveState.config.WORLD_WIDTH).toBe(10);
  });

  test("handles different TILE_SIZE values", () => {
    const tileSizes = [8, 16, 32, 64];

    for (const size of tileSizes) {
      gThis.spriteGarden.config.TILE_SIZE.set(size);

      const saveState = createSaveState(gThis);

      expect(saveState.config.TILE_SIZE).toBe(size);
    }
  });

  test("handles extreme gravity values", () => {
    gThis.spriteGarden.config.GRAVITY.set(100);

    const saveState = createSaveState(gThis);

    expect(saveState.config.GRAVITY).toBe(100);
  });

  test("handles version strings", () => {
    gThis.spriteGarden.config.version.set("2.5.3-beta");

    const saveState = createSaveState(gThis);

    expect(saveState.config.version).toBe("2.5.3-beta");
  });

  test("handles empty explored map", () => {
    const mockExploredMapEmpty = {
      toObject: jest.fn(() => ({})),
    };

    gThis.spriteGarden.state.exploredMap.set(mockExploredMapEmpty);

    const saveState = createSaveState(gThis);

    expect(saveState.state.exploredMap).toEqual({});
  });

  test("handles large explored map with many entries", () => {
    const largeMap = {};
    for (let i = 0; i < 1000; i++) {
      largeMap[`${i},${i}`] = true;
    }

    const mockExploredMapLarge = {
      toObject: jest.fn(() => largeMap),
    };

    gThis.spriteGarden.state.exploredMap.set(mockExploredMapLarge);

    const saveState = createSaveState(gThis);

    expect(Object.keys(saveState.state.exploredMap).length).toBe(1000);
  });

  test("handles empty world array", () => {
    const mockWorldEmpty = {
      toArray: jest.fn(() => []),
    };

    gThis.spriteGarden.state.world.set(mockWorldEmpty);

    const saveState = createSaveState(gThis);

    expect(saveState.state.world).toEqual([]);
  });

  test("handles large world array", () => {
    const largeWorldArray = new Array(10000).fill(0);

    const mockWorldLarge = {
      toArray: jest.fn(() => largeWorldArray),
    };

    gThis.spriteGarden.state.world.set(mockWorldLarge);

    const saveState = createSaveState(gThis);

    expect(saveState.state.world.length).toBe(10000);
  });

  test("preserves exact player position with floating point", () => {
    gThis.spriteGarden.state.player.set({
      x: 123.456,
      y: 789.012,
      width: 8,
      height: 8,
    });

    const saveState = createSaveState(gThis);

    expect(saveState.state.player.x).toBe(123.456);
    expect(saveState.state.player.y).toBe(789.012);
  });

  test("preserves exact camera position with floating point", () => {
    gThis.spriteGarden.state.camera.set({ x: 12.34, y: 56.78 });

    const saveState = createSaveState(gThis);

    expect(saveState.state.camera.x).toBe(12.34);
    expect(saveState.state.camera.y).toBe(56.78);
  });

  test("does not mutate original signal values", () => {
    const originalPlayer = gThis.spriteGarden.state.player.get();
    const originalCamera = gThis.spriteGarden.state.camera.get();

    createSaveState(gThis);

    expect(gThis.spriteGarden.state.player.get()).toBe(originalPlayer);
    expect(gThis.spriteGarden.state.camera.get()).toBe(originalCamera);
  });

  test("returns consistent results when called multiple times", () => {
    const saveState1 = createSaveState(gThis);
    const saveState2 = createSaveState(gThis);

    expect(saveState1.config).toEqual(saveState2.config);
    expect(saveState1.state.gameTime).toBe(saveState2.state.gameTime);
    expect(saveState1.state.player).toEqual(saveState2.state.player);
  });

  test("handles all numeric types in inventory", () => {
    gThis.spriteGarden.state.materialsInventory.set({
      whole: 100,
      decimal: 123.456,
      zero: 0,
      negative: -5,
      large: 999999999,
    });

    const saveState = createSaveState(gThis);
    const { materialsInventory } = saveState.state;

    expect(materialsInventory.whole).toBe(100);
    expect(materialsInventory.decimal).toBe(123.456);
    expect(materialsInventory.zero).toBe(0);
    expect(materialsInventory.negative).toBe(-5);
    expect(materialsInventory.large).toBe(999999999);
  });
});
