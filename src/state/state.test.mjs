/**
 * @jest-environment jsdom
 */
import {
  computedSignals,
  gameConfig,
  gameState,
  getConfig,
  getState,
  initState,
  setConfig,
  setState,
  updateConfig,
  updateState,
} from "./state.mjs";

describe("state module", () => {
  describe("gameState object", () => {
    test("exports gameState with all required signal properties", () => {
      expect(gameState).toHaveProperty("world");
      expect(gameState).toHaveProperty("exploredMap");
      expect(gameState).toHaveProperty("plantStructures");
      expect(gameState).toHaveProperty("gameTime");
      expect(gameState).toHaveProperty("growthTimers");
      expect(gameState).toHaveProperty("selectedMaterialType");
      expect(gameState).toHaveProperty("selectedSeedType");
      expect(gameState).toHaveProperty("shouldReset");
      expect(gameState).toHaveProperty("viewMode");
      expect(gameState).toHaveProperty("waterPhysicsQueue");
      expect(gameState).toHaveProperty("seedInventory");
      expect(gameState).toHaveProperty("materialsInventory");
      expect(gameState).toHaveProperty("player");
      expect(gameState).toHaveProperty("camera");
    });

    test("all gameState properties are Signals", () => {
      Object.values(gameState).forEach((signal) => {
        expect(typeof signal.get).toBe("function");
        expect(typeof signal.set).toBe("function");
      });
    });

    test("gameTime initializes to 0", () => {
      expect(gameState.gameTime.get()).toBe(0);
    });

    test("seedInventory initializes with all seeds at 0", () => {
      const inventory = gameState.seedInventory.get();

      Object.values(inventory).forEach((count) => {
        expect(count).toBe(0);
      });
    });

    test("materialsInventory initializes with all materials at 0", () => {
      const inventory = gameState.materialsInventory.get();

      Object.values(inventory).forEach((count) => {
        expect(count).toBe(0);
      });
    });

    test("player initializes with correct default position", () => {
      const player = gameState.player.get();

      expect(player.x).toBe(200);
      expect(player.y).toBe(50);
      expect(player.width).toBe(6);
      expect(player.height).toBe(8);
    });

    test("player initializes with correct physics properties", () => {
      const player = gameState.player.get();

      expect(player.speed).toBe(2.75);
      expect(player.jumpPower).toBe(12);
      expect(player.velocityX).toBe(0);
      expect(player.velocityY).toBe(0);
      expect(player.onGround).toBe(false);
    });

    test("player initializes with correct color", () => {
      const player = gameState.player.get();

      expect(player.color).toBe("#FF69B4");
    });

    test("camera initializes with correct position", () => {
      const camera = gameState.camera.get();

      expect(camera.x).toBe(0);
      expect(camera.y).toBe(0);
      expect(camera.speed).toBe(5);
    });

    test("viewMode initializes to 'normal'", () => {
      expect(gameState.viewMode.get()).toBe("normal");
    });

    test("shouldReset initializes to false", () => {
      expect(gameState.shouldReset.get()).toBe(false);
    });

    test("selectedMaterialType initializes to null", () => {
      expect(gameState.selectedMaterialType.get()).toBeNull();
    });

    test("selectedSeedType initializes to null", () => {
      expect(gameState.selectedSeedType.get()).toBeNull();
    });
  });

  describe("computedSignals object", () => {
    test("exports computedSignals with totalSeeds", () => {
      expect(computedSignals).toHaveProperty("totalSeeds");
    });

    test("totalSeeds computes sum of all seed inventory items", () => {
      gameState.seedInventory.set({
        CARROT: 3,
        CORN: 2,
        WHEAT: 5,
      });

      expect(computedSignals.totalSeeds.get()).toBe(10);
    });

    test("totalSeeds updates when seedInventory changes", async () => {
      gameState.seedInventory.set({
        WHEAT: 5,
      });

      expect(computedSignals.totalSeeds.get()).toBe(5);

      gameState.seedInventory.set({
        CARROT: 5,
        WHEAT: 5,
      });

      await Promise.resolve();

      expect(computedSignals.totalSeeds.get()).toBe(10);
    });

    test("totalSeeds returns 0 for empty inventory", () => {
      gameState.seedInventory.set({});

      expect(computedSignals.totalSeeds.get()).toBe(0);
    });
  });

  describe("updateState function", () => {
    test("updates a state signal using updater function", () => {
      gameState.gameTime.set(100);

      updateState("gameTime", (current) => current + 50);

      expect(gameState.gameTime.get()).toBe(150);
    });

    test("is safe no-op for non-existent keys", () => {
      expect(() => {
        updateState("nonExistentKey", (v) => v);
      }).not.toThrow();
    });

    test("is safe no-op for undefined values", () => {
      gameState.world.set(null);
      expect(() => {
        updateState("world", (v) => ({ ...v, test: true }));
      }).not.toThrow();
    });

    test("updates player position using updater", () => {
      const player = gameState.player.get();
      updateState("player", (p) => ({ ...p, x: p.x + 10 }));

      expect(gameState.player.get().x).toBe(player.x + 10);
    });

    test("updates nested object properties", () => {
      updateState("player", (p) => ({
        ...p,
        velocityX: 5,
        velocityY: -10,
      }));

      const player = gameState.player.get();

      expect(player.velocityX).toBe(5);
      expect(player.velocityY).toBe(-10);
    });

    test("updates inventory values", () => {
      updateState("seedInventory", (inv) => ({
        ...inv,
        WHEAT: 10,
      }));

      expect(gameState.seedInventory.get().WHEAT).toBe(10);
    });

    test("updater has access to current value", () => {
      gameState.gameTime.set(100);

      updateState("gameTime", (current) => {
        expect(current).toBe(100);

        return current * 2;
      });

      expect(gameState.gameTime.get()).toBe(200);
    });
  });

  describe("updateConfig function", () => {
    test("updates a config signal using updater function", () => {
      const currentVersion = gameConfig.version.get();

      updateConfig("version", (current) => "2.0.0");

      expect(gameConfig.version.get()).toBe("2.0.0");

      // Restore
      gameConfig.version.set(currentVersion);
    });

    test("is safe no-op for non-existent keys", () => {
      expect(() => {
        updateConfig("nonExistentKey", (v) => v);
      }).not.toThrow();
    });

    test("updates numeric config values", () => {
      const originalTileSize = gameConfig.TILE_SIZE.get();

      updateConfig("TILE_SIZE", (current) => current * 2);

      expect(gameConfig.TILE_SIZE.get()).toBe(originalTileSize * 2);

      // Restore
      gameConfig.TILE_SIZE.set(originalTileSize);
    });
  });

  describe("setConfig function", () => {
    test("sets a config signal value directly", () => {
      const originalValue = gameConfig.TILE_SIZE.get();

      setConfig("TILE_SIZE", 32);

      expect(gameConfig.TILE_SIZE.get()).toBe(32);

      // Restore
      setConfig("TILE_SIZE", originalValue);
    });

    test("returns the result of Signal.set", () => {
      const result = setConfig("TILE_SIZE", 16);

      expect(gameConfig.TILE_SIZE.get()).toBe(16);
    });

    test("is safe no-op for non-existent keys", () => {
      expect(() => {
        setConfig("nonExistentKey", "value");
      }).not.toThrow();
    });

    test("sets string config values", () => {
      const originalVersion = gameConfig.version.get();

      setConfig("version", "1.5.0");

      expect(gameConfig.version.get()).toBe("1.5.0");

      // Restore
      setConfig("version", originalVersion);
    });

    test("sets boolean config values", () => {
      const originalValue = gameConfig.isFogScaled.get();

      setConfig("isFogScaled", true);

      expect(gameConfig.isFogScaled.get()).toBe(true);

      // Restore
      setConfig("isFogScaled", originalValue);
    });
  });

  describe("getConfig function", () => {
    test("gets a config signal value", () => {
      const tileSize = getConfig("TILE_SIZE");

      expect(typeof tileSize).toBe("number");
    });

    test("returns undefined for non-existent keys", () => {
      expect(getConfig("nonExistentKey")).toBeUndefined();
    });

    test("returns correct value for all config keys", () => {
      expect(getConfig("TILE_SIZE")).toBe(gameConfig.TILE_SIZE.get());
      expect(getConfig("version")).toBe(gameConfig.version.get());
      expect(getConfig("GRAVITY")).toBe(gameConfig.GRAVITY.get());
    });
  });

  describe("setState function", () => {
    test("sets a state signal value directly", () => {
      setState("gameTime", 500);

      expect(gameState.gameTime.get()).toBe(500);
    });

    test("returns the result of Signal.set", () => {
      setState("gameTime", 100);

      expect(gameState.gameTime.get()).toBe(100);
    });

    test("is safe no-op for non-existent keys", () => {
      expect(() => {
        setState("nonExistentKey", "value");
      }).not.toThrow();
    });

    test("sets player state", () => {
      const newPlayer = { x: 300, y: 100, width: 6, height: 8 };

      setState("player", newPlayer);

      expect(gameState.player.get()).toEqual(newPlayer);
    });

    test("sets camera state", () => {
      const newCamera = { x: 50, y: 50, speed: 10 };

      setState("camera", newCamera);

      expect(gameState.camera.get()).toEqual(newCamera);
    });

    test("sets inventory state", () => {
      const inventory = { WHEAT: 10, CARROT: 5 };

      setState("seedInventory", inventory);

      expect(gameState.seedInventory.get()).toEqual(inventory);
    });

    test("sets boolean state values", () => {
      setState("shouldReset", true);

      expect(gameState.shouldReset.get()).toBe(true);

      setState("shouldReset", false);

      expect(gameState.shouldReset.get()).toBe(false);
    });

    test("sets string state values", () => {
      setState("viewMode", "xray");

      expect(gameState.viewMode.get()).toBe("xray");

      setState("viewMode", "normal");

      expect(gameState.viewMode.get()).toBe("normal");
    });
  });

  describe("getState function", () => {
    test("gets a state signal value", () => {
      const gameTime = getState("gameTime");

      expect(typeof gameTime).toBe("number");
    });

    test("returns undefined for non-existent keys", () => {
      expect(getState("nonExistentKey")).toBeUndefined();
    });

    test("returns correct value for all state keys", () => {
      expect(getState("gameTime")).toBe(gameState.gameTime.get());
      expect(getState("viewMode")).toBe(gameState.viewMode.get());
      expect(getState("selectedMaterialType")).toBe(
        gameState.selectedMaterialType.get(),
      );
    });

    test("returns current player state", () => {
      const player = getState("player");

      expect(player).toEqual(gameState.player.get());
    });

    test("returns current camera state", () => {
      const camera = getState("camera");

      expect(camera).toEqual(gameState.camera.get());
    });
  });

  describe("initState function", () => {
    test("sets version in gameConfig", async () => {
      const gThis = {};
      await initState(gThis, "1.0.0");

      expect(gameConfig.version.get()).toBe("1.0.0");
    });

    test("initializes world map", async () => {
      const gThis = {};
      await initState(gThis, "1.0.0");

      expect(gameState.world.get()).toBeDefined();
      expect(gameState.world.get()).not.toBeNull();
    });

    test("exposes state through globalThis.spriteGarden", async () => {
      const gThis = {};
      await initState(gThis, "1.0.0");

      expect(gThis.spriteGarden).toBeDefined();
      expect(gThis.spriteGarden.config).toBe(gameConfig);
      expect(gThis.spriteGarden.state).toBe(gameState);
    });

    test("exposes computedSignals through globalThis.spriteGarden", async () => {
      const gThis = {};
      await initState(gThis, "1.0.0");

      expect(gThis.spriteGarden.computed).toBe(computedSignals);
    });

    test("exposes helper methods through globalThis.spriteGarden", async () => {
      const gThis = {};
      await initState(gThis, "1.0.0");

      expect(typeof gThis.spriteGarden.setConfig).toBe("function");
      expect(typeof gThis.spriteGarden.getConfig).toBe("function");
      expect(typeof gThis.spriteGarden.updateConfig).toBe("function");
      expect(typeof gThis.spriteGarden.setState).toBe("function");
      expect(typeof gThis.spriteGarden.getState).toBe("function");
      expect(typeof gThis.spriteGarden.updateState).toBe("function");
    });

    test("merges with existing globalThis.spriteGarden properties", async () => {
      const gThis = {
        spriteGarden: {
          existingProperty: "value",
        },
      };

      await initState(gThis, "1.0.0");

      expect(gThis.spriteGarden.existingProperty).toBe("value");
      expect(gThis.spriteGarden.config).toBe(gameConfig);
    });

    test("returns object with gameConfig and gameState", async () => {
      const gThis = {};
      const result = await initState(gThis, "1.0.0");

      expect(result).toHaveProperty("gameConfig");
      expect(result).toHaveProperty("gameState");
      expect(result.gameConfig).toBe(gameConfig);
      expect(result.gameState).toBe(gameState);
    });

    test("creates WorldMap with correct dimensions", async () => {
      const gThis = {};
      await initState(gThis, "1.0.0");

      const world = gameState.world.get();

      expect(world.width).toBe(500);
      expect(world.height).toBe(300);
    });
  });

  describe("gameConfig export", () => {
    test("exports gameConfig object", () => {
      expect(gameConfig).toBeDefined();
      expect(typeof gameConfig).toBe("object");
    });

    test("gameConfig has version signal", () => {
      expect(gameConfig.version).toBeDefined();
      expect(typeof gameConfig.version.get).toBe("function");
    });

    test("gameConfig has TILE_SIZE signal", () => {
      expect(gameConfig.TILE_SIZE).toBeDefined();
      expect(typeof gameConfig.TILE_SIZE.get).toBe("function");
    });
  });

  describe("state reactivity", () => {
    test("signal changes are immediately reflected in get()", () => {
      setState("gameTime", 0);

      expect(getState("gameTime")).toBe(0);

      setState("gameTime", 100);

      expect(getState("gameTime")).toBe(100);
    });

    test("multiple updates accumulate correctly", () => {
      setState("gameTime", 0);

      updateState("gameTime", (t) => t + 10);
      updateState("gameTime", (t) => t + 20);
      updateState("gameTime", (t) => t + 30);

      expect(getState("gameTime")).toBe(60);
    });

    test("complex state objects can be updated", () => {
      const initialPlayer = { x: 0, y: 0, width: 6, height: 8 };

      setState("player", initialPlayer);

      updateState("player", (p) => ({ ...p, x: 100, y: 200 }));

      const player = getState("player");

      expect(player.x).toBe(100);
      expect(player.y).toBe(200);
      expect(player.width).toBe(6);
      expect(player.height).toBe(8);
    });
  });
});
