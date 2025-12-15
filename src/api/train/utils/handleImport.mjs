/**
 * @callback ImportAgentFn
 * @param {any} data - Parsed Q-table data.
 * @returns {boolean} True if import succeeded, false otherwise.
 */

/**
 * @callback LogFn
 * @param {string} message - Text of the log message.
 * @param {"info"|"success"|"warning"|"error"} [type="info"] - Type of message.
 * @returns {void}
 */

/**
 * Prompts the user to select a JSON file for import.
 *
 * Programmatically creates and clicks a file input element to open a file
 * selection dialog. When a file is selected, it reads the contents as text,
 * parses it as JSON, and passes the data to the `importAgent` callback.
 *
 * @param {object} params
 * @param {ImportAgentFn} params.importAgent - The function to call with the parsed data.
 * @param {LogFn} params.log - The function to call for logging errors.
 * @returns {void}
 */
export function handleImport({ importAgent, log }) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", async (e) => {
    const target = /** @type {HTMLInputElement|null} */ (e.target);
    const file = target?.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importAgent(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err ?? "Unknown error");
      log(`❌ Import failed: ${message}`, "error");
    }
  });

  input.click();
}
