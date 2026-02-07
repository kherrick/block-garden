import { showToast } from "../../api/ui/toast.mjs";

export class TextConfigurationDialog {
  /**
   * @param {any} gThis
   * @param {Document} doc
   * @param {ShadowRoot} shadow
   */
  constructor(gThis, doc, shadow) {
    this.gThis = gThis;
    this.doc = doc;
    this.shadow = shadow;
    this.dialog = null;

    this.handleClose = this.handleClose.bind(this);
    this.save = this.save.bind(this);
  }

  async createDialog() {
    // disable canvas while dialog is open
    this.gThis.blockGarden.state.isCanvasActionDisabled = true;

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
        <button id="closeTextConfigDialog" autofocus="autofocus" style="background: var(--bg-color-red-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.3125rem 0.625rem;">
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

    const closeBtn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#closeTextConfigDialog")
    );
    if (closeBtn)
      closeBtn.addEventListener("click", () => {
        if (this.dialog) this.dialog.close();
      });

    const saveBtn = /** @type {HTMLElement | null} */ (
      dialog.querySelector("#saveTextConfigBtn")
    );
    if (saveBtn) saveBtn.addEventListener("click", this.save);

    return dialog;
  }

  save() {
    const textInput = /** @type {HTMLInputElement | null} */ (
      this.dialog?.querySelector("#blockTextValue")
    );
    if (!textInput) return;
    const text = textInput.value;

    this.gThis.blockGarden.state.armedTextConfig.set({
      text,
    });

    showToast(this.shadow, "Text block armed!");

    if (this.dialog instanceof HTMLDialogElement) {
      this.dialog.close();
    }
  }

  open() {
    if (this.dialog instanceof HTMLDialogElement) {
      // disable canvas while dialog is open
      this.gThis.blockGarden.state.isCanvasActionDisabled = true;

      if (this.doc.pointerLockElement) {
        this.doc.exitPointerLock();
      }

      this.dialog.addEventListener("close", () => this.handleClose());
      this.dialog.showModal();

      const autofocusElement = this.dialog.querySelector("[autofocus]");
      if (autofocusElement instanceof HTMLElement) {
        autofocusElement.focus();
      }
    }
  }

  handleClose() {
    if (this.dialog instanceof HTMLDialogElement) {
      const dialog = this.dialog;
      dialog.remove();

      setTimeout(() => {
        // re-enable canvas after dialog is closed
        this.gThis.blockGarden.state.isCanvasActionDisabled = false;

        dialog.removeEventListener("close", this.handleClose);
      }, 300);
    }
  }
}

/**
 * @param {any} gThis
 * @param {Document} doc
 * @param {ShadowRoot} shadow
 * @returns {Promise<TextConfigurationDialog>}
 */
export async function showTextConfigDialog(gThis, doc, shadow) {
  const textDialog = new TextConfigurationDialog(gThis, doc, shadow);

  await textDialog.createDialog();

  textDialog.open();

  return textDialog;
}
