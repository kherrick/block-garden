/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

import { getCustomProperties } from "./getCustomProperties.mjs";
import { colors } from "../../state/config/colors.mjs";

describe("getCustomProperties", () => {
  let mockHost;
  let mockShadow;
  let mockComputedStyle;
  let mockWindow;

  beforeEach(() => {
    mockHost = document.createElement("div");
    mockShadow = {
      host: mockHost,
    };

    mockComputedStyle = {
      getPropertyValue: jest.fn(),
    };

    mockWindow = {
      getComputedStyle: jest.fn(() => mockComputedStyle),
    };
  });

  describe("basic functionality", () => {
    test("calls getComputedStyle with shadow host", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      getCustomProperties(mockWindow, mockShadow);

      expect(mockWindow.getComputedStyle).toHaveBeenCalledWith(mockShadow.host);
    });

    test("returns an object", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(typeof result).toBe("object");
      expect(result !== null).toBe(true);
    });

    test("returns a combined map with all color categories", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should have properties from all three categories
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe("color category handling", () => {
    test("retrieves color category properties", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop === "--bg-color-amber-500") {
          return "#f39c12";
        }

        if (prop === "--bg-color-black") {
          return "#000000";
        }

        return "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should have called getPropertyValue for color properties
      expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
        "--bg-color-amber-500",
      );
    });

    test("includes all color keys from colors.color", () => {
      const colorKeys = Object.keys(colors.color);
      mockComputedStyle.getPropertyValue.mockImplementation(() => {
        // Return a dummy value for all properties
        return "#FF0000";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      // Verify getPropertyValue was called for each color key
      colorKeys.forEach((key) => {
        expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
          `--bg-color-${key}`,
        );
      });
    });
  });

  describe("block category handling", () => {
    test("retrieves block category properties", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop === "--bg-block-grass-color") {
          return "#228B22";
        }

        return "";
      });

      getCustomProperties(mockWindow, mockShadow);

      // Should have called getPropertyValue for block properties (with -color suffix added)
      expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
        "--bg-block-grass-color",
      );
    });

    test("includes all block keys from colors.block", () => {
      const blockKeys = Object.keys(colors.block);
      mockComputedStyle.getPropertyValue.mockImplementation(() => {
        return "#228B22";
      });

      getCustomProperties(mockWindow, mockShadow);

      // Verify getPropertyValue was called for each block key (with -color suffix added)
      blockKeys.forEach((key) => {
        expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
          `--bg-block-${key}-color`,
        );
      });
    });
  });

  describe("ui category handling", () => {
    test("retrieves ui category properties", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop === "--bg-ui-touch-btn-background-color") {
          return "var(--bg-color-black-alpha-60)";
        }

        return "";
      });

      getCustomProperties(mockWindow, mockShadow);

      // Should have called getPropertyValue for ui properties (with -color suffix added)
      expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
        "--bg-ui-touch-btn-background-color",
      );
    });

    test("includes all ui keys from colors.ui", () => {
      const uiKeys = Object.keys(colors.ui);
      mockComputedStyle.getPropertyValue.mockImplementation(() => {
        return "white";
      });

      getCustomProperties(mockWindow, mockShadow);

      // Verify getPropertyValue was called for each ui key (with -color suffix added)
      uiKeys.forEach((key) => {
        expect(mockComputedStyle.getPropertyValue).toHaveBeenCalledWith(
          `--bg-ui-${key}-color`,
        );
      });
    });
  });

  describe("property value retrieval", () => {
    test("correctly maps color property names to values", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--bg-color-amber-500": "#f39c12",
          "--bg-color-black": "#000000",
          "--bg-color-white": "#ffffff",
        };

        return values[prop] || "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result["--bg-color-amber-500"]).toBe("#f39c12");
      expect(result["--bg-color-black"]).toBe("#000000");
      expect(result["--bg-color-white"]).toBe("#ffffff");
    });

    test("correctly maps block property names to values", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--bg-block-grass-color": "var(--bg-color-forest-green)",
          "--bg-block-water-color": "var(--bg-color-blue-500)",
        };

        return values[prop] || "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result["--bg-block-grass-color"]).toBe(
        "var(--bg-color-forest-green)",
      );
      expect(result["--bg-block-water-color"]).toBe("var(--bg-color-blue-500)");
    });

    test("correctly maps ui property names to values", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--bg-ui-touch-btn-color": "var(--bg-color-white)",
          "--bg-ui-touch-btn-background-color":
            "var(--bg-color-black-alpha-60)",
        };

        return values[prop] || "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result["--bg-ui-touch-btn-color"]).toBe("var(--bg-color-white)");
      expect(result["--bg-ui-touch-btn-background-color"]).toBe(
        "var(--bg-color-black-alpha-60)",
      );
    });
  });

  describe("combined result", () => {
    test("merges all three color categories into single object", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop.includes("--bg-color-")) {
          return "#FF0000";
        }

        if (prop.includes("--bg-block-")) {
          return "#00FF00";
        }

        if (prop.includes("--bg-ui-")) {
          return "#0000FF";
        }

        return "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      // Result should contain properties from all categories
      const hasColorProps = Object.keys(result).some((key) =>
        key.startsWith("--bg-color-"),
      );
      const hasBlockProps = Object.keys(result).some((key) =>
        key.startsWith("--bg-block-"),
      );
      const hasUiProps = Object.keys(result).some((key) =>
        key.startsWith("--bg-ui-"),
      );

      expect(hasColorProps).toBe(true);
      expect(hasBlockProps).toBe(true);
      expect(hasUiProps).toBe(true);
    });

    test("result object contains expected number of properties", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      const totalKeys =
        Object.keys(colors.color).length +
        Object.keys(colors.block).length +
        Object.keys(colors.ui).length;

      expect(Object.keys(result).length).toBe(totalKeys);
    });

    test("all properties in result are retrievable", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      Object.keys(result).forEach((key) => {
        expect(result[key]).toBeDefined();
        expect(typeof result[key]).toBe("string");
      });
    });
  });

  describe("edge cases", () => {
    test("handles empty property values", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("");

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should not throw and return object
      expect(typeof result).toBe("object");
      expect(result !== null).toBe(true);
    });

    test("handles whitespace in property values", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("  #FF0000  ");

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should preserve whitespace
      const firstColorValue = Object.values(result)[0];
      expect(firstColorValue).toBe("  #FF0000  ");
    });

    test("handles various CSS value formats", () => {
      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        if (prop.includes("color")) {
          return "#FF0000";
        }

        if (prop.includes("block")) return "rgb(255, 0, 0)";
        if (prop.includes("ui")) return "var(--some-variable)";
        return "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      // Should handle all formats
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe("function properties", () => {
    test("function is defined and callable", () => {
      expect(typeof getCustomProperties).toBe("function");
    });

    test("function accepts two parameters", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      // Should not throw
      expect(() => getCustomProperties(mockWindow, mockShadow)).not.toThrow();
    });

    test("function returns CombinedColorMap object", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      expect(!Array.isArray(result)).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    test("retrieves all color properties and returns combined map", () => {
      const colorMap = {
        "--bg-color-amber-500": "#f39c12",
        "--bg-color-black": "#000000",
      };
      const blockMap = {
        "--bg-block-grass-color": "#228B22",
        "--bg-block-water-color": "#0047AB",
      };
      const uiMap = {
        "--bg-ui-touch-btn-color": "white",
      };

      mockComputedStyle.getPropertyValue.mockImplementation((prop) => {
        return colorMap[prop] || blockMap[prop] || uiMap[prop] || "";
      });

      const result = getCustomProperties(mockWindow, mockShadow);

      expect(result["--bg-color-amber-500"]).toBe("#f39c12");
      expect(result["--bg-block-grass-color"]).toBe("#228B22");
      expect(result["--bg-ui-touch-btn-color"]).toBe("white");
    });

    test("handles real getComputedStyle from window object", () => {
      const realWindow = {
        getComputedStyle: (element) => {
          return {
            getPropertyValue: jest.fn((prop) => {
              if (prop === "--bg-color-amber-500") return "#f39c12";
              return "";
            }),
          };
        },
      };

      const result = getCustomProperties(realWindow, mockShadow);

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    test("processes full color configuration", () => {
      const getPropertyValueSpy = jest.fn((prop) => {
        // Return consistent values based on property category
        if (prop.startsWith("--bg-color-")) {
          return "#FF0000";
        }

        if (prop.startsWith("--bg-block-")) {
          return "#00FF00";
        }

        if (prop.startsWith("--bg-ui-")) {
          return "#0000FF";
        }

        return "";
      });

      mockComputedStyle.getPropertyValue = getPropertyValueSpy;

      const result = getCustomProperties(mockWindow, mockShadow);

      // Verify all categories are represented
      const callsByCategory = {
        color: getPropertyValueSpy.mock.calls.filter((call) =>
          call[0].startsWith("--bg-color-"),
        ).length,
        block: getPropertyValueSpy.mock.calls.filter((call) =>
          call[0].startsWith("--bg-block-"),
        ).length,
        ui: getPropertyValueSpy.mock.calls.filter((call) =>
          call[0].startsWith("--bg-ui-"),
        ).length,
      };

      expect(callsByCategory.color).toBeGreaterThan(0);
      expect(callsByCategory.block).toBeGreaterThan(0);
      expect(callsByCategory.ui).toBeGreaterThan(0);
    });
  });

  describe("shadow DOM interaction", () => {
    test("accesses shadow root host element", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      getCustomProperties(mockWindow, mockShadow);

      expect(mockWindow.getComputedStyle).toHaveBeenCalledWith(mockShadow.host);
    });

    test("works with different shadow root hosts", () => {
      mockComputedStyle.getPropertyValue.mockReturnValue("#FF0000");

      const host1 = document.createElement("div");
      const shadow1 = { host: host1 };

      const host2 = document.createElement("section");
      const shadow2 = { host: host2 };

      getCustomProperties(mockWindow, shadow1);
      getCustomProperties(mockWindow, shadow2);

      expect(mockWindow.getComputedStyle).toHaveBeenCalledWith(host1);
      expect(mockWindow.getComputedStyle).toHaveBeenCalledWith(host2);
    });
  });
});
