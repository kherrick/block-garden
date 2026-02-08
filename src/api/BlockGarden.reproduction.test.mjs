import { BlockGarden } from "./BlockGarden.mjs";

describe("BlockGarden API - normalizeBlockName", () => {
  let api;

  beforeEach(() => {
    // Basic mock to allow instantiation
    globalThis.blockGarden = {
      config: { blocks: [] },
      state: { world: {} },
    };
    api = new BlockGarden();
  });

  test("normalizeBlockName should handle null or non-string inputs", () => {
    expect(api.normalizeBlockName(null)).toBeNull();
    expect(api.normalizeBlockName(undefined)).toBeNull();
    expect(api.normalizeBlockName(123)).toBeNull();
    expect(api.normalizeBlockName("grass")).toBe("GRASS");
    expect(api.normalizeBlockName("dirt-block")).toBe("DIRT_BLOCK");
  });
});
