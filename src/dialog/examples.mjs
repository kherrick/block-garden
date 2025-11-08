export class ExamplesDialog {
  constructor(doc, shadow) {
    this.doc = doc;
    this.shadow = shadow;
    this.dialog = null;

    this.close = this.close.bind(this);
    this.handleDialogClick = this.handleDialogClick.bind(this);
  }

  async createDialog(part, path) {
    if (this.dialog) {
      this.dialog.remove();
    }

    const dialogClass = `${part}-content`;
    let dialog = this.shadow.querySelector(`.${dialogClass}`);

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

  handleDialogClick(e) {
    if (e.target === this.dialog) {
      this.close();
    }
  }

  initEventListeners() {
    const closeBtn = this.dialog.querySelector(".examples-content_close-btn");
    closeBtn.addEventListener("click", this.close);

    this.dialog.addEventListener("click", this.handleDialogClick);
  }

  removeEventListeners() {
    const closeBtn = this.dialog.querySelector(".examples-content_close-btn");
    closeBtn.removeEventListener("click", this.close);

    this.dialog.removeEventListener("click", this.handleDialogClick);
  }

  show() {
    this.dialog.showModal();
  }

  close() {
    this.removeEventListeners();
    this.dialog.close();
  }
}

async function showExamplesDialog(doc, shadow) {
  const examplesDialog = new ExamplesDialog(doc, shadow);

  await examplesDialog.createDialog("examples", "src/api");
  examplesDialog.show();

  return examplesDialog;
}

export { showExamplesDialog };
