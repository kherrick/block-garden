/**
 * Capitalize the first letter of each word, replace spaces with dashes,
 * and allow only alphanumeric characters and dashes.
 *
 * @param {string} name
 *
 * @returns {string}
 */
export function formatName(name) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("-");
}
