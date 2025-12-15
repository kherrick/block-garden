/**
 * @callback GetExportDataFn
 * @returns {any|null} The data to be exported, or null if no data is available.
 */

/**
 * Triggers a JSON file download for the given data.
 *
 * Creates a blob from the data, generates an object URL, and programmatically
 * clicks a temporary anchor element to trigger the download.
 *
 * @param {object} params
 * @param {GetExportDataFn} params.getExportData - A function that returns the data to be exported.
 * @returns {void}
 */
export function handleExport({ getExportData }) {
  const data = getExportData();
  if (!data) {
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sprite-garden-qtable-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
