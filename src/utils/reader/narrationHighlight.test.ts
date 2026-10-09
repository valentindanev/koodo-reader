import { test, expect } from "@jest/globals";
import { NarrationFollow } from "./narrationFollow";
import { clearNarrationHighlight, paintNarrationRange } from "./narrationHighlight";

function setup(html: string) {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = html;
  const rendition = { getDocument: () => doc };
  const locator = new NarrationFollow();
  const sequence = {};
  const paint = (text: string, index: number) => {
    clearNarrationHighlight(doc);
    const range = locator.locate(rendition, text, sequence, index);
    return range && paintNarrationRange(range, "background-color: yellow");
  };
  return { doc, paint };
}

test("highlights an entire sentence across emphasis, bold and links without damaging markup", () => {
  const html = '<p>This <em>important</em> <strong>sentence</strong> has a <a href="https://example.com">link</a>.</p>';
  const { doc, paint } = setup(html);
  const range = paint("This important sentence has a link.", 0);
  expect(range?.toString()).toBe("This important sentence has a link.");
  expect(Array.from(doc.querySelectorAll('[data-lab-narration]')).map(span => span.textContent).join(""))
    .toBe("This important sentence has a link.");
  expect(doc.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
  clearNarrationHighlight(doc);
  expect(doc.body.innerHTML).toBe(html);
});

test("preserves book whitespace while matching a normalized spoken sentence", () => {
  const { doc, paint } = setup("<p>A\n  formatted <em>sentence.</em> Next.</p>");
  const text = doc.body.textContent;
  expect(paint("A formatted sentence.", 0)?.toString()).toBe("A\n  formatted sentence.");
  expect(doc.body.textContent).toBe(text);
  expect(paint("Next.", 1)?.toString()).toBe("Next.");
  expect(doc.querySelectorAll('[data-lab-narration]')).toHaveLength(1);
});

test("tracks repeated sentences, same-sentence resume and previous-sentence navigation", () => {
  const { doc, paint } = setup("<p>Same.</p><p>Middle.</p><p>Same.</p>");
  paint("Same.", 0);
  paint("Middle.", 1);
  paint("Same.", 2);
  expect(doc.querySelectorAll("p")[2].querySelector('[data-lab-narration]')).not.toBeNull();
  paint("Same.", 2);
  expect(doc.querySelectorAll("p")[2].querySelector('[data-lab-narration]')).not.toBeNull();
  paint("Middle.", 1);
  expect(doc.querySelectorAll("p")[1].querySelector('[data-lab-narration]')).not.toBeNull();
});

test("unmatched text removes stale highlights and preserves notes and book content", () => {
  const { doc, paint } = setup('<p>First. <span data-note="saved">A note.</span></p>');
  const text = doc.body.textContent;
  paint("First.", 0);
  expect(paint("Missing.", 1)).toBeUndefined();
  expect(doc.querySelector('[data-lab-narration]')).toBeNull();
  expect(doc.querySelector('[data-note]')?.textContent).toBe("A note.");
  expect(doc.body.textContent).toBe(text);
});

test("matches long-sentence chunks whose comma and semicolon spaces were removed by the reader", () => {
  const { doc, paint } = setup("<p>At first, only a few people tried it, although others disagreed; later, more people joined.</p>");
  const original = doc.body.innerHTML;
  expect(paint("At first,only a few people tried it,although others disagreed;", 0)?.toString())
    .toBe("At first, only a few people tried it, although others disagreed;");
  expect(paint("later,more people joined.", 1)?.toString()).toBe("later, more people joined.");
  clearNarrationHighlight(doc);
  expect(doc.body.innerHTML).toBe(original);
});
