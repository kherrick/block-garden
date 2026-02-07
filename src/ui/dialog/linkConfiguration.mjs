import { showToast } from "../../api/ui/toast.mjs";

import { formatName } from "../../utils/formatWorldName.mjs";

export class LinkConfigurationDialog {
  /**
   * @param {any} gThis
   * @param {Document} doc
   * @param {ShadowRoot} shadow
   */
  constructor(gThis, doc, shadow) {
    this.gThis = gThis;
    this.doc = doc;
    this.shadow = shadow;
    /** @type {HTMLDialogElement | null} */
    this.dialog = null;
    /** @type {{key: string, value: string}[]} */
    this.params = [];

    this.handleClose = this.handleClose.bind(this);
    this.save = this.save.bind(this);
    this.addParam = this.addParam.bind(this);
  }

  async createDialog() {
    // disable canvas while dialog is open
    this.gThis.blockGarden.state.isCanvasActionDisabled = true;
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialog = this.doc.createElement("dialog");
    dialog.setAttribute("id", "linkConfigDialog");
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

    const currentConfig = this.gThis.blockGarden.state.armedLinkConfig.get();
    const worldName = currentConfig.worldName || "";

    this.params = Object.entries(currentConfig.params || {}).map(
      ([key, value]) => ({ key, value }),
    );

    dialog.innerHTML = `
      <div style="align-items: center; display: flex; justify-content: space-between; margin-bottom: 0.9375rem;">
        <h3 style="margin: 0">Configure Link Block</h3>
        <button id="closeLinkConfigDialog" autofocus="autofocus" style="background: var(--bg-color-red-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.3125rem 0.625rem;">
          &times;
        </button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.9375rem;">
        <div style="display: flex; flex-direction: column; gap: 0.3125rem;">
          <label style="font-weight: bold;">Target World Name:</label>
          <input type="text" id="targetWorldName" value="${worldName}" placeholder="e.g. Gateway To The Clouds" required pattern="[A-Za-z0-9 \\-]+" style="border-radius: 0.25rem; border: 0.0625rem solid var(--bg-color-gray-500); padding: 0.5rem;" />
          <small style="color: var(--bg-color-gray-800);">Will load: https://kherrick.github.io/block-garden/assets/game-saves/<span id="previewFilename">${formatName(worldName)}.pdf</span></small>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
          ${["Gateway To The Clouds", "Flowers", "Caves", "The Garden"]
            .map(
              (name) => `
            <button class="quickSelectBtn" data-name="${name}" style="background: var(--bg-color-blue-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; padding: 0.4rem 0.8rem; font-size: 0.75rem; transition: background 0.2s, transform 0.1s; font-weight: bold; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.1);">
              ${name}
            </button>
          `,
            )
            .join("")}
        </div>

        <div>
          <label style="font-weight: bold;">GET Parameters:</label>
          <div id="paramsList" style="display: flex; flex-direction: column; gap: 0.3125rem; margin-top: 0.3125rem;">
            <!-- Params will be added here -->
          </div>
          <small style="color: var(--bg-color-gray-800);">example params: x=100, y=100, z=100, pitch=-1.5, yaw=0, flying=true</span></small>
          <button id="addParamBtn" style="background: var(--bg-color-blue-500); border-radius: 0.25rem; border: none; color: white; cursor: pointer; margin-top: 0.625rem; padding: 0.3125rem 0.625rem; font-size: 0.75rem;">
            + Add parameter
          </button>
        </div>

        <button id="saveLinkConfigBtn" ${!worldName ? "disabled" : ""} style="background: ${!worldName ? "var(--bg-color-gray-500)" : "var(--bg-color-green-500)"}; border-radius: 0.25rem; border: none; color: white; cursor: ${!worldName ? "not-allowed" : "pointer"}; margin-top: 0.625rem; padding: 0.625rem; font-weight: bold; opacity: ${!worldName ? "0.6" : "1"}; transition: all 0.2s;">
          Save & Arm Link Block
        </button>
      </div>
    `;

    this.shadow.append(dialog);
    this.dialog = dialog;

    const closeBtn = dialog.querySelector("#closeLinkConfigDialog");
    const saveBtn = dialog.querySelector("#saveLinkConfigBtn");
    const addParamBtn = dialog.querySelector("#addParamBtn");
    const worldNameInput = dialog.querySelector("#targetWorldName");
    const previewSpan = dialog.querySelector("#previewFilename");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.dialog?.close());
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", this.save);
    }

    if (addParamBtn) {
      addParamBtn.addEventListener("click", this.addParam);
    }

    const updateSaveButtonState = () => {
      const isValid =
        worldNameInput instanceof HTMLInputElement &&
        worldNameInput.checkValidity() &&
        worldNameInput.value.trim().length > 0;

      if (saveBtn instanceof HTMLButtonElement) {
        saveBtn.disabled = !isValid;
        saveBtn.style.background = !isValid
          ? "var(--bg-color-gray-500)"
          : "var(--bg-color-green-500)";

        saveBtn.style.cursor = !isValid ? "not-allowed" : "pointer";
        saveBtn.style.opacity = !isValid ? "0.6" : "1";
      }

      if (worldNameInput instanceof HTMLInputElement) {
        worldNameInput.style.borderColor = worldNameInput.checkValidity()
          ? "var(--bg-color-gray-500)"
          : "var(--bg-color-red-500)";
      }
    };

    if (worldNameInput instanceof HTMLInputElement) {
      worldNameInput.addEventListener("input", (e) => {
        const val = /** @type {HTMLInputElement} */ (e.target).value;

        if (previewSpan) {
          previewSpan.textContent = formatName(val) + ".pdf";
        }

        updateSaveButtonState();
      });
    }

    const quickBtns = dialog.querySelectorAll(".quickSelectBtn");
    quickBtns.forEach((btn) => {
      const element = /** @type {HTMLElement} */ (btn);
      element.addEventListener("click", () => {
        const name = element.getAttribute("data-name") || "";

        if (worldNameInput instanceof HTMLInputElement) {
          worldNameInput.value = name;
        }

        if (previewSpan) {
          previewSpan.textContent = formatName(name) + ".pdf";
        }

        updateSaveButtonState();
      });

      element.addEventListener("mouseenter", () => {
        element.style.background = "var(--bg-color-blue-700)";
      });

      element.addEventListener("mouseleave", () => {
        element.style.background = "var(--bg-color-blue-500)";
      });

      element.addEventListener("mousedown", () => {
        element.style.transform = "scale(0.95)";
      });

      element.addEventListener("mouseup", () => {
        element.style.transform = "scale(1)";
      });
    });

    this.renderParams();

    return dialog;
  }

  renderParams() {
    if (!this.dialog) return;
    const list = this.dialog.querySelector("#paramsList");
    if (!list) return;
    list.innerHTML = "";

    this.params.forEach((param, index) => {
      const row = this.doc.createElement("div");
      row.style.display = "flex";
      row.style.gap = "0.3125rem";

      const keyInput = this.doc.createElement("input");
      keyInput.type = "text";
      keyInput.placeholder = "key";
      keyInput.value = param.key;
      keyInput.style.flex = "1";
      keyInput.style.padding = "0.25rem";
      keyInput.style.borderRadius = "0.25rem";
      keyInput.style.border = "1px solid var(--bg-color-gray-500)";
      keyInput.addEventListener("input", (e) => {
        if (e.target instanceof HTMLInputElement) {
          this.params[index].key = e.target.value;
        }
      });

      const valInput = this.doc.createElement("input");
      valInput.type = "text";
      valInput.placeholder = "value";
      valInput.value = param.value;
      valInput.style.flex = "1";
      valInput.style.padding = "0.25rem";
      valInput.style.borderRadius = "0.25rem";
      valInput.style.border = "1px solid var(--bg-color-gray-500)";
      valInput.addEventListener(
        "input",
        (e) =>
          (this.params[index].value = /** @type {HTMLInputElement} */ (
            e.target
          ).value),
      );

      const removeBtn = this.doc.createElement("button");
      removeBtn.innerHTML = "&times;";
      removeBtn.style.background = "var(--bg-color-red-500)";
      removeBtn.style.color = "white";
      removeBtn.style.border = "none";
      removeBtn.style.borderRadius = "0.125rem";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.padding = "0 0.5rem";
      removeBtn.addEventListener("click", () => {
        this.params.splice(index, 1);
        this.renderParams();
      });

      row.append(keyInput, valInput, removeBtn);
      list.append(row);
    });
  }

  addParam() {
    this.params.push({ key: "", value: "" });
    this.renderParams();
  }

  save() {
    if (!this.dialog) return;

    const worldNameInput = /** @type {HTMLInputElement | null} */ (
      this.dialog.querySelector("#targetWorldName")
    );
    const worldName = worldNameInput?.value.trim();

    if (!worldName) {
      alert("Please enter a target world name.");

      return;
    }

    /** @type {Record<string, string>} */
    const params = {};
    this.params.forEach((p) => {
      if (p.key.trim()) {
        params[p.key.trim()] = p.value.trim();
      }
    });

    if (!this.dialog) return;

    this.gThis.blockGarden.state.armedLinkConfig.set({
      worldName,
      params,
    });

    showToast(this.shadow, `Link block armed for "${worldName}"!`);

    this.dialog.close();
  }

  open() {
    if (this.dialog instanceof HTMLDialogElement) {
      // disable canvas while dialog is open
      this.gThis.blockGarden.state.isCanvasActionDisabled = true;

      if (this.doc instanceof Document && this.doc.pointerLockElement) {
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
      this.dialog.remove();

      setTimeout(() => {
        // re-enable canvas after dialog is closed
        this.gThis.blockGarden.state.isCanvasActionDisabled = false;

        if (this.dialog) {
          this.dialog?.removeEventListener("close", this.handleClose);
        }
      }, 300);
    }
  }
}

/**
 * @param {any} gThis
 * @param {Document} doc
 * @param {ShadowRoot} shadow
 */
export async function showLinkConfigDialog(gThis, doc, shadow) {
  if (!shadow) return null;
  const linkDialog = new LinkConfigurationDialog(gThis, doc, shadow);

  const dialog = await linkDialog.createDialog();

  if (dialog instanceof HTMLDialogElement) {
    linkDialog.open();
  }

  return linkDialog;
}
