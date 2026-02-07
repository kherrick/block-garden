const { getShadowRoot } = await import("./getShadowRoot.mjs");

describe("getShadowRoot", () => {
  test("should find shadow root by tag name at top level", () => {
    const customElement = document.createElement("block-garden");
    customElement.attachShadow({ mode: "open" });

    document.body.appendChild(customElement);

    const shadowRoot = getShadowRoot(document, "block-garden");

    expect(shadowRoot).toBe(customElement.shadowRoot);

    document.body.removeChild(customElement);
  });

  test("should find shadow root when nested in other elements", () => {
    const container = document.createElement("div");
    const customElement = document.createElement("block-garden");

    customElement.attachShadow({ mode: "open" });
    container.appendChild(customElement);

    document.body.appendChild(container);

    const shadowRoot = getShadowRoot(document, "block-garden");

    expect(shadowRoot).toBe(customElement.shadowRoot);

    document.body.removeChild(container);
  });

  test("should search through multiple levels of nesting", () => {
    const level1 = document.createElement("div");
    const level2 = document.createElement("div");
    const customElement = document.createElement("block-garden");

    customElement.attachShadow({ mode: "open" });
    level2.appendChild(customElement);
    level1.appendChild(level2);

    document.body.appendChild(level1);

    const shadowRoot = getShadowRoot(document, "block-garden");

    expect(shadowRoot).toBe(customElement.shadowRoot);

    document.body.removeChild(level1);
  });

  test("should return null when element is not found", () => {
    const shadowRoot = getShadowRoot(document, "nonexistent-element");

    expect(shadowRoot).toBeNull();
  });

  test("should return null when element exists but has no shadow root", () => {
    const element = document.createElement("div");

    document.body.appendChild(element);

    const shadowRoot = getShadowRoot(document, "div");

    expect(shadowRoot).toBeNull();

    document.body.removeChild(element);
  });

  test("should search inside shadow DOM boundaries", () => {
    const parentElement = document.createElement("parent-component");
    parentElement.attachShadow({ mode: "open" });

    const childElement = document.createElement("block-garden");
    childElement.attachShadow({ mode: "open" });

    parentElement.shadowRoot.appendChild(childElement);

    document.body.appendChild(parentElement);

    const shadowRoot = getShadowRoot(document, "block-garden");

    expect(shadowRoot).toBe(childElement.shadowRoot);

    document.body.removeChild(parentElement);
  });

  test("should handle multiple shadow roots in the tree", () => {
    const element1 = document.createElement("component-a");
    element1.attachShadow({ mode: "open" });

    const element2 = document.createElement("block-garden");
    element2.attachShadow({ mode: "open" });

    const element3 = document.createElement("component-b");
    element3.attachShadow({ mode: "open" });

    element1.shadowRoot.appendChild(element2);
    element2.shadowRoot.appendChild(element3);

    document.body.appendChild(element1);

    const shadowRoot1 = getShadowRoot(document, "component-a");
    const shadowRoot2 = getShadowRoot(document, "block-garden");
    const shadowRoot3 = getShadowRoot(document, "component-b");

    expect(shadowRoot1).toBe(element1.shadowRoot);
    expect(shadowRoot2).toBe(element2.shadowRoot);
    expect(shadowRoot3).toBe(element3.shadowRoot);

    document.body.removeChild(element1);
  });

  test("should return first matching element", () => {
    const element1 = document.createElement("block-garden");
    element1.attachShadow({ mode: "open" });

    const element2 = document.createElement("block-garden");
    element2.attachShadow({ mode: "open" });

    document.body.appendChild(element1);
    document.body.appendChild(element2);

    const shadowRoot = getShadowRoot(document, "block-garden");

    expect(shadowRoot).toBe(element1.shadowRoot);

    document.body.removeChild(element1);
    document.body.removeChild(element2);
  });

  test("should search starting from a custom root element", () => {
    const container = document.createElement("div");
    const customElement = document.createElement("block-garden");

    customElement.attachShadow({ mode: "open" });
    container.appendChild(customElement);

    const shadowRoot = getShadowRoot(container, "block-garden");

    expect(shadowRoot).toBe(customElement.shadowRoot);
  });

  test("should handle sibling elements with and without shadow roots", () => {
    const element1 = document.createElement("div");
    const customElement = document.createElement("block-garden");

    customElement.attachShadow({ mode: "open" });
    const element3 = document.createElement("span");

    document.body.appendChild(element1);
    document.body.appendChild(customElement);
    document.body.appendChild(element3);

    const shadowRoot = getShadowRoot(document, "block-garden");

    expect(shadowRoot).toBe(customElement.shadowRoot);

    document.body.removeChild(element1);
    document.body.removeChild(customElement);
    document.body.removeChild(element3);
  });

  test("should work with different tag name cases", () => {
    const customElement = document.createElement("BLOCK-GARDEN");
    customElement.attachShadow({ mode: "open" });

    document.body.appendChild(customElement);

    const shadowRoot = getShadowRoot(document, "block-garden");

    expect(shadowRoot).toBe(customElement.shadowRoot);

    document.body.removeChild(customElement);
  });

  test("should return null for empty document", () => {
    const shadowRoot = getShadowRoot(document, "block-garden");
    expect(shadowRoot).toBeNull();
  });
});
