/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

import { isKeyPressed } from "./isKeyPressed.mjs";

describe("isKeyPressed", () => {
  let mockShadow;
  let mockHost;

  beforeEach(() => {
    mockHost = {
      keys: {},
      touchKeys: {},
    };

    mockShadow = {
      host: mockHost,
      getElementById: () => ({
        matches: jest.fn(),
      }),
      querySelectorAll: () => [],
    };
  });

  test("should return true when key is pressed via keyboard", () => {
    mockHost.keys["w"] = true;

    expect(isKeyPressed(mockShadow, "w")).toBe(true);
  });

  test("should return true when key is pressed via touch", () => {
    mockHost.touchKeys["upleft"] = true;

    expect(isKeyPressed(mockShadow, "upleft")).toBe(true);
  });

  test("should return true when key is pressed via both keyboard and touch", () => {
    mockHost.keys["arrowup"] = true;
    mockHost.touchKeys["arrowup"] = true;

    expect(isKeyPressed(mockShadow, "arrowup")).toBe(true);
  });

  test("should return false when key is not pressed", () => {
    mockHost.keys["w"] = false;
    mockHost.touchKeys["w"] = false;

    expect(isKeyPressed(mockShadow, "w")).toBe(false);
  });

  test("should return falsy when different key is pressed", () => {
    mockHost.keys["a"] = true;

    expect(isKeyPressed(mockShadow, "w")).toBeFalsy();
  });

  test("should return false when host has no keys or touchKeys", () => {
    const shadowWithoutHost = {
      host: {},
    };

    expect(isKeyPressed(shadowWithoutHost, "w")).toBe(false);
  });

  test("should return false when shadow has no host", () => {
    const shadowWithoutHost = {
      host: null,
    };

    expect(isKeyPressed(shadowWithoutHost, "w")).toBe(false);
  });

  test("should handle special keys", () => {
    mockHost.keys["Enter"] = true;

    expect(isKeyPressed(mockShadow, "Enter")).toBe(true);
  });

  test("should handle modifier keys", () => {
    mockHost.keys["Control"] = true;

    expect(isKeyPressed(mockShadow, "Control")).toBe(true);
  });

  test("should handle numeric keys", () => {
    mockHost.keys["1"] = true;

    expect(isKeyPressed(mockShadow, "1")).toBe(true);
  });

  test("should handle function keys", () => {
    mockHost.keys["F1"] = true;

    expect(isKeyPressed(mockShadow, "F1")).toBe(true);
  });

  test("should handle space key", () => {
    mockHost.keys[" "] = true;

    expect(isKeyPressed(mockShadow, " ")).toBe(true);
  });

  test("should handle arrow keys", () => {
    mockHost.keys["arrowup"] = true;

    expect(isKeyPressed(mockShadow, "arrowup")).toBe(true);
  });

  test("should prioritize keyboard over touch when both have different values", () => {
    mockHost.keys["w"] = false;
    mockHost.touchKeys["w"] = true;

    expect(isKeyPressed(mockShadow, "w")).toBe(true);
  });
});
