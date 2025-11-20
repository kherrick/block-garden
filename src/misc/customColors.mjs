import { getShadowRoot } from "../util/getShadowRoot.mjs";
import { ColorCustomizationDialog } from "../dialog/colors/index.mjs";

/**
 * @param {any} gThis
 *
 * @returns {Promise<ColorCustomizationDialog>}
 */
export async function showColorCustomizationDialog(gThis) {
  const colorDialog = new ColorCustomizationDialog(
    gThis,
    gThis.document,
    getShadowRoot(gThis.document, "sprite-garden"),
  );

  await colorDialog.createDialog();

  colorDialog.show();

  return colorDialog;
}
