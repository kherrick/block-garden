/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { Signal } from "signal-polyfill";

import { effect } from "./effect.mjs";

describe("effect utility", () => {
  test("executes callback immediately on creation", async () => {
    const callback = jest.fn(() => {});

    effect(callback);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("executes callback when a signal dependency changes", async () => {
    const counter = new Signal.State(0);
    const callback = jest.fn(() => {
      counter.get();
    });

    effect(callback);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(1);

    counter.set(1);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(2);
  });

  test("executes cleanup function before re-execution", async () => {
    const counter = new Signal.State(0);
    const cleanup = jest.fn();
    const callback = jest.fn(() => {
      counter.get();
      return cleanup;
    });

    effect(callback);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    counter.set(1);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test("executes cleanup function on disposal", async () => {
    const cleanup = jest.fn();
    const callback = jest.fn(() => cleanup);
    const dispose = effect(callback);

    await Promise.resolve();

    expect(cleanup).not.toHaveBeenCalled();

    dispose();

    await Promise.resolve();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test("stops executing callback after disposal", async () => {
    const counter = new Signal.State(0);
    const callback = jest.fn(() => {
      counter.get();
    });

    const dispose = effect(callback);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(1);

    dispose();

    await Promise.resolve();

    counter.set(1);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  test("tracks computed signal dependencies", async () => {
    const counter = new Signal.State(0);
    const isEven = new Signal.Computed(() => (counter.get() & 1) === 0);
    const callback = jest.fn(() => {
      isEven.get();
    });

    effect(callback);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(1);

    counter.set(1);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(2);
  });

  test("allows multiple effects with different dependencies", async () => {
    const state1 = new Signal.State(0);
    const state2 = new Signal.State("initial");
    const callback1 = jest.fn(() => {
      state1.get();
    });

    const callback2 = jest.fn(() => {
      state2.get();
    });

    effect(callback1);
    effect(callback2);

    await Promise.resolve();

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    state1.set(1);

    await Promise.resolve();

    expect(callback1).toHaveBeenCalledTimes(2);
    expect(callback2).toHaveBeenCalledTimes(1);

    state2.set("updated");

    await Promise.resolve();

    expect(callback1).toHaveBeenCalledTimes(2);
    expect(callback2).toHaveBeenCalledTimes(2);
  });

  test("provides dispose function that returns undefined", async () => {
    const callback = jest.fn(() => {});
    const dispose = effect(callback);

    expect(typeof dispose).toBe("function");

    const result = dispose();

    expect(result).toBeUndefined();
  });

  test("handles effects without cleanup functions", async () => {
    const counter = new Signal.State(0);
    const callback = jest.fn(() => {
      counter.get();
      // No return statement
    });

    const dispose = effect(callback);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(1);

    counter.set(1);

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(2);

    dispose();

    await Promise.resolve();

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
