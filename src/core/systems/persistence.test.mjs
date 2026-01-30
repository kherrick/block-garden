/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// Mock localForage module
jest.unstable_mockModule("localforage", () => ({
  default: {
    setItem: jest.fn((key, value) => Promise.resolve(value)),
    getItem: jest.fn((key) => Promise.resolve(null)),
  },
}));

// Mock resizeCanvas
jest.unstable_mockModule("../../api/ui/resizeCanvas.mjs", () => ({
  resizeCanvas: jest.fn(),
}));

// Suppress console.error for expected localForage errors in test environment
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock resizeCanvas
jest.unstable_mockModule("../../api/ui/resizeCanvas.mjs", () => ({
  resizeCanvas: jest.fn(),
}));

const {
  generatePersistenceKey,
  persistValue,
  getPersistedValue,
  getPersistedValues,
  restorePersistedPreferences,
} = await import("./persistence.mjs");

// Get the mocked localForage after import
const localForage = (await import("localforage")).default;

describe("generatePersistenceKey", () => {
  test("should convert camelCase to kebab-case", () => {
    const key = generatePersistenceKey("state", "fastGrowth");

    expect(key).toBe("block-garden-state-fast-growth");
  });

  test("should handle multiple camelCase words", () => {
    const key = generatePersistenceKey("config", "useSplitControls");

    expect(key).toBe("block-garden-config-use-split-controls");
  });

  test("should handle single word", () => {
    const key = generatePersistenceKey("state", "seed");

    expect(key).toBe("block-garden-state-seed");
  });
});

describe("persistValue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should call localForage.setItem with correct key", async () => {
    const result = await persistValue("state", "fastGrowth", true);

    expect(localForage.setItem).toHaveBeenCalledWith(
      "block-garden-state-fast-growth",
      true,
    );

    expect(result).toBe(true);
  });

  test("should handle errors gracefully", async () => {
    localForage.setItem.mockImplementationOnce(() => {
      throw new Error("Storage error");
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await persistValue("state", "fastGrowth", true);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to persist block-garden-state-fast-growth:",
      expect.any(Error),
    );

    expect(result).toBe(true);

    consoleSpy.mockRestore();
  });
});

describe("getPersistedValue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return stored value when found", async () => {
    localForage.getItem.mockResolvedValueOnce(true);

    const result = await getPersistedValue("state", "fastGrowth", false);

    expect(result).toBe(true);
  });

  test("should return default value when not found", async () => {
    localForage.getItem.mockResolvedValueOnce(null);

    const result = await getPersistedValue("state", "fastGrowth", false);

    expect(result).toBe(false);
  });

  test("should handle errors gracefully", async () => {
    localForage.getItem.mockImplementationOnce(() => {
      throw new Error("Storage error");
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await getPersistedValue("state", "fastGrowth", false);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to retrieve block-garden-state-fast-growth:",
      expect.any(Error),
    );

    expect(result).toBe(false);

    consoleSpy.mockRestore();
  });
});

describe("getPersistedValues", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return object with found values", async () => {
    localForage.getItem.mockImplementation((key) => {
      if (key === "block-garden-state-fast-growth") {
        return Promise.resolve(true);
      }

      if (key === "block-garden-state-world-time") {
        return Promise.resolve(1000);
      }

      if (key === "block-garden-config-link-game-save") {
        return Promise.resolve(null);
      }

      return Promise.resolve(null);
    });

    const items = [
      { scope: "state", name: "fastGrowth", defaultValue: false },
      { scope: "state", name: "worldTime", defaultValue: 0 },
      { scope: "config", name: "linkGameSave", defaultValue: false },
    ];

    const result = await getPersistedValues(items);

    // linkGameSave returns null, so it should not be in the result
    // But getPersistedValue returns the default value (false) when value is null
    // So false is not null/undefined, so it gets added
    expect(result).toEqual({
      state_fastGrowth: true,
      state_worldTime: 1000,
      config_linkGameSave: false,
    });
  });

  test("should skip null and undefined values", async () => {
    localForage.getItem.mockImplementation((key) => {
      if (key === "block-garden-state-fast-growth") {
        return Promise.resolve(null);
      }

      if (key === "block-garden-state-world-time") {
        return Promise.resolve(undefined);
      }

      return Promise.resolve(null);
    });

    const items = [
      { scope: "state", name: "fastGrowth", defaultValue: false },
      { scope: "state", name: "worldTime", defaultValue: 0 },
    ];

    const result = await getPersistedValues(items);

    // When value is null, getPersistedValue returns defaultValue
    // Since false is not null/undefined, it gets added to the result
    expect(result).toEqual({ state_fastGrowth: false });
  });
});

describe("restorePersistedPreferences", () => {
  let mockGameState;
  let mockGameConfig;
  let mockShadow;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGameState = {
      worldTime: 0,
      fastGrowth: false,
    };

    mockGameConfig = {
      manualTimeOfDay: { set: jest.fn() },
      dayLength: { set: jest.fn() },
      linkGameSave: { set: jest.fn() },
      useSplitControls: { set: jest.fn() },
      useBlockHighlight: { set: jest.fn() },
      useDamageAnimation: { set: jest.fn() },
      useTextureAtlas: { set: jest.fn() },
      useAmbientOcclusion: { set: jest.fn() },
      useDynamicLighting: { set: jest.fn() },
      useTimeCycle: { set: jest.fn() },
      usePerFaceLighting: { set: jest.fn() },
      useAODebug: { set: jest.fn() },
      useAutoJump: { set: jest.fn() },
      currentResolution: { set: jest.fn() },
      useTouchControls: { set: jest.fn() },
    };

    mockShadow = {
      getElementById: jest.fn(),
    };

    // Reset all mocks
    localForage.getItem.mockResolvedValue(null);
  });

  test("should restore manualTimeOfDay", async () => {
    localForage.getItem.mockImplementation((key) => {
      if (key === "block-garden-config-manual-time-of-day") {
        return Promise.resolve(12);
      }

      return Promise.resolve(null);
    });

    await restorePersistedPreferences(
      mockGameState,
      mockGameConfig,
      mockShadow,
    );

    expect(mockGameConfig.manualTimeOfDay.set).toHaveBeenCalledWith(12);
  });

  test("should restore dayLength", async () => {
    localForage.getItem.mockImplementation((key) => {
      if (key === "block-garden-config-day-length") {
        return Promise.resolve(30);
      }

      return Promise.resolve(null);
    });

    await restorePersistedPreferences(
      mockGameState,
      mockGameConfig,
      mockShadow,
    );

    expect(mockGameConfig.dayLength.set).toHaveBeenCalledWith(30);
  });

  test("should restore worldTime", async () => {
    localForage.getItem.mockImplementation((key) => {
      if (key === "block-garden-state-world-time") {
        return Promise.resolve(5000);
      }

      return Promise.resolve(null);
    });

    await restorePersistedPreferences(
      mockGameState,
      mockGameConfig,
      mockShadow,
    );

    expect(mockGameState.worldTime).toBe(5000);
  });

  test("should restore fastGrowth and update UI", async () => {
    const mockButton = {
      textContent: "",
      style: { backgroundColor: "", color: "" },
    };

    mockShadow.getElementById.mockImplementation((id) => {
      if (id === "fastGrowthButton") {
        return mockButton;
      }

      return null;
    });

    localForage.getItem.mockImplementation((key) => {
      if (key === "block-garden-state-fast-growth") {
        return Promise.resolve(true);
      }

      return Promise.resolve(null);
    });

    await restorePersistedPreferences(
      mockGameState,
      mockGameConfig,
      mockShadow,
    );

    expect(mockGameState.fastGrowth).toBe(true);
    expect(mockButton.textContent).toBe("Disable Fast Growth");
    expect(mockButton.style.backgroundColor).toBe("var(--bg-color-red-500)");
    expect(mockButton.style.color).toBe("var(--bg-color-white)");
  });

  test("should restore currentResolution and call resizeCanvas", async () => {
    const { resizeCanvas } = await import("../../api/ui/resizeCanvas.mjs");

    mockShadow.getElementById.mockImplementation((id) => {
      if (id === "resolutionSelect") {
        return { value: "" };
      }

      return null;
    });

    localForage.getItem.mockImplementation((key) => {
      if (key === "block-garden-config-current-resolution") {
        return Promise.resolve("high");
      }

      return Promise.resolve(null);
    });

    await restorePersistedPreferences(
      mockGameState,
      mockGameConfig,
      mockShadow,
    );

    expect(mockGameConfig.currentResolution.set).toHaveBeenCalledWith("high");

    expect(resizeCanvas).toHaveBeenCalledWith(
      mockShadow,
      mockGameConfig.currentResolution,
    );
  });

  test("should restore all boolean config values", async () => {
    localForage.getItem.mockImplementation((key) => {
      const keyMap = {
        "block-garden-config-link-game-save": true,
        "block-garden-config-use-split-controls": false,
        "block-garden-config-use-block-highlight": true,
        "block-garden-config-use-damage-animation": false,
        "block-garden-config-use-texture-atlas": true,
        "block-garden-config-use-ambient-occlusion": false,
        "block-garden-config-use-dynamic-lighting": true,
        "block-garden-config-use-time-cycle": false,
        "block-garden-config-use-per-face-lighting": true,
        "block-garden-config-use-aodebug": false,
        "block-garden-config-use-auto-jump": true,
        "block-garden-config-use-touch-controls": false,
      };

      return Promise.resolve(keyMap[key] ?? null);
    });

    await restorePersistedPreferences(
      mockGameState,
      mockGameConfig,
      mockShadow,
    );

    expect(mockGameConfig.linkGameSave.set).toHaveBeenCalledWith(true);
    expect(mockGameConfig.useSplitControls.set).toHaveBeenCalledWith(false);
    expect(mockGameConfig.useBlockHighlight.set).toHaveBeenCalledWith(true);
    expect(mockGameConfig.useDamageAnimation.set).toHaveBeenCalledWith(false);
    expect(mockGameConfig.useTextureAtlas.set).toHaveBeenCalledWith(true);
    expect(mockGameConfig.useAmbientOcclusion.set).toHaveBeenCalledWith(false);
    expect(mockGameConfig.useDynamicLighting.set).toHaveBeenCalledWith(true);
    expect(mockGameConfig.useTimeCycle.set).toHaveBeenCalledWith(false);
    expect(mockGameConfig.usePerFaceLighting.set).toHaveBeenCalledWith(true);
    expect(mockGameConfig.useAODebug.set).toHaveBeenCalledWith(false);
    expect(mockGameConfig.useAutoJump.set).toHaveBeenCalledWith(true);
    expect(mockGameConfig.useTouchControls.set).toHaveBeenCalledWith(false);
  });

  test("should not restore null/undefined values", async () => {
    // All values return null
    await restorePersistedPreferences(
      mockGameState,
      mockGameConfig,
      mockShadow,
    );

    // None of the setters should be called
    Object.values(mockGameConfig).forEach((config) => {
      expect(config.set).not.toHaveBeenCalled();
    });
  });
});
