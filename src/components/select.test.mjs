/**
 * @jest-environment jsdom
 */
import { jest } from "@jest/globals";
import { selectTagName } from "./select.mjs";

describe("block-garden-select", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("renders trigger and hidden list in shadow DOM", async () => {
    const el = document.createElement(selectTagName);
    document.body.appendChild(el);

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const shadow = el.shadowRoot;
    expect(shadow).not.toBeNull();

    const trigger = shadow.querySelector(".block-garden-select");
    expect(trigger).not.toBeNull();

    const list = shadow.querySelector("#selectList");
    expect(list).not.toBeNull();
    expect(list.hasAttribute("hidden")).toBe(true);

    const hiddenInput = shadow.querySelector("#valueInput");
    expect(hiddenInput).not.toBeNull();
  });

  test("initializes with default options when none provided", async () => {
    const el = document.createElement(selectTagName);
    document.body.appendChild(el);

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const shadow = el.shadowRoot;
    const list = shadow.querySelectorAll(".select-item");
    expect(list.length).toBe(3);
  });

  test("changing value updates display and emits change event", async () => {
    const el = document.createElement(selectTagName);
    document.body.appendChild(el);

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    // Attach listener BEFORE interactions
    const changeHandler = jest.fn();
    el.addEventListener("change", changeHandler);

    const shadow = el.shadowRoot;
    const trigger = shadow.querySelector(".block-garden-select");

    // Open list
    trigger.click();

    // Wait for list to open and focus
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Query items AFTER opening since openList() refreshes the DOM
    const items = Array.from(shadow.querySelectorAll(".select-item"));
    expect(items.length).toBe(3);

    // Find first option and click it (400x400)
    const first = items[0];
    expect(first.dataset.value).toBe("400");
    first.click();

    // Wait for event dispatch and list close
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Expect value updated
    const hiddenInput = shadow.querySelector("#valueInput");
    expect(hiddenInput.value).toBe("400");

    const selected = shadow.querySelector("#selectedValue");
    expect(selected.textContent.trim()).toBe("400x400");
    expect(selected.classList.contains("placeholder")).toBe(false);

    // Verify change event
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail).toEqual({
      value: "400",
      label: "400x400",
    });
  });

  test("value property reflects and sets programmatically", async () => {
    const el = document.createElement(selectTagName);
    document.body.appendChild(el);

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    // Set value via property (triggers setter)
    el.value = "800";

    // Verify reflection
    const shadow = el.shadowRoot;
    const hiddenInput = shadow.querySelector("#valueInput");
    expect(hiddenInput.value).toBe("800");

    const selected = shadow.querySelector("#selectedValue");
    expect(selected.textContent.trim()).toBe("800x800");
    expect(selected.classList.contains("placeholder")).toBe(false);

    // Test attribute change callback path
    el.setAttribute("value", "fullscreen");

    expect(hiddenInput.value).toBe("fullscreen");
    expect(selected.textContent.trim()).toBe("fullscreen");
  });

  test("renders custom light DOM options", async () => {
    const el = document.createElement(selectTagName);
    el.innerHTML = `
            <block-garden-option value="Fullscreen">Fullscreen</block-garden-option>
            <block-garden-option value="800">800x800</block-garden-option>
        `;
    document.body.appendChild(el);

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    const shadow = el.shadowRoot;
    const items = shadow.querySelectorAll(".select-item");

    expect(items.length).toBe(2);
    expect(items[0].dataset.value).toBe("Fullscreen");
    expect(items[0].textContent.trim()).toBe("Fullscreen");
    expect(items[1].dataset.value).toBe("800");
    expect(items[1].textContent.trim()).toBe("800x800");
  });
});
