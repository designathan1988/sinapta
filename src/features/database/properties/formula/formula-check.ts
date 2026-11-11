// Checks a parsed formula before it runs: every function exists and gets
// the right number of arguments, every prop() names a property, and no
// formula reaches itself through the formulas it reads.
import { FUNCTIONS, SPECIAL_FORMS } from "./formula-functions.ts";
import {
  FormulaSyntaxError,
  parseFormula,
  type FormulaNode,
} from "./formula-parse.ts";
import { tokenizeFormula } from "./formula-tokenize.ts";

export interface FormulaProperty {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly config?: unknown;
}

function arityText(
  name: string,
  [min, max]: readonly [number, number],
): string {
  const noun = (count: number) => (count === 1 ? "argument" : "arguments");
  if (max === Number.POSITIVE_INFINITY) {
    return `${name} takes at least ${String(min)} ${noun(min)}.`;
  }
  if (min === max) return `${name} takes ${String(min)} ${noun(min)}.`;
  return `${name} takes ${String(min)} to ${String(max)} arguments.`;
}

// prop("Name"): the name in quotes of a property the database has.
function checkProp(
  node: FormulaNode & { kind: "call" },
  properties: readonly FormulaProperty[],
  refs: Set<string>,
): void {
  const [arg] = node.args;
  const name =
    arg?.kind === "literal" && typeof arg.value === "string"
      ? arg.value
      : undefined;
  if (name === undefined) {
    throw new FormulaSyntaxError(
      "prop takes the name of a property in quotes.",
      node.offset,
    );
  }
  if (!properties.some((property) => property.name === name)) {
    throw new FormulaSyntaxError(
      `No property is named "${name}".`,
      node.offset,
    );
  }
  refs.add(name);
}

function checkCall(
  node: FormulaNode & { kind: "call" },
  properties: readonly FormulaProperty[],
  refs: Set<string>,
): void {
  const arity = SPECIAL_FORMS[node.name] ?? FUNCTIONS[node.name]?.arity;
  if (arity === undefined) {
    throw new FormulaSyntaxError(
      `There is no function named ${node.name}.`,
      node.offset,
    );
  }
  const [min, max] = arity;
  if (node.args.length < min || node.args.length > max) {
    throw new FormulaSyntaxError(arityText(node.name, arity), node.offset);
  }
  if (node.name === "prop") checkProp(node, properties, refs);
}

// Walks the tree, checking calls and gathering the names prop() reads.
function walk(
  node: FormulaNode,
  properties: readonly FormulaProperty[],
  refs: Set<string>,
): void {
  if (node.kind === "unary") walk(node.operand, properties, refs);
  if (node.kind === "binary") {
    walk(node.left, properties, refs);
    walk(node.right, properties, refs);
  }
  if (node.kind !== "call") return;
  checkCall(node, properties, refs);
  for (const arg of node.args) walk(arg, properties, refs);
}

export function expressionOf(property: FormulaProperty): string | undefined {
  const { config } = property;
  if (
    typeof config !== "object" ||
    config === null ||
    !("expression" in config)
  ) {
    return undefined;
  }
  return typeof config.expression === "string" ? config.expression : undefined;
}

// The names another formula reads, or none when it cannot be read.
function refsOf(
  property: FormulaProperty,
  properties: readonly FormulaProperty[],
): Set<string> {
  const refs = new Set<string>();
  const tokens = tokenizeFormula(expressionOf(property) ?? "");
  if (!tokens.ok) return refs;
  try {
    walk(parseFormula(tokens.tokens), properties, refs);
  } catch {
    // A broken formula shows its own mistake where it is used.
  }
  return refs;
}

// True when following prop() from these names reaches the property.
export function reaches(
  names: ReadonlySet<string>,
  properties: readonly FormulaProperty[],
  selfId: string,
): boolean {
  const seen = new Set<string>();
  const queue = [...names];
  for (let name = queue.shift(); name !== undefined; name = queue.shift()) {
    const property = properties.find((each) => each.name === name);
    if (property === undefined || seen.has(property.id)) continue;
    if (property.id === selfId) return true;
    seen.add(property.id);
    if (property.type === "formula")
      queue.push(...refsOf(property, properties));
  }
  return false;
}

export function checkFormula(
  tree: FormulaNode,
  properties: readonly FormulaProperty[],
  selfId?: string,
): void {
  const refs = new Set<string>();
  walk(tree, properties, refs);
  if (selfId !== undefined && reaches(refs, properties, selfId)) {
    throw new FormulaSyntaxError("Circular reference.", 0);
  }
}
