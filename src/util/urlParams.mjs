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
 * Get a number from the searchParams by key
 *
 * @param {URLSearchParams} searchParams
 * @param {string} key
 *
 * @returns {Number|undefined}
 */
export function getNumberParam(searchParams, key) {
  const value = searchParams.get(key);
  if (value === null || value.trim() === "") {
    return undefined; // guard against missing or empty
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Extracts player position and camera angle parameters from the URL.
 *
 * @param {typeof globalThis} gThis
 *
 * @returns {Object} Object with x, y, z, pitch, yaw (all numbers or undefined)
 */
export function getPlayerParamsFromUrl(gThis) {
  try {
    const searchParams = new URLSearchParams(location.search);
    const params = {};

    for (const key of ["x", "y", "z", "pitch", "yaw"]) {
      const num = getNumberParam(searchParams, key);
      if (num !== undefined) {
        params[key] = num;
      }
    }

    const flyingParam = searchParams.get("flying");
    if (flyingParam === "true" || flyingParam === "false") {
      params.flying = flyingParam === "true";
    }

    return params;
  } catch (error) {
    console.warn("Failed to parse player params from URL:", error);
    return {};
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

    if (params.has("x")) {
      params.delete("x");

      changed = true;
    }

    if (params.has("y")) {
      params.delete("y");

      changed = true;
    }

    if (params.has("z")) {
      params.delete("z");

      changed = true;
    }

    if (params.has("pitch")) {
      params.delete("pitch");

      changed = true;
    }

    if (params.has("yaw")) {
      params.delete("yaw");

      changed = true;
    }

    if (params.has("flying")) {
      params.delete("flying");

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
