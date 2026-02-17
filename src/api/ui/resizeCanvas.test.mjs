/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

const { resizeCanvas } = await import("./resizeCanvas.mjs");

describe("resizeCanvas", () => {
  let shadow;
  let canvas;
  let mockCurrentResolution;

  beforeEach(() => {
    // Set up JSDOM environment
    globalThis.innerWidth = 1024;
    globalThis.innerHeight = 768;

    // Create shadow root and canvas
    shadow = {
      host: {
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
        },
      },
      getElementById: jest.fn(),
    };

    // Create a mock HTMLCanvasElement
    canvas = document.createElement("canvas");
    canvas.width = 0;
    canvas.height = 0;

    shadow.getElementById.mockReturnValue(canvas);

    mockCurrentResolution = {
      get: jest.fn(),
    };
  });

  test("should handle missing canvas gracefully", () => {
    shadow.getElementById.mockReturnValue(null);
    mockCurrentResolution.get.mockReturnValue("400");

    resizeCanvas(shadow, mockCurrentResolution);

    expect(shadow.host.classList.add).not.toHaveBeenCalled();
    expect(shadow.host.classList.remove).not.toHaveBeenCalled();
  });

  test("should set fullscreen resolution", () => {
    mockCurrentResolution.get.mockReturnValue("fullscreen");

    resizeCanvas(shadow, mockCurrentResolution);

    expect(shadow.getElementById).toHaveBeenCalledWith("canvas");
    expect(shadow.host.classList.remove).toHaveBeenCalledWith(
      "resolution",
      "resolution-400",
      "resolution-600",
      "resolution-800",
    );

    expect(shadow.host.classList.add).not.toHaveBeenCalled();
    expect(canvas.width).toBe(globalThis.innerWidth);
    expect(canvas.height).toBe(globalThis.innerHeight);
    expect(canvas.style.width).toBe("100dvw");
    expect(canvas.style.height).toBe("100dvh");
  });

  test("should set fixed resolution 400", () => {
    mockCurrentResolution.get.mockReturnValue("400");

    resizeCanvas(shadow, mockCurrentResolution);

    expect(shadow.host.classList.add).toHaveBeenCalledWith("resolution");
    expect(shadow.host.classList.remove).toHaveBeenCalledWith(
      "resolution-400",
      "resolution-600",
      "resolution-800",
    );

    expect(shadow.host.classList.add).toHaveBeenCalledWith("resolution-400");
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(400);
    expect(canvas.style.width).toBe("400px");
    expect(canvas.style.height).toBe("400px");
  });

  test("should set fixed resolution 600", () => {
    mockCurrentResolution.get.mockReturnValue("600");

    resizeCanvas(shadow, mockCurrentResolution);

    expect(shadow.host.classList.add).toHaveBeenCalledWith("resolution");
    expect(shadow.host.classList.add).toHaveBeenCalledWith("resolution-600");
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(600);
  });

  test("should set fixed resolution 800", () => {
    mockCurrentResolution.get.mockReturnValue("800");

    resizeCanvas(shadow, mockCurrentResolution);

    expect(shadow.host.classList.add).toHaveBeenCalledWith("resolution");
    expect(shadow.host.classList.add).toHaveBeenCalledWith("resolution-800");
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(800);
  });

  test("should handle invalid resolution gracefully", () => {
    mockCurrentResolution.get.mockReturnValue("invalid");

    resizeCanvas(shadow, mockCurrentResolution);

    // Should still add resolution class
    expect(shadow.host.classList.add).toHaveBeenCalledWith("resolution");
    // parseInt("invalid") returns NaN, which gets converted to 0 for canvas dimensions
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });
});
