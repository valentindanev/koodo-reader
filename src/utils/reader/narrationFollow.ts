// Kookit's continuous reader scrolls its outer element, while text ranges are
// measured inside the chapter iframe (in chapter coordinates).
export class NarrationFollow {
  private document?: Document;
  private sequence?: unknown;
  private index = -1;
  private end = 0;

  follow(rendition: any, text: string, sequence: unknown, index: number) {
    const doc: Document | null = rendition.getDocument?.();
    const viewport: HTMLElement | undefined = rendition.element;
    if (!doc?.body || !viewport?.clientHeight || !text.trim()) return;
    const walker = doc.createTreeWalker(doc.body, 4);
    const nodes: { node: Text; start: number; end: number }[] = [];
    let content = "";
    let current = walker.nextNode();
    while (current) {
      const parent = current.parentElement;
      if (parent && !parent.closest("script, style, noscript")) {
        const value = current.textContent || "";
        nodes.push({ node: current as Text, start: content.length, end: content.length + value.length });
        content += value;
      }
      current = walker.nextNode();
    }
    // Preserve original character offsets while collapsing whitespace, so inline
    // markup and line breaks do not prevent locating the spoken sentence.
    const offsets: number[] = [];
    let normalized = "";
    for (let i = 0; i < content.length; i++) {
      const char = /\s/.test(content[i]) ? " " : content[i];
      if (char === " " && normalized.endsWith(" ")) continue;
      normalized += char;
      offsets.push(i);
    }
    const target = text.replace(/\s+/g, " ").trim();
    const sequential = this.document === doc && this.sequence === sequence && index === this.index + 1;
    let match = normalized.indexOf(target, sequential ? this.end : 0);
    if (match < 0) return;
    const makeRange = (position: number) => {
      const start = offsets[position];
      const end = offsets[position + target.length - 1] + 1;
      const first = nodes.find(item => item.start <= start && item.end > start);
      const last = nodes.find(item => item.start < end && item.end >= end);
      if (!first || !last) return;
      const range = doc.createRange();
      range.setStart(first.node, start - first.start);
      range.setEnd(last.node, end - last.start);
      return range;
    };
    let range = makeRange(match);
    if (!range) return;
    // Starting/resuming anywhere: choose the occurrence closest to the current
    // viewport, rather than jumping to an earlier repeated sentence.
    if (!sequential) {
      let distance = Infinity;
      for (let candidate = match; candidate >= 0; candidate = normalized.indexOf(target, candidate + target.length)) {
        const candidateRange = makeRange(candidate);
        const rect = candidateRange?.getClientRects()[0];
        if (!rect || !rect.height) continue;
        const top = rect.top - viewport.scrollTop;
        const candidateDistance = top < 0 ? -top : Math.max(0, top - viewport.clientHeight);
        if (candidateDistance < distance) {
          distance = candidateDistance;
          match = candidate;
          range = candidateRange!;
        }
      }
    }
    this.document = doc;
    this.sequence = sequence;
    this.index = index;
    this.end = match + target.length;
    const rect = range.getClientRects()[0];
    if (!rect?.height) return;
    const anchor = viewport.clientHeight * 2 / 3;
    const delta = rect.top - viewport.scrollTop - anchor;
    if (delta > 1) {
      viewport.scrollTo({ top: Math.min(viewport.scrollTop + delta, viewport.scrollHeight - viewport.clientHeight), behavior: "smooth" });
    }
  }
}
