import { describe, expect, it } from "vitest";
import type { CodeLanguage } from "./code.schema.ts";
import { tokenize } from "./code-tokenize.ts";

// Each token as "kind:text", in order.
function kinds(language: CodeLanguage, text: string): string[] {
  return tokenize(language, text).map(
    (token) => `${token.kind}:${text.slice(token.start, token.end)}`,
  );
}

describe("tokenize", () => {
  it.each<[CodeLanguage, string, string[]]>([
    [
      "javascript",
      'const s = "a\\"b"; // done',
      [
        "keyword:const",
        "punctuation:=",
        'string:"a\\"b"',
        "punctuation:;",
        "comment:// done",
      ],
    ],
    [
      "typescript",
      "let n: number = 0x1F;",
      [
        "keyword:let",
        "punctuation::",
        "keyword:number",
        "punctuation:=",
        "number:0x1F",
        "punctuation:;",
      ],
    ],
    [
      "json",
      '{"a": true, "b": 1.5e3}',
      [
        "punctuation:{",
        'string:"a"',
        "punctuation::",
        "keyword:true",
        "punctuation:,",
        'string:"b"',
        "punctuation::",
        "number:1.5e3",
        "punctuation:}",
      ],
    ],
    [
      "python",
      "def f(x):  # note\n    return 'it\\'s'",
      [
        "keyword:def",
        "function:f",
        "punctuation:(",
        "punctuation:)",
        "punctuation::",
        "comment:# note",
        "keyword:return",
        "string:'it\\'s'",
      ],
    ],
    ["python", '"""one\ntwo"""', ['string:"""one\ntwo"""']],
    [
      "java",
      "/* c */ int x = 42;",
      [
        "comment:/* c */",
        "keyword:int",
        "punctuation:=",
        "number:42",
        "punctuation:;",
      ],
    ],
    [
      "c",
      "return sizeof(x); /* a\nb */",
      [
        "keyword:return",
        "keyword:sizeof",
        "punctuation:(",
        "punctuation:)",
        "punctuation:;",
        "comment:/* a\nb */",
      ],
    ],
    [
      "csharp",
      'var s = "x";',
      ["keyword:var", "punctuation:=", 'string:"x"', "punctuation:;"],
    ],
    [
      "go",
      "func main() {}",
      [
        "keyword:func",
        "function:main",
        "punctuation:(",
        "punctuation:)",
        "punctuation:{",
        "punctuation:}",
      ],
    ],
    [
      "rust",
      "let v = 10u32; // n",
      [
        "keyword:let",
        "punctuation:=",
        "number:10u32",
        "punctuation:;",
        "comment:// n",
      ],
    ],
    [
      "sql",
      "SELECT name FROM t -- all\nWHERE id = 'o''k'",
      [
        "keyword:SELECT",
        "keyword:FROM",
        "comment:-- all",
        "keyword:WHERE",
        "punctuation:=",
        "string:'o'",
        "string:'k'",
      ],
    ],
    [
      "shell",
      'echo "$HOME" # home',
      ["keyword:echo", 'string:"$HOME"', "comment:# home"],
    ],
    [
      "css",
      ".a { color: var(--x); } /* c */",
      [
        "punctuation:.",
        "punctuation:{",
        "punctuation::",
        "function:var",
        "punctuation:(",
        "punctuation:)",
        "punctuation:;",
        "punctuation:}",
        "comment:/* c */",
      ],
    ],
    [
      "html",
      '<a href="x">t</a><!-- c -->',
      [
        "punctuation:<",
        "keyword:a",
        "punctuation:=",
        'string:"x"',
        "punctuation:>",
        "punctuation:<",
        "punctuation:/",
        "keyword:a",
        "punctuation:>",
        "comment:<!-- c -->",
      ],
    ],
    ["markdown", "Run `npm test` now", ["string:`npm test`"]],
  ])("reads %s", (language, text, expected) => {
    expect(kinds(language, text)).toEqual(expected);
  });

  it("finds nothing in plain text", () => {
    expect(tokenize("plain", "const x = 1;")).toEqual([]);
  });

  it("ends a string that is not closed at the end of its line", () => {
    expect(kinds("javascript", "'open\nx")).toEqual(["string:'open"]);
  });

  it("does not read a number inside a name", () => {
    expect(kinds("javascript", "item2")).toEqual([]);
  });

  it("reads 300 lines in well under a frame", () => {
    const line =
      'const total = items.map((item) => item.price * 2); // "sum"\n';
    const text = line.repeat(300);

    // The fastest of five runs: other test files share the processor, and
    // a slow algorithm is slow every time.
    const times = Array.from({ length: 5 }, () => {
      const started = performance.now();
      tokenize("typescript", text);
      return performance.now() - started;
    });

    expect(Math.min(...times)).toBeLessThan(16);
    expect(tokenize("typescript", text).length).toBeGreaterThan(300);
  });
});
