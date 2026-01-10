/**
 * Extracts the `gameSave` parameter from the URL.
 *
 * @param {typeof globalThis} gThis
 *
 * @returns {string|null} The value of the `gameSave` parameter, or null if not found.
 */
export function getGameSaveUrlParam(gThis) {
  try {
    const searchParams = new gThis.URLSearchParams(gThis.location.search);

    return searchParams.get("gameSave");
  } catch (error) {
    console.warn("Failed to parse URL search params:", error);
    return null;
  }
}

/**
 * Remove `seed` and `gameSave` parameters from the URL.
 *
 * @param {typeof globalThis} gThis
 *
 * @returns {void}
 */
export function clearUrlParams(gThis) {
  try {
    const url = new gThis.URL(gThis.location.href);
    const params = new gThis.URLSearchParams(url.search);

    let changed = false;

    if (params.has("seed")) {
      params.delete("seed");

      changed = true;
    }

    if (params.has("gameSave")) {
      params.delete("gameSave");

      changed = true;
    }

    if (changed) {
      const newSearch = params.toString();
      const newUrl =
        url.origin + url.pathname + (newSearch ? "?" + newSearch : "");

      gThis.history.replaceState({}, "", newUrl);
    }
  } catch (e) {}
}
