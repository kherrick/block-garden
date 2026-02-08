/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

jest.unstable_mockModule("./ray.mjs", () => ({
  ray: jest.fn().mockReturnValue({
    x: 10,
    y: 20,
    z: 30,
    face: { x: 1, y: 0, z: 0 },
  }),
}));

describe("raycastFromCanvasCoords", () => {
  let raycastFromCanvasCoords;

  beforeEach(async () => {
    const module = await import("./raycastFromCanvasCoords.mjs");
    raycastFromCanvasCoords = module.raycastFromCanvasCoords;
  });

  test("should convert canvas coordinates to raycast result", () => {
    const mockCanvas = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      }),
    };

    const result = raycastFromCanvasCoords(
      mockCanvas,
      400,
      300,
      {},
      { x: 0, y: 0, z: 0 },
      { yaw: 0, pitch: 0 },
    );

    expect(result.hit).toBeDefined();
    expect(result.yaw).toBeDefined();
    expect(result.pitch).toBeDefined();
    expect(mockCanvas.getBoundingClientRect).toHaveBeenCalled();
  });

  test("should handle different canvas positions", () => {
    const mockCanvas = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 100,
        top: 50,
        width: 800,
        height: 600,
      }),
    };

    const result = raycastFromCanvasCoords(
      mockCanvas,
      500,
      350,
      {},
      { x: 0, y: 0, z: 0 },
      { yaw: 0, pitch: 0 },
    );

    expect(result.hit).toBeDefined();
  });

  test("should handle different camera rotations", () => {
    const mockCanvas = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      }),
    };

    const result = raycastFromCanvasCoords(
      mockCanvas,
      400,
      300,
      {},
      { x: 0, y: 0, z: 0 },
      { yaw: Math.PI / 4, pitch: Math.PI / 6 },
    );

    expect(result.hit).toBeDefined();
    expect(result.yaw).not.toBe(0);
    expect(result.pitch).not.toBe(0);
  });

  test("should handle different FOV", () => {
    const mockCanvas = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      }),
    };

    const result = raycastFromCanvasCoords(
      mockCanvas,
      400,
      300,
      {},
      { x: 0, y: 0, z: 0 },
      { yaw: 0, pitch: 0 },
      Math.PI / 2,
    );

    expect(result.hit).toBeDefined();
  });

  test("should handle edge coordinates", () => {
    const mockCanvas = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      }),
    };

    // Top-left corner
    const result1 = raycastFromCanvasCoords(
      mockCanvas,
      0,
      0,
      {},
      { x: 0, y: 0, z: 0 },
      { yaw: 0, pitch: 0 },
    );

    // Bottom-right corner
    const result2 = raycastFromCanvasCoords(
      mockCanvas,
      800,
      600,
      {},
      { x: 0, y: 0, z: 0 },
      { yaw: 0, pitch: 0 },
    );

    expect(result1.hit).toBeDefined();
    expect(result2.hit).toBeDefined();
  });

  test("should handle different aspect ratios", () => {
    const mockCanvas = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
      }),
    };

    const result = raycastFromCanvasCoords(
      mockCanvas,
      960,
      540,
      {},
      { x: 0, y: 0, z: 0 },
      { yaw: 0, pitch: 0 },
    );

    expect(result.hit).toBeDefined();
  });
});
