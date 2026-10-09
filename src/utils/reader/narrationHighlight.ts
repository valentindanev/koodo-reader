export const clearNarrationHighlight = (doc: Document) => {
  doc.querySelectorAll('span[data-lab-narration="true"]').forEach(span => {
    const parent = span.parentNode;
    if (parent) {
      parent.replaceChild(doc.createTextNode(span.textContent || ""), span);
      parent.normalize();
    }
  });
};

// Wrap only the matched portions of individual text nodes. Inline elements,
// links and the original text remain intact, even across formatting boundaries.
export const paintNarrationRange = (range: Range, style: string): Range | undefined => {
  const doc = range.startContainer.ownerDocument;
  if (!doc) return;
  const walker = doc.createTreeWalker(doc.body, 4);
  const parts: { node: Text; start: number; end: number }[] = [];
  let node = walker.nextNode();
  while (node) {
    if (range.intersectsNode(node)) {
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : (node.textContent || "").length;
      if (end > start) parts.push({ node: node as Text, start, end });
    }
    node = walker.nextNode();
  }
  const spans: HTMLSpanElement[] = [];
  parts.forEach(({ node, start, end }) => {
    const value = node.data;
    const span = doc.createElement("span");
    span.dataset.labNarration = "true";
    span.dataset.highlight = "true";
    span.className = "kookit-highlight-text";
    span.style.cssText = style;
    span.textContent = value.slice(start, end);
    const fragment = doc.createDocumentFragment();
    if (start) fragment.appendChild(doc.createTextNode(value.slice(0, start)));
    fragment.appendChild(span);
    if (end < value.length) fragment.appendChild(doc.createTextNode(value.slice(end)));
    node.parentNode?.replaceChild(fragment, node);
    spans.push(span);
  });
  if (!spans.length) return;
  const highlighted = doc.createRange();
  highlighted.setStart(spans[0].firstChild!, 0);
  const last = spans[spans.length - 1].firstChild!;
  highlighted.setEnd(last, last.textContent!.length);
  return highlighted;
};
