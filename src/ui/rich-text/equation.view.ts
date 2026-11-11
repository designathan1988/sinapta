// Draws TeX as MathML. The tree comes from parseTex; each node becomes one
// MathML element through lit's mathml tag, so no markup is ever parsed
// from strings. Source that does not parse is shown as written, marked as
// an error.
import { html, mathml, nothing, render, type TemplateResult } from "lit-html";
import { LIMIT_FUNCTIONS, parseTex, type MathNode } from "../../model/index.ts";

export type MathDisplay = "block" | "inline";

type MathTemplate = TemplateResult<3>;
type Leaf = Extract<MathNode, { text: string }>;
type Structure = Exclude<MathNode, Leaf>;
type Scripts = Extract<MathNode, { kind: "scripts" }>;

function leafNode(node: Leaf, display: MathDisplay): MathTemplate {
  switch (node.kind) {
    case "identifier":
      return mathml`<mi mathvariant=${node.isFunction === true ? "normal" : nothing}>${node.text}</mi>`;
    case "number":
      return mathml`<mn>${node.text}</mn>`;
    case "operator": {
      const isLarge = node.isLarge === true && display === "block";
      return mathml`<mo largeop=${isLarge ? "true" : nothing}>${node.text}</mo>`;
    }
    case "text":
      return mathml`<mtext>${node.text}</mtext>`;
    case "error":
      return mathml`<merror><mtext>${node.text}</mtext></merror>`;
  }
}

// A large operator or a name like lim takes its limits under and over it
// in a block equation, and beside it inline.
function hasLimits(base: MathNode, display: MathDisplay): boolean {
  if (display !== "block") return false;
  if (base.kind === "operator") return base.isLarge === true;
  return base.kind === "identifier" && LIMIT_FUNCTIONS.has(base.text);
}

function scriptsNode(node: Scripts, display: MathDisplay): MathTemplate {
  const base = mathNode(node.base, display);
  const sub = node.sub && mathNode(node.sub, display);
  const sup = node.sup && mathNode(node.sup, display);
  const isLimits = hasLimits(node.base, display);
  if (sub !== undefined && sup !== undefined) {
    return isLimits
      ? mathml`<munderover>${base}${sub}${sup}</munderover>`
      : mathml`<msubsup>${base}${sub}${sup}</msubsup>`;
  }
  if (sub !== undefined) {
    return isLimits
      ? mathml`<munder>${base}${sub}</munder>`
      : mathml`<msub>${base}${sub}</msub>`;
  }
  const over = sup ?? mathml`<mrow></mrow>`;
  return isLimits
    ? mathml`<mover>${base}${over}</mover>`
    : mathml`<msup>${base}${over}</msup>`;
}

function fence(text: string): MathTemplate | typeof nothing {
  return text === "" ? nothing : mathml`<mo stretchy="true">${text}</mo>`;
}

function structureNode(node: Structure, display: MathDisplay): MathTemplate {
  const child = (each: MathNode): MathTemplate => mathNode(each, display);
  switch (node.kind) {
    case "row":
      return mathml`<mrow>${node.children.map(child)}</mrow>`;
    case "fraction":
      return mathml`<mfrac>${child(node.numerator)}${child(node.denominator)}</mfrac>`;
    case "root":
      return node.index === undefined
        ? mathml`<msqrt>${child(node.base)}</msqrt>`
        : mathml`<mroot>${child(node.base)}${child(node.index)}</mroot>`;
    case "scripts":
      return scriptsNode(node, display);
    case "fenced":
      return mathml`<mrow>${fence(node.open)}${child(node.body)}${fence(node.close)}</mrow>`;
    case "matrix":
      return mathml`<mtable>${node.rows.map(
        (cells) =>
          mathml`<mtr>${cells.map((cell) => mathml`<mtd>${child(cell)}</mtd>`)}</mtr>`,
      )}</mtable>`;
  }
}

function mathNode(node: MathNode, display: MathDisplay): MathTemplate {
  return "text" in node
    ? leafNode(node, display)
    : structureNode(node, display);
}

export function renderMath(
  source: string,
  display: MathDisplay,
): TemplateResult {
  const result = parseTex(source);
  const content = result.ok
    ? mathNode(result.tree, display)
    : mathml`<merror><mtext>${source}</mtext></merror>`;
  return html`<math display=${display}>${content}</math>`;
}

// An inline equation inside editable text: its source stays as the
// element's own text, which the caret counts, and the drawing lives in a
// shadow root, which it does not.
export function renderEquationInto(host: HTMLElement, source: string): void {
  const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  render(renderMath(source, "inline"), root);
}
