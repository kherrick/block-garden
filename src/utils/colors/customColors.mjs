import { getShadowRoot } from "../../ui/utils/getShadowRoot.mjs";
import { ColorCustomizationDialog } from "../../ui/dialog/colors/index.mjs";

/**
 * @typedef {import('../../core/systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis
 */

/**
 * @param {BlockGardenGlobalThis} gThis
 *
 * @returns {Promise<ColorCustomizationDialog>}
 */
export async function showColorCustomizationDialog(gThis) {
  const shadow = getShadowRoot(gThis.document, "block-garden");
  if (!shadow) {
    throw new Error("Failed to find block-garden shadow root");
  }

  const colorDialog = new ColorCustomizationDialog(
    gThis,
    gThis.document,
    shadow,
  );

  await colorDialog.createDialog();

  colorDialog.show();

  return colorDialog;
}
