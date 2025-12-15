/**
 * @typedef {import('../Train.mjs').Train['log']} LogFunction
 */

/**
 * Handles copying the logs from a container to the clipboard as markdown.
 *
 * @param {{logsContainer: HTMLElement | null, log: LogFunction}} options
 * @returns {Promise<void>}
 */
export async function handleCopyLogs({ logsContainer, log }) {
  if (!logsContainer) {
    log("❌ Log container not found.", "error");

    return;
  }

  const logEntries = Array.from(logsContainer.children);
  const results = logEntries
    .map((entry) => {
      const timeEl = entry.querySelector(".train-log-time");
      const messageEl = entry.querySelector(".train-log-message");

      if (timeEl && messageEl) {
        const time = timeEl.textContent?.trim() ?? "";
        const message = messageEl.textContent?.trim() ?? "";
        return `[${time}] ${message}`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");

  if (!results) {
    log("📋 No logs to copy.", "info");

    return;
  }

  try {
    await navigator.clipboard.writeText(results);

    log("📋 Logs copied to clipboard.", "success");
  } catch (err) {
    log("❌ Failed to copy logs.", "error");

    console.error("Copy logs error:", err);
  }
}
