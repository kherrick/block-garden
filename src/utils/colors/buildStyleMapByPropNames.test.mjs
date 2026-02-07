/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

import { buildStyleMapByPropNames } from "./buildStyleMapByPropNames.mjs";

describe("buildStyleMapByPropNames", () => {
  let mockStyle;

  beforeEach(() => {
    mockStyle = {
      getPropertyValue: jest.fn(),
    };
  });

  describe("basic functionality", () => {
    test("returns an object mapping property names to their CSS values", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--bg-color-grass": "#228B22",
          "--bg-color-water": "#0047AB",
        };

        return values[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--bg-color-grass",
        "--bg-color-water",
      ]);

      expect(result).toEqual({
        "--bg-color-grass": "#228B22",
        "--bg-color-water": "#0047AB",
      });
    });

    test("calls getPropertyValue for each property name", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      buildStyleMapByPropNames(mockStyle, [
        "--bg-color-red",
        "--bg-color-green",
      ]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledTimes(2);
      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("--bg-color-red");
      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith(
        "--bg-color-green",
      );
    });
  });

  describe("property name handling", () => {
    test("handles property names that already start with --bg-color-", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      buildStyleMapByPropNames(mockStyle, ["--bg-color-grass"]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith(
        "--bg-color-grass",
      );
    });

    test("appends -color suffix to property names that don't start with --bg-color-", () => {
      mockStyle.getPropertyValue.mockReturnValue("#00FF00");

      buildStyleMapByPropNames(mockStyle, ["grass"]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("grass-color");
    });

    test("handles mixed property name formats", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--bg-color-grass": "#228B22",
          "water-color": "#0047AB",
        };

        return values[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--bg-color-grass",
        "water",
      ]);

      expect(result).toEqual({
        "--bg-color-grass": "#228B22",
        "water-color": "#0047AB",
      });
    });
  });

  describe("empty and edge cases", () => {
    test("returns undefined when given an empty array", () => {
      const result = buildStyleMapByPropNames(mockStyle, []);

      expect(result).toBeUndefined();
      expect(mockStyle.getPropertyValue).not.toHaveBeenCalled();
    });

    test("handles single property in array", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, ["--bg-color-red"]);

      expect(result).toEqual({
        "--bg-color-red": "#FF0000",
      });
    });

    test("returns object with single property", () => {
      mockStyle.getPropertyValue.mockReturnValue("#ABC123");

      const result = buildStyleMapByPropNames(mockStyle, ["block"]);

      expect(result).toEqual({
        "block-color": "#ABC123",
      });

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("block-color");
    });
  });

  describe("property value handling", () => {
    test("preserves empty string values from getPropertyValue", () => {
      mockStyle.getPropertyValue.mockReturnValue("");

      const result = buildStyleMapByPropNames(mockStyle, ["--bg-color-none"]);

      expect(result).toEqual({
        "--bg-color-none": "",
      });
    });

    test("preserves whitespace in property values", () => {
      mockStyle.getPropertyValue.mockReturnValue(" #FF0000 ");

      const result = buildStyleMapByPropNames(mockStyle, ["--bg-color-red"]);

      expect(result).toEqual({
        "--bg-color-red": " #FF0000 ",
      });
    });

    test("handles various color formats", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--bg-color-hex": "#FF0000",
          "--bg-color-rgb": "rgb(255, 0, 0)",
          "--bg-color-hsl": "hsl(0, 100%, 50%)",
          "--bg-color-name": "red",
        };

        return values[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--bg-color-hex",
        "--bg-color-rgb",
        "--bg-color-hsl",
        "--bg-color-name",
      ]);

      expect(result).toEqual({
        "--bg-color-hex": "#FF0000",
        "--bg-color-rgb": "rgb(255, 0, 0)",
        "--bg-color-hsl": "hsl(0, 100%, 50%)",
        "--bg-color-name": "red",
      });
    });
  });

  describe("multiple properties", () => {
    test("correctly processes multiple properties", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const values = {
          "--bg-color-grass": "#228B22",
          "--bg-color-water": "#0047AB",
          "--bg-color-sand": "#C2B280",
          "--bg-color-stone": "#808080",
        };

        return values[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--bg-color-grass",
        "--bg-color-water",
        "--bg-color-sand",
        "--bg-color-stone",
      ]);

      expect(result).toEqual({
        "--bg-color-grass": "#228B22",
        "--bg-color-water": "#0047AB",
        "--bg-color-sand": "#C2B280",
        "--bg-color-stone": "#808080",
      });

      expect(mockStyle.getPropertyValue).toHaveBeenCalledTimes(4);
    });

    test("maintains order of properties in result object", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, [
        "--bg-color-first",
        "--bg-color-second",
        "--bg-color-third",
      ]);

      const keys = Object.keys(result);

      expect(keys).toEqual([
        "--bg-color-first",
        "--bg-color-second",
        "--bg-color-third",
      ]);
    });
  });

  describe("property name edge cases", () => {
    test("handles property names with multiple dashes", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      buildStyleMapByPropNames(mockStyle, ["--multi-part-name"]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith(
        "--multi-part-name-color",
      );
    });

    test("handles property names with numbers", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, [
        "color123",
        "block2",
      ]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("color123-color");
      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith("block2-color");
      expect(Object.keys(result)).toContain("color123-color");
      expect(Object.keys(result)).toContain("block2-color");
    });

    test("handles very long property names", () => {
      const longName =
        "--bg-color-this-is-a-very-long-property-name-for-testing";

      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, [longName]);

      expect(mockStyle.getPropertyValue).toHaveBeenCalledWith(longName);
      expect(result[longName]).toBe("#FF0000");
    });
  });

  describe("function exports and type handling", () => {
    test("function is defined and callable", () => {
      expect(typeof buildStyleMapByPropNames).toBe("function");
    });

    test("returns an object when properties are provided", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, ["--bg-color-red"]);

      expect(typeof result).toBe("object");
      expect(result !== null).toBe(true);
    });

    test("returned object contains only specified properties", () => {
      mockStyle.getPropertyValue.mockReturnValue("#FF0000");

      const result = buildStyleMapByPropNames(mockStyle, [
        "--bg-color-red",
        "--bg-color-green",
      ]);

      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe("CSS variable resolution", () => {
    test("correctly retrieves CSS variable values from CSSStyleDeclaration", () => {
      const mockDeclaration = {
        getPropertyValue(prop) {
          const vars = {
            "--bg-color-primary": "rgb(255, 0, 0)",
            "--bg-color-secondary": "rgb(0, 255, 0)",
          };

          return vars[prop] || "";
        },
      };

      const result = buildStyleMapByPropNames(mockDeclaration, [
        "--bg-color-primary",
        "--bg-color-secondary",
      ]);

      expect(result["--bg-color-primary"]).toBe("rgb(255, 0, 0)");
      expect(result["--bg-color-secondary"]).toBe("rgb(0, 255, 0)");
    });

    test("uses getPropertyValue for CSS custom property lookup", () => {
      const getPropertyValueSpy = jest.fn().mockReturnValue("#FF0000");
      const mockDeclaration = {
        getPropertyValue: getPropertyValueSpy,
      };

      buildStyleMapByPropNames(mockDeclaration, ["--bg-color-red"]);

      expect(getPropertyValueSpy).toHaveBeenCalledWith("--bg-color-red");
    });
  });

  describe("integration scenarios", () => {
    test("handles real-world block color mapping scenario", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const blockColors = {
          "--bg-color-grass": "#228B22",
          "--bg-color-water": "#0047AB",
          "--bg-color-sand": "#C2B280",
          "--bg-color-stone": "#808080",
          "--bg-color-tree": "#8B4513",
          "--bg-color-lava": "#FF4500",
        };

        return blockColors[prop] || "";
      });

      const blockNames = [
        "--bg-color-grass",
        "--bg-color-water",
        "--bg-color-sand",
        "--bg-color-stone",
        "--bg-color-tree",
        "--bg-color-lava",
      ];

      const result = buildStyleMapByPropNames(mockStyle, blockNames);

      expect(Object.keys(result)).toHaveLength(6);
      expect(result["--bg-color-grass"]).toBe("#228B22");
      expect(result["--bg-color-lava"]).toBe("#FF4500");
    });

    test("handles partial CSS property names with suffix transformation", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const colors = {
          "grass-color": "#228B22",
          "water-color": "#0047AB",
        };

        return colors[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, ["grass", "water"]);

      expect(result["grass-color"]).toBe("#228B22");
      expect(result["water-color"]).toBe("#0047AB");
    });

    test("handles mixed block and color property names", () => {
      mockStyle.getPropertyValue.mockImplementation((prop) => {
        const colors = {
          "--bg-color-primary": "#FF0000",
          "secondary-color": "#00FF00",
          "--bg-color-tertiary": "#0000FF",
        };

        return colors[prop] || "";
      });

      const result = buildStyleMapByPropNames(mockStyle, [
        "--bg-color-primary",
        "secondary",
        "--bg-color-tertiary",
      ]);

      expect(result["--bg-color-primary"]).toBe("#FF0000");
      expect(result["secondary-color"]).toBe("#00FF00");
      expect(result["--bg-color-tertiary"]).toBe("#0000FF");
    });
  });
});
