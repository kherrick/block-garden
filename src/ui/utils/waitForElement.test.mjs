/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

const { waitForElement } = await import("./waitForElement.mjs");

describe("waitForElement", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("should resolve when element is found immediately", async () => {
    const mockElement = document.createElement("div");
    const getElement = jest.fn(() => mockElement);

    const promise = waitForElement({
      getElement,
      intervalMs: 50,
      timeoutMs: 1000,
    });

    const result = await promise;

    expect(result).toBe(mockElement);
    expect(getElement).toHaveBeenCalledTimes(1);
  });

  test("should poll until element is found", async () => {
    const mockElement = document.createElement("div");

    let callCount = 0;

    const getElement = jest.fn(() => {
      callCount++;

      if (callCount < 3) {
        return null;
      }

      return mockElement;
    });

    const promise = waitForElement({
      getElement,
      intervalMs: 50,
      timeoutMs: 1000,
    });

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    const result = await promise;

    expect(result).toBe(mockElement);
    expect(getElement).toHaveBeenCalledTimes(3);
  });

  test("should reject on timeout when element is never found", async () => {
    const getElement = jest.fn(() => null);
    const intervalMs = 50;
    const timeoutMs = 200;

    const promise = waitForElement({ getElement, intervalMs, timeoutMs });

    jest.advanceTimersByTime(timeoutMs + 10);
    await Promise.resolve();

    await expect(promise).rejects.toThrow("Timed out waiting for element");
    expect(getElement).toHaveBeenCalled();
  });

  test("should use default intervalMs and timeoutMs when not provided", async () => {
    const mockElement = document.createElement("div");
    const getElement = jest.fn(() => mockElement);

    const promise = waitForElement({ getElement });
    const result = await promise;

    expect(result).toBe(mockElement);
  });

  test("should handle custom intervalMs", async () => {
    const mockElement = document.createElement("div");

    let callCount = 0;

    const getElement = jest.fn(() => {
      callCount++;

      if (callCount < 2) {
        return null;
      }

      return mockElement;
    });

    const promise = waitForElement({
      getElement,
      intervalMs: 100,
      timeoutMs: 1000,
    });

    jest.advanceTimersByTime(100);
    await Promise.resolve();

    const result = await promise;

    expect(result).toBe(mockElement);
    expect(getElement).toHaveBeenCalledTimes(2);
  });

  test("should handle custom timeoutMs", async () => {
    const getElement = jest.fn(() => null);
    const timeoutMs = 500;

    const promise = waitForElement({ getElement, intervalMs: 100, timeoutMs });

    jest.advanceTimersByTime(timeoutMs + 10);
    await Promise.resolve();

    await expect(promise).rejects.toThrow("Timed out waiting for element");
  });

  test("should stop polling after element is found", async () => {
    const mockElement = document.createElement("div");

    let callCount = 0;

    const getElement = jest.fn(() => {
      callCount++;

      if (callCount < 2) {
        return null;
      }

      return mockElement;
    });

    const promise = waitForElement({
      getElement,
      intervalMs: 50,
      timeoutMs: 1000,
    });

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    await promise;

    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(getElement).toHaveBeenCalledTimes(2);
  });

  test("should work with document.getElementById", async () => {
    const mockElement = document.createElement("div");

    mockElement.id = "test-id";

    document.body.appendChild(mockElement);

    const getElement = () => document.getElementById("test-id");

    const promise = waitForElement({
      getElement,
      intervalMs: 50,
      timeoutMs: 1000,
    });

    const result = await promise;

    expect(result).toBe(mockElement);
    expect(result.id).toBe("test-id");

    document.body.removeChild(mockElement);
  });

  test("should handle element that appears just before timeout", async () => {
    const mockElement = document.createElement("div");

    let callCount = 0;

    const getElement = jest.fn(() => {
      callCount++;

      if (callCount < 4) {
        return null;
      }

      return mockElement;
    });

    const promise = waitForElement({
      getElement,
      intervalMs: 50,
      timeoutMs: 200,
    });

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    const result = await promise;

    expect(result).toBe(mockElement);
    expect(getElement).toHaveBeenCalledTimes(4);
  });
});
