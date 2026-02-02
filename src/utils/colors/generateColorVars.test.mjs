const { generateColorVars } = await import("./generateColorVars.mjs");

describe("generateColorVars", () => {
  test("should generate CSS variables for block colors", () => {
    const colors = {
      air: "87ceeb",
      grass: "7cfc00",
    };

    const result = generateColorVars("--bg-block-", colors);

    expect(result).toContain("--bg-block-air-color: 87ceeb;");
    expect(result).toContain("--bg-block-grass-color: 7cfc00;");
  });

  test("should generate CSS variables for color palette", () => {
    const colors = {
      red: "ff0000",
      green: "00ff00",
      blue: "0000ff",
    };

    const result = generateColorVars("--bg-color-", colors);

    expect(result).toContain("--bg-color-red: ff0000;");
    expect(result).toContain("--bg-color-green: 00ff00;");
    expect(result).toContain("--bg-color-blue: 0000ff;");
  });

  test("should handle empty colors object", () => {
    const result = generateColorVars("--bg-block-", {});

    expect(result).toBe("");
  });

  test("should handle single color", () => {
    const result = generateColorVars("--bg-block-", { dirt: "a0522d" });

    expect(result).toBe("--bg-block-dirt-color: a0522d;");
  });

  test("should join multiple colors with newlines", () => {
    const colors = {
      stone: "808080",
      wood: "deb887",
    };

    const result = generateColorVars("--bg-block-", colors);

    expect(result).toBe(
      "--bg-block-stone-color: 808080;\n--bg-block-wood-color: deb887;",
    );
  });

  test("should handle different prefix", () => {
    const result = generateColorVars("--custom-", { test: "123456" });

    expect(result).toBe("--custom-test-color: 123456;");
  });

  test("should handle color names with special characters", () => {
    const colors = {
      "special-name": "ffffff",
      another_one: "000000",
    };

    const result = generateColorVars("--bg-block-", colors);

    expect(result).toContain("--bg-block-special-name-color: ffffff;");
    expect(result).toContain("--bg-block-another_one-color: 000000;");
  });
});
