/**
 * Generates an ISO-like timestamp string suitable for use in filenames.
 *
 * Format: YYYY-MM-DD_HH-MM-SS (in UTC).
 *
 * @returns {string} Timestamp string for filename (e.g., '2025-11-26_14-30-45.123')
 */
export function getDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");
  const minute = now.getMinutes().toString().padStart(2, "0");
  const second = now.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}
