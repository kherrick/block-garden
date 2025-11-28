/**
 * Dialog management class for displaying modal content.
 *
 * Handles creation, rendering, and event handling for dialog overlays.
 */
export class AboutDialog {
  /**
   * Creates an AboutDialog instance.
   *
   * @param {Document} doc - Document object for element creation
   * @param {ShadowRoot} shadow - Shadow root to append dialog to
   */
  constructor(doc, shadow) {
    this.doc = doc;
    this.shadow = shadow;
    this.dialog = null;
    this.close = this.close.bind(this);
    this.handleDialogClick = this.handleDialogClick.bind(this);
  }

  /**
   * Creates and renders a dialog from a fetched HTML template.
   *
   * Removes existing dialog if present. Fetches content and injects into DOM.
   * Initializes event listeners and shows close button.
   *
   * @param {string} part - Path to fetch dialog content from
   *
   * @returns {Promise<HTMLDialogElement>} The created dialog element
   */
  async createDialog(part) {
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialogClass = `${part}-content`;

    let dialog = this.shadow.querySelector(`.${dialogClass}`);

    if (!dialog) {
      dialog = this.doc.createElement("dialog");
      dialog.setAttribute("class", dialogClass);

      const parser = new DOMParser();
      const documentText = await (await fetch(part)).text();
      const parsed = parser.parseFromString(documentText, "text/html");
      const content = parsed.querySelector(`.${dialogClass}`);

      dialog.innerHTML = content.innerHTML;

      this.shadow.append(dialog);
      this.shadow
        .querySelector(`.${part}-content_close-btn`)
        .removeAttribute("hidden");
    }

    if (!(dialog instanceof HTMLDialogElement)) {
      throw new Error("Failed to create or find HTMLDialogElement");
    }

    this.dialog = dialog;
    this.initEventListeners();

    return this.dialog;
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
    const closeBtn = this.dialog.querySelector(".about-content_close-btn");

    closeBtn.addEventListener("click", this.close);

    this.dialog.addEventListener("click", this.handleDialogClick);
  }

  /** @returns {void} */
  removeEventListeners() {
    const closeBtn = this.dialog.querySelector(".about-content_close-btn");

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
 * @returns {Promise<AboutDialog>}
 */
async function showAboutDialog(doc, shadow) {
  const aboutDialog = new AboutDialog(doc, shadow);

  await aboutDialog.createDialog("about");

  aboutDialog.show();

  return aboutDialog;
}

export { showAboutDialog };
