describe("Share Target", () => {
  test("should export storeSharedSave function", async () => {
    const { storeSharedSave } = await import("./shareTarget.mjs");

    expect(typeof storeSharedSave).toBe("function");
  });

  test("should export retrieveSharedSave function", async () => {
    const { retrieveSharedSave } = await import("./shareTarget.mjs");

    expect(typeof retrieveSharedSave).toBe("function");
  });

  test("should export deleteSharedSave function", async () => {
    const { deleteSharedSave } = await import("./shareTarget.mjs");

    expect(typeof deleteSharedSave).toBe("function");
  });

  test("should have all expected exports", async () => {
    const shareTarget = await import("./shareTarget.mjs");

    expect(shareTarget).toHaveProperty("storeSharedSave");
    expect(shareTarget).toHaveProperty("retrieveSharedSave");
    expect(shareTarget).toHaveProperty("deleteSharedSave");
  });
});
