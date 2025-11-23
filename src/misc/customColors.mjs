import { getShadowRoot } from "../util/getShadowRoot.mjs";
import { ColorCustomizationDialog } from "../dialog/colors/index.mjs";

/**
 * @param {typeof globalThis} gThis
 *
 * @returns {Promise<ColorCustomizationDialog>}
 */
export async function showColorCustomizationDialog(gThis) {
  const shadow = getShadowRoot(gThis.document, "sprite-garden");
  const colorDialog = new ColorCustomizationDialog(
    gThis,
    gThis.document,
    shadow,
  );

  await colorDialog.createDialog();

  colorDialog.show();

  return colorDialog;
}
