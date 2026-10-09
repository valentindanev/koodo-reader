import { NarrationFollow } from "./narrationFollow";
import { jest, test, expect } from "@jest/globals";

function setup(html: string, rects: Record<string, number>, scrollTop = 0) {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = html;
  const viewport = { clientHeight: 900, scrollHeight: 5000, scrollTop, scrollTo: jest.fn() };
  jest.spyOn(doc, "createRange").mockImplementation(() => {
    let start: Text;
    let end: Text;
    let first = 0;
    let last = 0;
    return {
      setStart(node: Text, offset: number) { start = node; first = offset; },
      setEnd(node: Text, offset: number) { end = node; last = offset; },
      getClientRects() {
        const label = start === end ? start.data.slice(first, last) : start.parentElement!.textContent!;
        return [{ top: rects[label] ?? 0, height: 24 }];
      },
    } as unknown as Range;
  });
  return { rendition: { getDocument: () => doc, element: viewport }, viewport };
}

test("leaves narration above the lower-third anchor still; moves gently once below it", () => {
  const { rendition, viewport } = setup("<p>First.</p><p>Second.</p>", { "First.": 450, "Second.": 630 });
  const follow = new NarrationFollow();
  const sequence = {};
  follow.follow(rendition, "First.", sequence, 0);
  expect(viewport.scrollTo).not.toHaveBeenCalled();
  follow.follow(rendition, "Second.", sequence, 1);
  expect(viewport.scrollTo).toHaveBeenCalledWith({ top: 30, behavior: "smooth" });
});

test("starts from the existing scroll position, not the chapter top", () => {
  const { rendition, viewport } = setup("<p>Start here.</p>", { "Start here.": 1670 }, 1000);
  new NarrationFollow().follow(rendition, "Start here.", {}, 0);
  expect(viewport.scrollTo).toHaveBeenCalledWith({ top: 1070, behavior: "smooth" });
});

test("locates sentences spanning inline formatting and collapsed whitespace", () => {
  const { rendition, viewport } = setup("<p>Some <em>formatted</em>\n text.</p>", { "Some formatted\n text.": 650 });
  new NarrationFollow().follow(rendition, "Some formatted text.", {}, 0);
  expect(viewport.scrollTo).toHaveBeenCalledWith({ top: 50, behavior: "smooth" });
});

test("does not jump back for a repeated sequential sentence and clamps at the bottom", () => {
  const { rendition, viewport } = setup("<p>Again.</p><p>Middle.</p><p>Again.</p>", { "Again.": 4900, "Middle.": 300 });
  const follow = new NarrationFollow();
  const sequence = {};
  follow.follow(rendition, "Middle.", sequence, 1);
  follow.follow(rendition, "Again.", sequence, 2);
  expect(viewport.scrollTo).toHaveBeenLastCalledWith({ top: 4100, behavior: "smooth" });
});

test("missing text causes no movement", () => {
  const { rendition, viewport } = setup("<p>Present.</p>", {});
  new NarrationFollow().follow(rendition, "Absent.", {}, 0);
  expect(viewport.scrollTo).not.toHaveBeenCalled();
});
