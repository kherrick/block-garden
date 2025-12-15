/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

// Mock dependencies BEFORE imports
jest.unstable_mockModule("../misc/sleep.mjs", () => ({
  sleep: jest.fn(async () => {}),
}));

jest.unstable_mockModule("./createKeyEvent.mjs", () => ({
  createKeyEvent: jest.fn(
    (type, keyCode) => new KeyboardEvent(type, { keyCode }),
  ),
}));

const { sleep } = await import("../misc/sleep.mjs");
const { createKeyEvent } = await import("./createKeyEvent.mjs");
const { pressKey } = await import("./pressKey.mjs");

describe("pressKey", () => {
  let shadow;

  beforeEach(() => {
    jest.clearAllMocks();
    shadow = {
      dispatchEvent: jest.fn(),
    };
  });

  it("should dispatch a keydown event", async () => {
    const keyCode = 65; // 'A'
    await pressKey(shadow, keyCode);
    expect(shadow.dispatchEvent).toHaveBeenCalledWith(
      expect.any(KeyboardEvent),
    );
    const event = shadow.dispatchEvent.mock.calls[0][0];
    expect(event.type).toBe("keydown");
    expect(event.keyCode).toBe(keyCode);
  });

  it("should dispatch a keyup event", async () => {
    const keyCode = 65; // 'A'
    await pressKey(shadow, keyCode);
    expect(shadow.dispatchEvent).toHaveBeenCalledTimes(2);
    const event = shadow.dispatchEvent.mock.calls[1][0];
    expect(event.type).toBe("keyup");
    expect(event.keyCode).toBe(keyCode);
  });

  it("should call sleep with the specified holdTime", async () => {
    const holdTime = 500;
    await pressKey(shadow, 65, holdTime);
    expect(sleep).toHaveBeenCalledWith(holdTime);
  });

  it("should use a default holdTime of 100ms if not specified", async () => {
    await pressKey(shadow, 65);
    expect(sleep).toHaveBeenCalledWith(100);
  });

  it("should call createKeyEvent for both keydown and keyup", async () => {
    const keyCode = 87; // 'W'
    await pressKey(shadow, keyCode);
    expect(createKeyEvent).toHaveBeenCalledTimes(2);
    expect(createKeyEvent).toHaveBeenCalledWith("keydown", keyCode);
    expect(createKeyEvent).toHaveBeenCalledWith("keyup", keyCode);
  });
});
