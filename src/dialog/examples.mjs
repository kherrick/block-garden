export class ExamplesDialog {
  /**
   * @param {Document} doc
   * @param {ShadowRoot} shadow
   */
  constructor(doc, shadow) {
    this.doc = doc;
    this.shadow = shadow;
    this.dialog = null;
    this.close = this.close.bind(this);
    this.handleDialogClick = this.handleDialogClick.bind(this);
  }

  /**
   * @param {string} part
   * @param {string} path
   *
   * @returns {Promise<HTMLDialogElement>}
   */
  async createDialog(part, path) {
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialogClass = `${part}-content`;

    let dialog =
      /** @type HTMLDialogElement */
      (this.shadow.querySelector(`.${dialogClass}`));

    if (!dialog) {
      dialog = this.doc.createElement("dialog");
      dialog.setAttribute("class", dialogClass);

      const parser = new DOMParser();
      const documentText = await (await fetch(`${path}/${part}`)).text();
      const parsed = parser.parseFromString(documentText, "text/html");
      const content = parsed.querySelector(`.${dialogClass}`);

      dialog.innerHTML = content.innerHTML;

      this.shadow.append(dialog);
      this.shadow
        .querySelector(`.${part}-content_close-btn`)
        .removeAttribute("hidden");
    }

    this.dialog = dialog;

    this.initEventListeners();

    return dialog;
  }

  /**
   * @param {MouseEvent} e
   *
   * @returns {void}
   */
  handleDialogClick(e) {
    if (e.target === this.dialog) {
      this.close();
    }
  }

  /** @returns {void} */
  initEventListeners() {
    const closeBtn = this.dialog.querySelector(".examples-content_close-btn");

    closeBtn.addEventListener("click", this.close);

    this.dialog.addEventListener("click", this.handleDialogClick);
  }

  /** @returns {void} */
  removeEventListeners() {
    const closeBtn = this.dialog.querySelector(".examples-content_close-btn");

    closeBtn.removeEventListener("click", this.close);

    this.dialog.removeEventListener("click", this.handleDialogClick);
  }

  /** @returns {void} */
  show() {
    this.dialog instanceof HTMLDialogElement && this.dialog.showModal();
  }

  /** @returns {void} */
  close() {
    this.removeEventListeners();

    this.dialog instanceof HTMLDialogElement && this.dialog.close();
  }
}

/**
 * @param {Document} doc
 * @param {ShadowRoot} shadow
 *
 * @returns {Promise<ExamplesDialog>}
 */
async function showExamplesDialog(doc, shadow) {
  const examplesDialog = new ExamplesDialog(doc, shadow);

  await examplesDialog.createDialog("examples", "src/api");

  examplesDialog.show();

  return examplesDialog;
}

export { showExamplesDialog };
