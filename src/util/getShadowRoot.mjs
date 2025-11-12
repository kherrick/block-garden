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
