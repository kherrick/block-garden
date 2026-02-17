import { gameState } from "../../core/systems/game/state.mjs";
import { toggleMaterialBar } from "../controls/eventListeners/materialBar.mjs";

/**
 * Closes all open menus and returns focus to the canvas.
 *
 * @param {ShadowRoot} shadow
 * @param {HTMLCanvasElement} cnvs
 */
export function closeMenus(shadow, cnvs) {
  shadow
    .querySelectorAll(".ui-grid__corner--container")
    .forEach((e) => e.setAttribute("hidden", "hidden"));

  toggleMaterialBar(shadow, gameState, cnvs, true);

  cnvs.focus();
}
