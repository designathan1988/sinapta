// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { paintCode } from "./code-highlight.ts";

// happy-dom has no CSS Custom Highlight API; these stand in for it.
class FakeHighlight extends Set<unknown> {}
class FakeStaticRange {
  readonly startContainer: Node;
  readonly startOffset: number;
  readonly endOffset: number;
  constructor(init: StaticRangeInit) {
    this.startContainer = init.startContainer;
    this.startOffset = init.startOffset;
    this.endOffset = init.endOffset;
  }
}
const registry = new Map<string, FakeHighlight>();

beforeEach(() => {
  registry.clear();
  vi.stubGlobal("Highlight", FakeHighlight);
  vi.stubGlobal("StaticRange", FakeStaticRange);
  // happy-dom gives a new CSS object on each read, so the whole object is
  // replaced.
  vi.stubGlobal("CSS", { highlights: registry });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function codeElement(text: string): HTMLElement {
  const element = document.createElement("div");
  const editable = document.createElement("div");
  editable.dataset.text = "";
  editable.append(text);
  element.append(editable);
  document.body.replaceChildren(element);
  return element;
}

function painted(name: string): string[] {
  return [...(registry.get(name) ?? [])].map((range) => {
    if (!(range instanceof FakeStaticRange)) return "";
    const { startContainer, startOffset, endOffset } = range;
    return (startContainer.textContent ?? "").slice(startOffset, endOffset);
  });
}

describe("paintCode", () => {
  it("paints keywords and strings without touching the text", () => {
    const element = codeElement('const a = "b";');
    const html = element.innerHTML;

    paintCode(element, {
      language: "javascript",
      text: [{ text: 'const a = "b";' }],
    });

    expect(painted("code-keyword")).toEqual(["const"]);
    expect(painted("code-string")).toEqual(['"b"']);
    expect(element.innerHTML).toBe(html);
  });

  it("replaces a block's earlier paint when its text changes", () => {
    const element = codeElement("let x");
    paintCode(element, { language: "javascript", text: [{ text: "let x" }] });
    element.querySelector("[data-text]")?.replaceChildren("var y");

    paintCode(element, { language: "javascript", text: [{ text: "var y" }] });

    expect(painted("code-keyword")).toEqual(["var"]);
  });

  it("paints a 300-line block within a frame", () => {
    const line =
      'const total = items.map((item) => item.price * 2); // "sum"\n';
    const text = line.repeat(300);
    const element = codeElement(text);

    // The fastest of five paints, each of new text as typing makes it:
    // other test files share the processor, and a slow algorithm is slow
    // every time.
    const times = Array.from({ length: 5 }, () => {
      const started = performance.now();
      paintCode(element, { language: "typescript", text: [{ text }] });
      return performance.now() - started;
    });

    expect(Math.min(...times)).toBeLessThan(16);
    expect(painted("code-keyword")).toHaveLength(300);
  });
});
