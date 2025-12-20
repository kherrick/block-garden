/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

// Mock side effects before imports
jest.unstable_mockModule("./src/init/game.mjs", () => ({
  initGame: jest.fn(() => Promise.resolve()),
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
