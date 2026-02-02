/**
 * @jest-environment node
 */
import { JSDOM } from "jsdom";

import { cssColorToRGB } from "./cssColorToRGB.mjs";

describe("cssColorToRGB", () => {
  let doc;

  beforeAll(() => {
    const dom = new JSDOM();
    doc = dom.window.document;

    // Mock canvas getContext for jsdom
    const originalCreateElement = doc.createElement.bind(doc);
    doc.createElement = (tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "canvas") {
        // Mock getContext to return an object that can parse colors
        element.getContext = (type) => {
          if (type === "2d") {
            return {
              fillStyle: "",
              set fillStyle(color) {
                // Simple color parser for testing
                if (color.startsWith("#")) {
                  // Hex color - normalize and return
                  let hex = color.substring(1);
                  if (hex.length === 3) {
                    hex = hex
                      .split("")
                      .map((c) => c + c)
                      .join("");
                  } else if (hex.length === 4) {
                    hex = hex
                      .split("")
                      .map((c) => c + c)
                      .join("");
                  }

                  if (hex.length === 6) {
                    this._fillStyle = `#${hex}`;
                  } else {
                    this._fillStyle = color;
                  }
                } else if (color.startsWith("rgb(")) {
                  this._fillStyle = color;
                } else if (color.startsWith("rgba(")) {
                  // Convert rgba to rgb
                  const match = color.match(
                    /rgba\(([0-9]+),\s*([0-9]+),\s*([0-9]+),/,
                  );

                  if (match) {
                    this._fillStyle = `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
                  } else {
                    this._fillStyle = color;
                  }
                } else {
                  // Named color - simple mapping for testing
                  const namedColors = {
                    red: "rgb(255, 0, 0)",
                    green: "rgb(0, 128, 0)",
                    blue: "rgb(0, 0, 255)",
                    white: "rgb(255, 255, 255)",
                    black: "rgb(0, 0, 0)",
                  };

                  this._fillStyle = namedColors[color.toLowerCase()] || color;
                }
              },
              get fillStyle() {
                return this._fillStyle;
              },
            };
          }

          return null;
        };
      }

      return element;
    };
  });

  test("should convert hex color to RGB", () => {
    expect(cssColorToRGB(doc, "#ff0000")).toEqual([255, 0, 0]);
  });

  test("should convert short hex color to RGB", () => {
    expect(cssColorToRGB(doc, "#f00")).toEqual([255, 0, 0]);
  });

  test("should convert rgb string to RGB", () => {
    expect(cssColorToRGB(doc, "rgb(255, 0, 0)")).toEqual([255, 0, 0]);
  });

  test("should convert rgba string to RGB", () => {
    expect(cssColorToRGB(doc, "rgba(255, 0, 0, 0.5)")).toEqual([255, 0, 0]);
  });

  test("should convert named color to RGB", () => {
    expect(cssColorToRGB(doc, "red")).toEqual([255, 0, 0]);
  });

  test("should handle lowercase hex", () => {
    expect(cssColorToRGB(doc, "#00ff00")).toEqual([0, 255, 0]);
  });

  test("should handle mixed case hex", () => {
    expect(cssColorToRGB(doc, "#FfFfFf")).toEqual([255, 255, 255]);
  });

  test("should handle white", () => {
    expect(cssColorToRGB(doc, "white")).toEqual([255, 255, 255]);
  });

  test("should handle black", () => {
    expect(cssColorToRGB(doc, "black")).toEqual([0, 0, 0]);
  });

  test("should handle blue", () => {
    expect(cssColorToRGB(doc, "blue")).toEqual([0, 0, 255]);
  });
});
