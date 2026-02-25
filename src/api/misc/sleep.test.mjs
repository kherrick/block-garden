/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";
import { sleep } from "./sleep.mjs";

describe("sleep", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("should resolve after specified time", async () => {
    const promise = sleep(1000);

    jest.advanceTimersByTime(1000);

    await expect(promise).resolves.toBeUndefined();
  });

  test("should handle zero delay", async () => {
    const promise = sleep(0);

    jest.advanceTimersByTime(0);

    await expect(promise).resolves.toBeUndefined();
  });

  test("should reject negative delay", async () => {
    await expect(sleep(-100)).rejects.toThrow(RangeError);
  });

  test("should handle large delay", async () => {
    const promise = sleep(10000);

    jest.advanceTimersByTime(10000);

    await expect(promise).resolves.toBeUndefined();
  });

  test("should not resolve before time elapses", async () => {
    const promise = sleep(1000);

    jest.advanceTimersByTime(500);

    // Check that the promise hasn't resolved yet
    let hasResolved = false;

    promise.then(() => {
      hasResolved = true;
    });

    // Advance timers a bit more but not enough to resolve
    jest.advanceTimersByTime(400);

    // Allow promise callbacks to execute
    await Promise.resolve();

    expect(hasResolved).toBe(false);

    // Now advance to completion
    jest.advanceTimersByTime(100);

    await expect(promise).resolves.toBeUndefined();
  });
});
