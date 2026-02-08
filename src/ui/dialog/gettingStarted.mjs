import {
  getPersistedValue,
  persistValue,
} from "../../core/systems/persistence.mjs";

import { clearUrlParams } from "../../utils/urlParams.mjs";

/** @typedef {import('../../core/systems/game/state.mjs').BlockGardenGlobalThis} BlockGardenGlobalThis */

export class GettingStartedDialog {
  /**
   * @param {Document} doc
   * @param {ShadowRoot} shadow
   * @param {BlockGardenGlobalThis} gThis
   */
  constructor(doc, shadow, gThis) {
    this.doc = doc;
    this.shadow = shadow;
    this.gThis = gThis;
    this.dialog = null;
  }

  async init() {
    // Check URL parameter for gettingStarted
    const gettingStartedParam = this.getGettingStartedUrlParam();
    if (gettingStartedParam === "false") {
      // Mark as seen and bypass dialog
      await persistValue("config", "gettingStartedSeen", true);

      clearUrlParams(this.gThis);

      return;
    }

    // If gettingStarted param is "true", always show the dialog
    if (gettingStartedParam === "true") {
      const content = await this.fetchAndParseReadme();
      if (content) {
        this.createDialog(content);

        this.show();
      }

      return;
    }

    const seen = await getPersistedValue("config", "gettingStartedSeen", false);
    if (seen) {
      if (this.gThis) {
        clearUrlParams(this.gThis);
      }

      return;
    }

    const content = await this.fetchAndParseReadme();
    if (content) {
      this.createDialog(content);

      this.show();
    }
  }

  getGettingStartedUrlParam() {
    try {
      if (!this.gThis || !this.gThis.location) {
        return null;
      }

      const searchParams = new this.gThis.URLSearchParams(
        this.gThis.location.search,
      );

      return searchParams.get("gettingStarted");
    } catch (error) {
      console.warn("Failed to parse gettingStarted URL param:", error);
      return null;
    }
  }

  async fetchAndParseReadme() {
    try {
      const response = await fetch("README.md");
      const text = await response.text();

      return this.parseMarkdown(text);
    } catch (e) {
      console.warn("Failed to fetch README.md for Getting Started dialog", e);

      return null;
    }
  }

  /**
   * @param {string} md
   *
   * @returns {string}
   */
  parseMarkdown(md) {
    const lines = md.split("\n");

    let html = "";
    let inSection = false;
    let currentListType = null; // 'ul' or null

    const targetSections = ["Quick Start"];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for headers (H2 only)
      if (line.startsWith("## ")) {
        const headerText = line
          .replace(/^##+\s*/, "")
          .split("include")[0]
          .trim();

        if (targetSections.some((s) => headerText.includes(s))) {
          inSection = true;
          if (currentListType) {
            html += `</${currentListType}>`;

            currentListType = null;
          }

          html += `<h3>${headerText}</h3>`;
        } else {
          inSection = false;

          if (currentListType) {
            html += `</${currentListType}>`;

            currentListType = null;
          }
        }

        continue;
      }

      if (!inSection) {
        continue;
      }

      // Handle lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (!currentListType) {
          html += "<ul>";

          currentListType = "ul";
        }

        const listItemContent = this.formatInlineStyles(line.substring(2));

        html += `<li>${listItemContent}</li>`;
      } else if (line.length > 0) {
        // Close list if we hit non-list line (unless it's indented, which we're ignoring for simplicity here mostly)
        if (currentListType && !line.startsWith("  ")) {
          html += `</${currentListType}>`;

          currentListType = null;
        }

        if (line.startsWith("###")) {
          // Sub-headers as h4
          const subHeader = line.replace(/^###+\s*/, "").trim();

          html += `<h4>${this.formatInlineStyles(subHeader)}</h4>`;
        } else {
          // Basic paragraph or text
          if (!currentListType) {
            // Don't add P inside UL
            html += `<p>${this.formatInlineStyles(line)}</p>`;
          }
        }
      }
    }

    if (currentListType) {
      html += `</${currentListType}>`;
    }

    return html;
  }

  /**
   * Simple formatter for bold and code blocks
   *
   * @param {string} text
   */
  formatInlineStyles(text) {
    let formatted = text;

    // Images ![alt](src)
    formatted = formatted.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" loading="lazy" />',
    );

    // Links [text](url)
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_self">$1</a>',
    );

    // Bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Code with double backticks ``text`` (must come before single backticks)
    formatted = formatted.replace(/``(.*?)``/g, "<code>$1</code>");
    // Code with single backticks `text`
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

    return formatted;
  }

  /**
   * @param {string} content
   */
  createDialog(content) {
    const dialog = this.doc.createElement("dialog");
    dialog.style.cssText = `
      background: var(--bg-color-gray-50);
      border-radius: 0.5rem;
      border: 0.125rem solid var(--bg-color-gray-900);
      color: var(--bg-color-gray-900);
      font-family: monospace;
      line-height: 1.5;
      max-height: 95vh;
      max-width: 40rem;
      overflow-y: auto;
      padding: 1.5rem;
      z-index: 10000;
    `;

    dialog.innerHTML = `
      <div style="align-items: center; display: flex; justify-content: space-between; margin-bottom: 1rem;">
        <h2 style="margin: 0;">Block Garden</h2>
        <button id="closeGettingStarted" autofocus style="
          background: var(--bg-color-red-500);
          border-radius: 0.25rem;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.3125rem 0.625rem;
        ">&times;</button>
      </div>
      <div class="getting-started-content">
        <p>
          Start by exploring your immediate surroundings to understand the layout
          of the environment.
          <ul>
            <li>Gather seeds and look for good spots to place them.</li>
            <li>Use the Settings menu to adjust game options.</li>
            <li>Different plants grow at different rates.</li>
          </ul>
        </p>
        <p style="width: 100%; text-align: center; margin: 2rem 0;"><strong><u>Close this dialog to continue or read more below.</u></strong></p>
        ${content}
      </div>
    `;

    dialog.addEventListener("close", () => {
      dialog.remove();

      this.dialog = null;
    });

    // Add styles for the content
    const style = this.doc.createElement("style");
    style.textContent = `
      .getting-started-content h3 { margin-top: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--bg-color-gray-500); padding-bottom: 0.25rem; }
      .getting-started-content h4 { margin-top: 0.75rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--bg-color-gray-500); padding-top: 0.25rem; }
      .getting-started-content ul { padding-left: 1.5rem; margin: 0.5rem 0; }
      .getting-started-content li { margin-bottom: 0.25rem; }
      .getting-started-content code { background: var(--bg-color-gray-300); padding: 0.1rem 0.3rem; border-radius: 0.1875rem; }
      .getting-started-content p { margin: 0.5rem 0; }
      .getting-started-content img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; display: block; }
      .getting-started-content a { color: var(--bg-color-green-600); text-decoration: none; }
      .getting-started-content a:hover { text-decoration: underline; }
    `;

    dialog.prepend(style);

    this.shadow.append(dialog);
    this.dialog = dialog;

    const closeBtn = dialog.querySelector("#closeGettingStarted");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    // Wait for images to load and then scroll to top
    this.ensureScrollToTopAfterImagesLoad(dialog);
  }

  /**
   * @param {HTMLDialogElement} dialog
   */
  ensureScrollToTopAfterImagesLoad(dialog) {
    if (!dialog.querySelectorAll) {
      // Mock or incomplete element
      return;
    }

    const images = dialog.querySelectorAll("img");
    if (images.length === 0) {
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const onImageLoad = () => {
      loadedCount++;

      if (loadedCount === totalImages) {
        dialog.scrollTop = 0;
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        // Image already loaded (cached)
        loadedCount++;
      } else {
        img.addEventListener("load", onImageLoad);

        // Treat errors same as loads
        img.addEventListener("error", onImageLoad);
      }
    });

    // If all images were already loaded
    if (loadedCount === totalImages) {
      dialog.scrollTop = 0;
    }
  }

  show() {
    if (this.dialog) {
      this.dialog.scrollTop = 0;

      persistValue("config", "gettingStartedSeen", true);

      if (this.gThis) {
        clearUrlParams(this.gThis);
      }

      this.dialog.showModal();
    }
  }

  close() {
    if (this.dialog) {
      this.dialog.close();
    }
  }
}

/**
 * @param {Document} doc
 * @param {ShadowRoot} shadow
 * @param {BlockGardenGlobalThis} gThis
 */
export async function showGettingStartedDialog(doc, shadow, gThis) {
  const dialog = new GettingStartedDialog(doc, shadow, gThis);

  await dialog.init();
}
