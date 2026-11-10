// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { parsePastedHtml } from "./pasted-html.ts";

describe("parsePastedHtml", () => {
  it("reads bold, italic, code and links as marks", () => {
    const html = `<p>a <strong>b</strong> <em>c</em> <code>d</code>
      <a href="https://example.com/x">e</a></p>`;

    expect(parsePastedHtml(html)).toEqual([
      [
        { text: "a " },
        { text: "b", marks: ["bold"] },
        { text: " " },
        { text: "c", marks: ["italic"] },
        { text: " " },
        { text: "d", marks: ["code"] },
        { text: " " },
        { text: "e", href: "https://example.com/x" },
      ],
    ]);
  });

  it("starts a line at each paragraph, list item and line break", () => {
    const html = "<h1>Title</h1><ul><li>one</li><li>two</li></ul>x<br>y";

    const lines = parsePastedHtml(html).map((line) => line[0]?.text);

    expect(lines).toEqual(["Title", "one", "two", "x", "y"]);
  });

  it("reads bold and italic written as inline styles", () => {
    const html = `<b style="font-weight:normal"><span style="font-weight:700">
      heavy</span><span style="font-style:italic">slanted</span>plain</b>`;

    expect(parsePastedHtml(html)).toEqual([
      [
        { text: "heavy", marks: ["bold"] },
        { text: "slanted", marks: ["italic"] },
        { text: "plain" },
      ],
    ]);
  });

  it("drops scripts, styles and links that are not safe", () => {
    const html = `<style>p{color:red}</style><script>alert(1)</script>
      <p><a href="javascript:alert(1)">click</a><img src="x" onerror="x()"></p>`;

    expect(parsePastedHtml(html)).toEqual([[{ text: "click" }]]);
  });

  it("keeps the lines of preformatted text", () => {
    const html = "<pre>one\n  two</pre>";

    const lines = parsePastedHtml(html).map((line) => line[0]?.text);

    expect(lines).toEqual(["one", "two"]);
  });
});
