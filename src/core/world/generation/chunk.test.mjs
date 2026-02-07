// Import the module to test constants
const chunkModule = await import("./chunk.mjs");

describe("Chunk Generation Constants", () => {
  test("should export MIN_Y constant", () => {
    expect(chunkModule.MIN_Y).toBe(0);
  });

  test("should export MAX_Y constant", () => {
    expect(chunkModule.MAX_Y).toBe(128);
  });

  test("should export SEA_LEVEL constant", () => {
    expect(chunkModule.SEA_LEVEL).toBe(32);
  });

  test("should export CLOUD_HEIGHT_MIN constant", () => {
    expect(chunkModule.CLOUD_HEIGHT_MIN).toBe(100);
  });

  test("should export CLOUD_HEIGHT_MAX constant", () => {
    expect(chunkModule.CLOUD_HEIGHT_MAX).toBe(120);
  });

  test("should have valid height range", () => {
    expect(chunkModule.MIN_Y).toBeLessThan(chunkModule.MAX_Y);
    expect(chunkModule.SEA_LEVEL).toBeGreaterThan(chunkModule.MIN_Y);
    expect(chunkModule.CLOUD_HEIGHT_MIN).toBeGreaterThan(chunkModule.SEA_LEVEL);
    expect(chunkModule.CLOUD_HEIGHT_MAX).toBeGreaterThan(
      chunkModule.CLOUD_HEIGHT_MIN,
    );
  });
});

describe("Chunk Generation Functions", () => {
  test("should export generateChunk function", () => {
    expect(typeof chunkModule.generateChunk).toBe("function");
  });

  test("should export getSurfaceHeight function", () => {
    expect(typeof chunkModule.getSurfaceHeight).toBe("function");
  });
});
