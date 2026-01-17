export const selectTagName = "block-garden-select";

/**
 * Select component for Block Garden
 */
export class BlockGardenSelect extends HTMLElement {
  #shadow;
  #trigger;
  #list;
  #selected;
  #hiddenInput;
  #items = [];

  constructor() {
    super();

    const template = globalThis.document.createElement("template");
    template.innerHTML = `
      <style>
        [hidden] {
          display: none !important;
        }

        .block-garden-select {
          align-items: center;
          background: var(--bg-color-green-500);
          border-radius: 0.25rem;
          border: none;
          color: var(--bg-color-white);
          cursor: pointer;
          display: flex;
          font-size: 0.625rem;
          justify-content: space-between;
          min-height: 2.125rem;
          padding: 0.375rem 0.75rem;
          text-align: center;
          transition: all 0.2s;
          user-select: none;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .block-garden-select > * {
          flex-shrink: 0;
        }

        .selected-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .block-garden-select:hover {
          background: var(--bg-color-green-600);
        }

        .block-garden-select:focus {
          outline-offset: -0.125rem;
          outline: 0.125rem solid var(--bg-color-green-500);
        }

        .block-garden-select[aria-expanded="true"] {
          border-radius: 0.25rem 0.25rem 0 0;
        }

        .chevron {
          flex-shrink: 0;
          font-size: 0.75rem;
          margin-left: 0.25rem;
          padding-left: 0.25rem;
          transition: transform 0.2s;
        }

        .block-garden-select[aria-expanded="true"] .chevron {
          transform: rotate(180deg);
        }

        .placeholder {
          opacity: 0.8;
        }

        .select-list {
          background: var(--bg-color-gray-900);
          border-radius: 0 0 0.25rem 0.25rem;
          border-top: none;
          border: 0.0625rem solid var(--bg-color-neutral-950);
          left: 0;
          list-style: none;
          margin: 0;
          max-height: 12rem;
          overflow-y: auto;
          padding: 0;
          position: absolute;
          right: 0;
          top: 100%;
          z-index: 1000;
        }

        .select-list[hidden] {
          display: none;
        }

        .select-item {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: var(--bg-color-white);
          cursor: pointer;
          font-size: 0.625rem;
          padding: 0.375rem 0.75rem;
          transition: all 0.2s;
        }

        .select-item:last-child {
          border-bottom: none;
        }

        .select-item:hover,
        .select-item:focus,
        .select-item[aria-selected="true"] {
          background: var(--bg-color-green-500);
          outline: none;
        }

        .select-item:focus {
          outline: 2px solid var(--bg-color-green-500);
          outline-offset: -2px;
        }

        /* scrollbar */
        .select-list {
          scrollbar-color: var(--bg-color-gray-700) var(--bg-color-gray-900);
          scrollbar-width: thin;
        }

        .select-list::-webkit-scrollbar {
          width: 0.625rem;
        }

        .select-list::-webkit-scrollbar-track {
          background: var(--bg-color-gray-900);
        }

        .select-list::-webkit-scrollbar-thumb {
          background: var(--bg-color-gray-700);
          border-radius: 0.625rem;
          border: 0.125rem solid var(--bg-color-gray-900);
        }

        .select-list::-webkit-scrollbar-thumb:hover {
          background: var(--bg-color-neutral-950);
        }
      </style>

      <div
        aria-expanded="false"
        aria-haspopup="listbox"
        aria-labelledby="selectedValue"
        class="block-garden-select"
        role="combobox"
        tabindex="0"
      >
        <span class="selected-text placeholder" id="selectedValue">Choose resolution</span>
        <span aria-hidden="true" class="chevron">▾</span>
      </div>

      <ul class="select-list" hidden id="selectList" role="listbox"></ul>

      <input id="valueInput" type="hidden">
    `;

    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow.appendChild(template.content.cloneNode(true));

    this.#trigger = this.#shadow.querySelector(".block-garden-select");
    this.#list = this.#shadow.querySelector("#selectList");
    this.#selected = this.#shadow.querySelector("#selectedValue");
    this.#hiddenInput = this.#shadow.querySelector("#valueInput");
  }

  connectedCallback() {
    requestAnimationFrame(() => this.#init());
  }

  #init() {
    if (this.#items.length > 0) {
      return;
    }

    if (this.querySelectorAll("block-garden-option").length === 0) {
      this.innerHTML = `
        <block-garden-option value="400">400x400</block-garden-option>
        <block-garden-option value="600">600x600</block-garden-option>
        <block-garden-option value="800">800x800</block-garden-option>
        <block-garden-option hidden="hidden" value="fullscreen">Fullscreen</block-garden-option>
      `;
    }

    // Initial render
    this.#refreshOptions();

    let activeIndex = -1;

    const openList = () => {
      this.#refreshOptions(); // Rescan options before opening
      /** @type {HTMLElement} */
      (this.#list).hidden = false;
      this.#trigger.setAttribute("aria-expanded", "true");
      this.#items[0]?.focus();
      activeIndex = 0;
    };

    const closeList = () => {
      /** @type {HTMLElement} */
      (this.#list).hidden = true;

      this.#trigger.setAttribute("aria-expanded", "false");

      /** @type {HTMLElement} */
      (this.#trigger).focus();

      activeIndex = -1;
    };

    const selectItem = (item) => {
      const value = item.dataset.value;
      const label = item.textContent.trim();

      this.#selected.textContent = label;
      this.#selected.classList.remove("placeholder");

      /** @type {HTMLInputElement} */
      (this.#hiddenInput).value = value;

      this.#items.forEach((i) => i.setAttribute("aria-selected", "false"));
      item.setAttribute("aria-selected", "true");

      closeList();

      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { value, label },
          bubbles: true,
          composed: true,
        }),
      );
    };

    // keyboard on trigger
    this.#trigger.addEventListener(
      "keydown",
      (
        /** @type {KeyboardEvent} */
        e,
      ) => {
        switch (e.key) {
          case "Enter":
          case " ":
            e.preventDefault();

            /** @type {HTMLElement} */
            (this.#list).hidden ? openList() : closeList();

            break;
          case "ArrowDown":
          case "ArrowUp":
            e.preventDefault();

            openList();

            break;
          case "Escape":
            closeList();

            break;
        }
      },
    );

    // roving tabindex for list
    this.#list.addEventListener("keydown", (e) => {
      const item =
        /** @type {HTMLElement} */
        (e.target).closest(".select-item");

      if (!item) {
        return;
      }

      e.stopPropagation();

      switch (
        /** @type {KeyboardEvent} */
        (e).key
      ) {
        case "Enter":
        case " ":
          e.preventDefault();

          selectItem(item);

          break;
        case "Escape":
          closeList();

          break;
        case "ArrowDown":
          e.preventDefault();

          activeIndex = (activeIndex + 1) % this.#items.length;

          this.#items[activeIndex].focus();

          break;
        case "ArrowUp":
          e.preventDefault();

          activeIndex =
            activeIndex === 0 ? this.#items.length - 1 : activeIndex - 1;

          this.#items[activeIndex].focus();

          break;
        case "Home":
          e.preventDefault();

          this.#items[0].focus();

          activeIndex = 0;

          break;
        case "End":
          e.preventDefault();

          this.#items[this.#items.length - 1].focus();

          activeIndex = this.#items.length - 1;

          break;
      }
    });

    // click on combobox itself
    this.#trigger.addEventListener("click", (e) => {
      e.stopPropagation();

      /** @type {HTMLElement} */
      (this.#list).hidden ? openList() : closeList();
    });

    // click inside shadowRoot list
    this.#shadow.addEventListener("click", (e) => {
      const item =
        /** @type {HTMLElement} */
        (e.target).closest(".select-item");

      if (item) {
        e.stopPropagation();

        selectItem(item);
      }
    });

    // outside click
    globalThis.document.addEventListener("click", (e) => {
      if (
        !this.contains(
          /** @type {Node} */
          (e.target),
        )
      ) {
        closeList();
      }
    });

    // value API
    Object.defineProperty(this, "value", {
      get: () =>
        /** @type {HTMLInputElement} */
        (this.#hiddenInput).value,
      set: (val) => {
        /** @type {HTMLInputElement} */
        (this.#hiddenInput).value = val;

        const item = this.#list.querySelector(`[data-value="${val}"]`);
        if (item) {
          this.#selected.textContent = item.textContent.trim();
          this.#selected.classList.remove("placeholder");
        } else {
          // fallback when items not yet rendered
          this.#selected.textContent = val;
          this.#selected.classList.remove("placeholder");
        }
      },
    });

    if (this.getAttribute("value")) {
      this.value = this.getAttribute("value");
    }
  }

  // re-scan
  #refreshOptions() {
    this.#list.innerHTML = "";
    this.#items = [];

    Array.from(this.querySelectorAll("block-garden-option")).forEach(
      (option) => {
        if (option.hasAttribute("hidden")) return; // skip hidden options
        const li = globalThis.document.createElement("li");
        li.className = "select-item";
        li.setAttribute("role", "option");
        li.tabIndex = -1;

        const value = option.getAttribute("value") || "";
        li.dataset.value = value;

        li.textContent = option.textContent.trim();

        this.#list.appendChild(li);
        this.#items.push(li);
      },
    );
  }

  static get observedAttributes() {
    return ["value"];
  }

  attributeChangedCallback(name) {
    if (name === "value") {
      this.value = this.getAttribute("value");
    }
  }
}

if (!globalThis.customElements?.get(selectTagName)) {
  globalThis.customElements.define(selectTagName, BlockGardenSelect);
}
