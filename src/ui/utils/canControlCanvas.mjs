/**
 * Determine if the interaction should be allowed on the canvas
 *
 * @param {ShadowRoot} shadow
 *
 * @returns {boolean}
 */
export function canControlCanvas(shadow) {
  const uiGrid = shadow.getElementById("ui-grid");
  if (uiGrid?.matches(":focus-within")) {
    return false;
  }

  if (
    [...shadow.querySelectorAll("dialog")].some((dialog) =>
      dialog.matches(":focus-within"),
    )
  ) {
    return false;
  }

  return true;
}
