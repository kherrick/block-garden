/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

// Mock side effects before imports
jest.unstable_mockModule("./src/core/systems/game/init.mjs", () => ({
  initGame: jest.fn(() => Promise.resolve()),
}));

// Mock collectDrop to avoid import chain to state.mjs → ChunkManager → Worker
jest.unstable_mockModule("./src/utils/collectDrop.mjs", () => ({
  collectDrop: jest.fn(() => ({ materials: [], seeds: [] })),
}));

// Mock state module functions to avoid ChunkManager → Worker
jest.unstable_mockModule("./src/core/systems/game/state.mjs", () => ({
  gameState: {
    curBlock: { get: () => 1 },
    materialsInventory: { get: () => ({}), set: () => {} },
    seedsInventory: { get: () => ({}), set: () => {} },
  },
  getMaterialCount: jest.fn(() => 0),
  getSeedCount: jest.fn(() => 0),
  removeMaterial: jest.fn(() => true),
  removeSeed: jest.fn(() => true),
  toInventoryKey: jest.fn((name) => name.toUpperCase().replace(/ /g, "_")),
  addMaterial: jest.fn(),
  addSeed: jest.fn(),
  selectMaterialBarSlot: jest.fn(),
  setMaterialBarItem: jest.fn(),
}));

jest.spyOn(console, "info").mockImplementation(() => {});

// Import after mocks
const { BlockGarden, tagName } = await import("./index.mjs");

describe("block-garden web component", () => {
  beforeAll(() => {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, BlockGarden);
    }
  });

  afterEach(() => {
    document.body.innerHTML = "";

    jest.clearAllMocks();
  });

  test("creates a canvas inside its shadow DOM", async () => {
    const el = document.createElement(tagName);
    document.body.appendChild(el);

    // Let connectedCallback settle
    await Promise.resolve();

    const shadow = el.shadowRoot;
    expect(shadow).not.toBeNull();

    const canvas = shadow.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas.tagName.toLowerCase()).toBe("canvas");
  });
});
