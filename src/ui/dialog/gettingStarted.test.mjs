import { jest } from "@jest/globals";

// Mock dependencies BEFORE importing the module
jest.unstable_mockModule("../../core/systems/persistence.mjs", () => ({
  getPersistedValue: jest.fn(() => Promise.resolve(false)),
  persistValue: jest.fn(() => Promise.resolve()),
}));

// Dynamic imports are required after unstable_mockModule
const { GettingStartedDialog } = await import("./gettingStarted.mjs");
const { persistValue } = await import("../../core/systems/persistence.mjs");

describe("GettingStartedDialog", () => {
  let doc;
  let shadow;
  let dialogInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Basic DOM mocks
    doc = {
      createElement: jest.fn((tag) => {
        // Simple mock element
        return {
          style: {},
          showModal: jest.fn(),
          close: jest.fn(),
          remove: jest.fn(),
          prepend: jest.fn(),
          querySelector: jest.fn(),
          addEventListener: jest.fn(),
          set innerHTML(val) {
            this._innerHTML = val;
          },
          get innerHTML() {
            return this._innerHTML;
          },
        };
      }),
    };

    shadow = {
      append: jest.fn(),
      getElementById: jest.fn(),
    };

    dialogInstance = new GettingStartedDialog(doc, shadow);
  });

  describe("parseMarkdown", () => {
    it('should parse "Included Game Saves" section correctly', () => {
      const readmeContent = `
        ## Features
        - Feature 1

        ## Quick Start
        - Key: Value

        ### Included Game Saves
        Get started by clicking one of the saved games below:

        ### [The Garden](link)
        [![The Garden](image.png)](link)
      `;

      const html = dialogInstance.parseMarkdown(readmeContent);

      // H3 inside valid section -> H4
      expect(html).toContain("<h4>Included Game Saves</h4>");
      expect(html).toContain(
        "<p>Get started by clicking one of the saved games below:</p>",
      );

      // Linked H3
      expect(html).toContain(
        '<h4><a href="link" target="_self">The Garden</a></h4>',
      );

      // Image link
      expect(html).toContain(
        '<a href="link" target="_self"><img src="image.png" alt="The Garden" loading="lazy" /></a>',
      );
    });
  });

  describe("close", () => {
    it('should persist "seen" value when dialog is shown', () => {
      // Track all created elements
      const createdElements = [];

      doc.createElement = jest.fn((tag) => {
        const element = {
          style: {},
          showModal: jest.fn(),
          close: jest.fn(),
          remove: jest.fn(),
          prepend: jest.fn(),
          querySelector: jest.fn(),
          addEventListener: jest.fn(),
          scrollTop: 0,
          set innerHTML(val) {
            this._innerHTML = val;
          },
          get innerHTML() {
            return this._innerHTML;
          },
        };

        createdElements.push({ tag, element });

        return element;
      });

      dialogInstance.createDialog("test content");

      // Get the dialog element (first one created)
      const dialogElement = createdElements.find(
        (e) => e.tag === "dialog",
      )?.element;

      expect(dialogElement).toBeDefined();

      // Call show() which should trigger persistValue
      dialogInstance.show();

      expect(persistValue).toHaveBeenCalledWith(
        "config",
        "gettingStartedSeen",
        true,
      );

      expect(dialogElement.showModal).toHaveBeenCalled();

      // Verify close listener cleans up without persisting again
      const closeCall = dialogElement.addEventListener.mock.calls.find(
        (call) => call[0] === "close",
      );
      const closeListener = closeCall[1];

      closeListener();

      expect(dialogElement.remove).toHaveBeenCalled();
      expect(dialogInstance.dialog).toBeNull();
    });
  });
});
