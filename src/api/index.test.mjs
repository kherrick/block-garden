describe("API Index", () => {
  test("should export sleep function", async () => {
    const { sleep } = await import("./index.mjs");

    expect(typeof sleep).toBe("function");
  });

  test("should export BlockGarden class", async () => {
    const { BlockGarden } = await import("./index.mjs");

    expect(typeof BlockGarden).toBe("function");
  });

  test("should have correct exports", async () => {
    const api = await import("./index.mjs");

    expect(api).toHaveProperty("sleep");
    expect(api).toHaveProperty("BlockGarden");
  });
});
