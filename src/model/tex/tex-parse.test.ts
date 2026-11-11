import { describe, expect, it } from "vitest";
import { parseTex } from "./tex-parse.ts";
import type { MathNode } from "./tex-tree.ts";

function treeOf(source: string): MathNode {
  const result = parseTex(source);
  if (!result.ok)
    throw new Error(`${result.error} at ${String(result.offset)}`);
  return result.tree;
}

// The tree as a short nested form, for readable expectations.
function shape(node: MathNode): unknown {
  if ("text" in node) return `${node.kind}:${node.text}`;
  switch (node.kind) {
    case "row":
      return node.children.map(shape);
    case "fraction":
      return { frac: [shape(node.numerator), shape(node.denominator)] };
    case "root":
      return { root: shape(node.base), index: node.index && shape(node.index) };
    case "scripts":
      return scriptsShape(node);
    case "fenced":
      return { fence: `${node.open}${node.close}`, body: shape(node.body) };
    case "matrix":
      return { matrix: node.rows.map((cells) => cells.map(shape)) };
  }
}

function scriptsShape(node: Extract<MathNode, { kind: "scripts" }>) {
  return {
    base: shape(node.base),
    below: node.sub && shape(node.sub),
    above: node.sup && shape(node.sup),
  };
}

describe("parseTex", () => {
  it("reads a fraction", () => {
    expect(shape(treeOf("\\frac{a}{b}"))).toEqual([
      { frac: [["identifier:a"], ["identifier:b"]] },
    ]);
  });

  it("reads a subscript and a superscript on one base", () => {
    expect(shape(treeOf("x^2_i"))).toEqual([
      { base: "identifier:x", below: "identifier:i", above: "number:2" },
    ]);
  });

  it("reads square roots with and without an index", () => {
    expect(shape(treeOf("\\sqrt{x}\\sqrt[3]{y}"))).toEqual([
      { root: ["identifier:x"], index: undefined },
      { root: ["identifier:y"], index: ["number:3"] },
    ]);
  });

  it("reads Greek letters, big operators, relations and text", () => {
    expect(shape(treeOf("\\sum_{i=1}^n \\alpha \\leq \\text{max}"))).toEqual([
      {
        base: "operator:∑",
        below: ["identifier:i", "operator:=", "number:1"],
        above: "identifier:n",
      },
      "identifier:α",
      "operator:≤",
      "text:max",
    ]);
  });

  it("reads stretchy brackets and matrices", () => {
    expect(
      shape(
        treeOf(
          "\\left( \\begin{matrix} a & b \\\\ c & d \\end{matrix} \\right)",
        ),
      ),
    ).toEqual([
      {
        fence: "()",
        body: [
          {
            matrix: [
              [["identifier:a"], ["identifier:b"]],
              [["identifier:c"], ["identifier:d"]],
            ],
          },
        ],
      },
    ]);
  });

  it("keeps an unknown command as an error piece and goes on", () => {
    expect(shape(treeOf("\\nope + 1"))).toEqual([
      "error:\\nope",
      "operator:+",
      "number:1",
    ]);
  });

  it("reports where an unclosed brace opens", () => {
    expect(parseTex("a + \\frac{1}{2")).toEqual({
      ok: false,
      error: "unclosed-brace",
      offset: 12,
    });
  });

  it("reports a \\left without its \\right", () => {
    expect(parseTex("\\left( x")).toMatchObject({
      ok: false,
      error: "missing-right",
    });
  });
});
