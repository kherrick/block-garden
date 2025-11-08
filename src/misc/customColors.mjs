import { ColorCustomizationDialog } from "../dialog/colors/index.mjs";

export async function showColorCustomizationDialog(gThis) {
  const colorDialog = new ColorCustomizationDialog(
    gThis,
    gThis.document,
    gThis.document.querySelector("sprite-garden").shadowRoot,
  );

  await colorDialog.createDialog();

  colorDialog.show();

  return colorDialog;
}
