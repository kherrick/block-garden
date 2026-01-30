/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

const { showToast } = await import("./toast.mjs");

describe("showToast", () => {
  let shadow;
  let container;

  beforeEach(() => {
    // Set up JSDOM environment
    shadow = {
      getElementById: jest.fn(),
      ownerDocument: document,
    };

    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);

    shadow.getElementById.mockReturnValue(container);

    // Mock setTimeout to avoid waiting
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  test("should warn and return if container not found", () => {
    shadow.getElementById.mockReturnValue(null);
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    showToast(shadow, "Test message");

    expect(consoleSpy).toHaveBeenCalledWith("Toast container not found");
    consoleSpy.mockRestore();
  });

  test("should set container bottom offset", () => {
    showToast(shadow, "Test message", { bottomOffset: 2 });
    expect(container.style.bottom).toBe("2rem");
  });

  test("should update existing toast when useSingle is true", () => {
    // Create existing toast
    const existingToast = document.createElement("div");
    existingToast.className = "toast";

    const content = document.createElement("div");
    content.className = "toast__content";

    existingToast.appendChild(content);
    container.appendChild(existingToast);

    showToast(shadow, "New message", { useSingle: true });

    expect(container.querySelector(".toast__content").textContent).toBe(
      "New message",
    );

    expect(container.querySelectorAll(".toast").length).toBe(1);
  });

  test("should create new toast when no existing toast", () => {
    showToast(shadow, "Test message");

    expect(container.querySelectorAll(".toast").length).toBe(1);
    expect(container.querySelector(".toast__content").textContent).toBe(
      "Test message",
    );
  });

  test("should add close button when manualClose is true", () => {
    showToast(shadow, "Test message", { manualClose: true });
    const closeBtn = container.querySelector(".toast__close-btn");

    expect(closeBtn).not.toBeNull();
    expect(closeBtn.innerHTML).toBe("×"); // HTML entity gets decoded
  });

  test("should not add close button when manualClose is false", () => {
    showToast(shadow, "Test message", { manualClose: false });

    const closeBtn = container.querySelector(".toast__close-btn");
    expect(closeBtn).toBeNull();
  });

  test("should remove existing toasts when stack is false", () => {
    // Create existing toasts
    const toast1 = document.createElement("div");
    toast1.className = "toast";

    const toast2 = document.createElement("div");
    toast2.className = "toast";

    container.appendChild(toast1);
    container.appendChild(toast2);

    showToast(shadow, "New message", { stack: false, useSingle: false });

    expect(toast1.classList.contains("toast--fade-out")).toBe(true);
    expect(toast2.classList.contains("toast--fade-out")).toBe(true);
  });

  test("should set auto-remove timer when duration > 0", () => {
    showToast(shadow, "Test message", { duration: 1000 });

    const toast = container.querySelector(".toast");

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    expect(toast.classList.contains("toast--slide-out")).toBe(true);
  });

  test("should not set auto-remove timer when duration = 0", () => {
    showToast(shadow, "Test message", { duration: 0 });

    const toast = container.querySelector(".toast");

    // No timer should be set, so toast should not be removed
    jest.advanceTimersByTime(1000);

    expect(toast.classList.contains("toast--slide-out")).toBe(false);
  });

  test("should reset auto-remove timer when updating existing toast", () => {
    jest.useRealTimers();

    // Create existing toast with timer
    const existingToast = document.createElement("div");
    existingToast.className = "toast";

    const content = document.createElement("div");
    content.className = "toast__content";

    existingToast.appendChild(content);
    container.appendChild(existingToast);

    // Set a timer on the existing toast
    const timerId = setTimeout(() => {}, 1000);
    existingToast.autoRemoveTimer = timerId;

    // Mock clearTimeout
    const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");
    const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");

    showToast(shadow, "Updated message", { useSingle: true, duration: 1000 });

    // Should clear old timer and set new one
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
    expect(setTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  test("should use default duration when not specified", () => {
    showToast(shadow, "Test message");

    const toast = container.querySelector(".toast");

    jest.advanceTimersByTime(3000);

    expect(toast.classList.contains("toast--slide-out")).toBe(true);
  });

  test("should use default bottom offset when not specified", () => {
    showToast(shadow, "Test message");

    expect(container.style.bottom).toBe("1rem");
  });
});
