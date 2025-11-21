import {
  buildColorMapByPropNames,
  sgColorPropList,
  sgTileColorPropList,
} from "../../state/config/tiles.mjs";

/**
 * Extract all --sg CSS custom properties
 *
 * @param {any} gThis
 * @param {any} shadow
 *
 * @returns {{}}
 */
export function getCustomProperties(gThis, shadow) {
  const styles = gThis.getComputedStyle(shadow.host);

  return {
    ...buildColorMapByPropNames(styles, sgColorPropList),
    ...buildColorMapByPropNames(styles, sgTileColorPropList),
  };
}
