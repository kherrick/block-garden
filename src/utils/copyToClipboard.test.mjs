/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";

const { copyToClipboard } = await import("./copyToClipboard.mjs");

describe("copyToClipboard", () => {
  let mockGlobal;

  beforeEach(() => {
    mockGlobal = {
      navigator: {
        clipboard: {
          writeText: jest.fn(() => Promise.resolve()),
        },
      },
      isSecureContext: true,
    };
  });

  test("should call clipboard.writeText when available", async () => {
    await copyToClipboard(mockGlobal, "test text");

    expect(mockGlobal.navigator.clipboard.writeText).toHaveBeenCalledWith(
      "test text",
    );
  });

  test("should not throw when clipboard API is not available", async () => {
    mockGlobal.navigator.clipboard = null;

    await expect(
      copyToClipboard(mockGlobal, "test text"),
    ).resolves.not.toThrow();
  });

  test("should not throw when not in secure context", async () => {
    mockGlobal.isSecureContext = false;

    await expect(
      copyToClipboard(mockGlobal, "test text"),
    ).resolves.not.toThrow();
  });

  test("should handle clipboard writeText errors gracefully", async () => {
    mockGlobal.navigator.clipboard.writeText.mockRejectedValue(
      new Error("Clipboard error"),
    );

    await expect(
      copyToClipboard(mockGlobal, "test text"),
    ).resolves.not.toThrow();
  });

  test("should handle empty text", async () => {
    await copyToClipboard(mockGlobal, "");

    expect(mockGlobal.navigator.clipboard.writeText).toHaveBeenCalledWith("");
  });

  test("should handle special characters", async () => {
    await copyToClipboard(mockGlobal, "!@#$%^&*()");

    expect(mockGlobal.navigator.clipboard.writeText).toHaveBeenCalledWith(
      "!@#$%^&*()",
    );
  });

  test("should handle multiline text", async () => {
    await copyToClipboard(mockGlobal, "line1\nline2\nline3");

    expect(mockGlobal.navigator.clipboard.writeText).toHaveBeenCalledWith(
      "line1\nline2\nline3",
    );
  });
});
