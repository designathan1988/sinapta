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
// Two frames at 60 Hz: happy-dom is slower than a browser, so one frame in
// the browser is about two here.
const TWO_FRAMES = 33;

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

  it("paints a 300-line block in time that grows with its length", () => {
    const line =
      'const total = items.map((item) => item.price * 2); // "sum"\n';
    // The fastest of fifteen paints: other test files, the watchers and
    // the browser share the processor in bursts, and a slow algorithm is
    // slow every time.
    const fastest = (lines: number): number => {
      const text = line.repeat(lines);
      const element = codeElement(text);
      const times = Array.from({ length: 15 }, () => {
        const started = performance.now();
        paintCode(element, { language: "typescript", text: [{ text }] });
        return performance.now() - started;
      });
      return Math.min(...times);
    };

    const half = fastest(150);
    const full = fastest(300);

    // Twice the lines take about twice the time; a paint that compares
    // every line with every other would take four times as long.
    expect(full / half).toBeLessThan(3);
    expect(full).toBeLessThan(TWO_FRAMES);
    expect(painted("code-keyword")).toHaveLength(300);
  });
});
