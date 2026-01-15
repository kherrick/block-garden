/**
 * Locates a web component's shadow root by tag name.
 *
 * Recursively searches through the DOM including shadow DOM boundaries.
 *
 * @param {Document|Element} doc - Document or root element to search from
 * @param {string} tagName - The tag name to find (e.g., 'block-garden')
 *
 * @returns {ShadowRoot|null} The shadow root of the matching element, or null if not found
 *
 * @example
 * const shadowRoot = getShadowRoot(document, 'block-garden');
 * const canvas = shadowRoot?.getElementById('canvas');
 */
export function getShadowRoot(doc, tagName) {
  const findElement = (e, n) => {
    if (!e) {
      return null;
    }

    if (e.tagName === n.toUpperCase() && e.shadowRoot) {
      return e;
    }

    const children = [...(e.children || [])];

    if (e.shadowRoot) {
      children.push(e.shadowRoot);
    }

    return children.map((c) => findElement(c, n)).find(Boolean) || null;
  };

  const element = findElement(doc, tagName);

  return element ? element.shadowRoot : null;
}
