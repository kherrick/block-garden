import { showToast } from "../api/ui/toast.mjs";

export class TextConfigurationDialog {
  constructor(gThis, doc, shadow) {
    this.gThis = gThis;
    this.doc = doc;
    this.shadow = shadow;
    this.dialog = null;

    this.close = this.close.bind(this);
    this.save = this.save.bind(this);
  }

  async createDialog() {
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialog = this.doc.createElement("dialog");
    dialog.setAttribute("id", "textConfigDialog");
    dialog.style.cssText = `
      background: var(--bg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--bg-color-gray-900);
      color: var(--bg-color-gray-900);
      font-family: monospace;
      max-width: 31.25rem;
      padding: 1.25rem;
      width: 90%;
    `;

    const currentConfig = this.gThis.blockGarden.state.armedTextConfig.get();
    const textValue = currentConfig.text || "";

    dialog.innerHTML = `
      <div style="align-items: center; display: flex; justify-content: space-between; margin-bottom: 0.9375rem;">
        <h3 style="margin: 0">Configure Text Block</h3>
        <button id="closeTextConfigDialog" style="background: var(--bg-color-red-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.3125rem 0.625rem;">
          &times;
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.9375rem;">
        <div style="display: flex; flex-direction: column; gap: 0.3125rem;">
          <label style="font-weight: bold;">Block Text:</label>
          <textarea id="blockTextValue" placeholder="Enter text to display when block is clicked..." style="border-radius: 0.25rem; border: 0.0625rem solid var(--bg-color-gray-500); padding: 0.5rem; min-height: 100px; resize: vertical; font-family: inherit;">${textValue}</textarea>
        </div>

        <button id="saveTextConfigBtn" style="background: var(--bg-color-green-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; margin-top: 0.625rem; padding: 0.625rem; font-weight: bold; transition: all 0.2s;">
          Save & Arm Text Block
        </button>
      </div>
    `;

    this.shadow.append(dialog);
    this.dialog = dialog;

    const closeBtn = dialog.querySelector("#closeTextConfigDialog");
    closeBtn.addEventListener("click", this.close);

    const saveBtn = dialog.querySelector("#saveTextConfigBtn");
    saveBtn.addEventListener("click", this.save);

    return dialog;
  }

  save() {
    const text = this.dialog.querySelector("#blockTextValue").value;

    this.gThis.blockGarden.state.armedTextConfig.set({
      text,
    });

    showToast(this.shadow, "Text block armed!");

    this.close();
  }

  show() {
    if (this.dialog instanceof HTMLDialogElement) {
      if (this.doc.pointerLockElement) {
        this.doc.exitPointerLock();
      }

      this.gThis.blockGarden.state.isCanvasActionDisabled = true;

      this.dialog.showModal();
    }
  }

  close() {
    if (this.dialog instanceof HTMLDialogElement) {
      this.dialog.close();
      this.dialog.remove();

      setTimeout(() => {
        this.gThis.blockGarden.state.isCanvasActionDisabled = false;
      }, 500);
    }
  }
}

export async function showTextConfigDialog(gThis, doc, shadow) {
  const textDialog = new TextConfigurationDialog(gThis, doc, shadow);

  await textDialog.createDialog();

  textDialog.show();

  return textDialog;
}
