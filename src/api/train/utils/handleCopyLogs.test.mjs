/**
 * @jest-environment jsdom
 */
import { handleCopyLogs } from "./handleCopyLogs.mjs";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";

describe("handleCopyLogs", () => {
  let log;
  let logsContainer;

  beforeEach(() => {
    log = jest.fn();
    logsContainer = document.createElement("div");

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("should copy formatted logs to the clipboard", async () => {
    logsContainer.innerHTML = `
      <div class="train-log-entry">
        <span class="train-log-time">9:27:33 PM</span>
        <span class="train-log-message">Log 1</span>
      </div>
      <div class="train-log-entry">
        <span class="train-log-time">9:27:32 PM</span>
        <span class="train-log-message">Log 2</span>
      </div>
    `;

    await handleCopyLogs({ logsContainer, log });

    const expectedMarkdown = "[9:27:33 PM] Log 1\n[9:27:32 PM] Log 2";
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expectedMarkdown,
    );
    expect(log).toHaveBeenCalledWith("📋 Logs copied to clipboard.", "success");
  });

  it("should log an error if the logs container is not found", async () => {
    await handleCopyLogs({ logsContainer: null, log });

    expect(log).toHaveBeenCalledWith("❌ Log container not found.", "error");
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("should log an info message if there are no logs to copy", async () => {
    await handleCopyLogs({ logsContainer, log });

    expect(log).toHaveBeenCalledWith("📋 No logs to copy.", "info");
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it("should log an error if clipboard write fails", async () => {
    const testError = new Error("Clipboard write failed");
    navigator.clipboard.writeText.mockRejectedValue(testError);

    // Mock console.error to prevent logging during this specific test
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    logsContainer.innerHTML = `
      <div class="train-log-entry">
        <span class="train-log-time">9:27:33 PM</span>
        <span class="train-log-message">Log 1</span>
      </div>
    `;

    await handleCopyLogs({ logsContainer, log });

    expect(log).toHaveBeenCalledWith("❌ Failed to copy logs.", "error");

    // Restore the original console.error function
    consoleErrorSpy.mockRestore();
  });

  it("should filter out malformed log entries", async () => {
    logsContainer.innerHTML = `
      <div class="train-log-entry">
        <span class="train-log-time">9:27:33 PM</span>
        <span class="train-log-message">Log 1</span>
      </div>
      <div>Just a random div</div>
      <div class="train-log-entry">
        <span class="train-log-message">No time</span>
      </div>
    `;

    await handleCopyLogs({ logsContainer, log });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "[9:27:33 PM] Log 1",
    );
    expect(log).toHaveBeenCalledWith("📋 Logs copied to clipboard.", "success");
  });

  it("should trim whitespace from time and message", async () => {
    logsContainer.innerHTML = `
      <div class="train-log-entry">
        <span class="train-log-time">  9:27:33 PM  </span>
        <span class="train-log-message">   Log 1 with spaces   </span>
      </div>
    `;

    await handleCopyLogs({ logsContainer, log });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "[9:27:33 PM] Log 1 with spaces",
    );
  });
});
