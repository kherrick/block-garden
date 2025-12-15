/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { ACTION_KEYS, ACTIONS } from "../misc/actions.mjs";

// Mock dependencies BEFORE imports
jest.unstable_mockModule("./pressKey.mjs", () => ({
  pressKey: jest.fn(async () => {}),
}));

const { pressKey } = await import("./pressKey.mjs");
const { moveLeft, moveRight, jumpUp, jumpUpLeft, jumpUpRight } = await import(
  "./movement.mjs"
);

describe("movement", () => {
  let shadow;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    shadow = {
      dispatchEvent: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("moveLeft", () => {
    it("should call pressKey with the 'A' key code", async () => {
      await moveLeft(shadow);
      const [keyA] = ACTION_KEYS[ACTIONS.LEFT];
      expect(pressKey).toHaveBeenCalledWith(shadow, keyA, 200);
    });

    it("should call pressKey with the specified holdTime", async () => {
      await moveLeft(shadow, 500);
      const [keyA] = ACTION_KEYS[ACTIONS.LEFT];
      expect(pressKey).toHaveBeenCalledWith(shadow, keyA, 500);
    });
  });

  describe("moveRight", () => {
    it("should call pressKey with the 'D' key code", async () => {
      await moveRight(shadow);
      const [keyD] = ACTION_KEYS[ACTIONS.RIGHT];
      expect(pressKey).toHaveBeenCalledWith(shadow, keyD, 200);
    });

    it("should call pressKey with the specified holdTime", async () => {
      await moveRight(shadow, 500);
      const [keyD] = ACTION_KEYS[ACTIONS.RIGHT];
      expect(pressKey).toHaveBeenCalledWith(shadow, keyD, 500);
    });
  });

  describe("jumpUp", () => {
    it("should call pressKey with the 'W' key code", async () => {
      await jumpUp(shadow);
      const [keyW] = ACTION_KEYS[ACTIONS.UP];
      expect(pressKey).toHaveBeenCalledWith(shadow, keyW, 200);
    });

    it("should call pressKey with the specified holdTime", async () => {
      await jumpUp(shadow, 500);
      const [keyW] = ACTION_KEYS[ACTIONS.UP];
      expect(pressKey).toHaveBeenCalledWith(shadow, keyW, 500);
    });
  });

  describe("jumpUpLeft", () => {
    it("should call jumpUp and then moveLeft after a delay", async () => {
      const [keyW] = ACTION_KEYS[ACTIONS.UP];
      const [keyA] = ACTION_KEYS[ACTIONS.LEFT];

      const jumpUpLeftPromise = jumpUpLeft(shadow, 50, 200);

      // jumpUp is called immediately
      expect(pressKey).toHaveBeenCalledWith(shadow, keyW, 200);
      expect(pressKey).toHaveBeenCalledTimes(1);

      // Fast-forward timers and wait for microtasks
      await jest.runAllTimersAsync();

      // Now moveLeft should have been called
      expect(pressKey).toHaveBeenCalledTimes(2);
      expect(pressKey).toHaveBeenNthCalledWith(2, shadow, keyA, 200);

      await jumpUpLeftPromise;
    });
  });

  describe("jumpUpRight", () => {
    it("should call jumpUp and then moveRight after a delay", async () => {
      const [keyW] = ACTION_KEYS[ACTIONS.UP];
      const [keyD] = ACTION_KEYS[ACTIONS.RIGHT];

      const jumpUpRightPromise = jumpUpRight(shadow, 50, 200);

      // jumpUp is called immediately
      expect(pressKey).toHaveBeenCalledWith(shadow, keyW, 200);
      expect(pressKey).toHaveBeenCalledTimes(1);

      // Fast-forward timers and wait for microtasks
      await jest.runAllTimersAsync();

      // Now moveRight should have been called
      expect(pressKey).toHaveBeenCalledTimes(2);
      expect(pressKey).toHaveBeenNthCalledWith(2, shadow, keyD, 200);

      await jumpUpRightPromise;
    });
  });
});
