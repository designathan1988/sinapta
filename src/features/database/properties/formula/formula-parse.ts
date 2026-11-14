// Reads a formula's tokens into a tree, by operator precedence (a Pratt
// parser): ^ before * / %, before + -, before comparisons, before && and
// ||. A method call such as prop("Tags").length() is the same as
// length(prop("Tags")).
import type { FormulaToken } from "./formula-tokenize.ts";
import type { FormulaValue } from "./formula-value.ts";

export type FormulaNode =
  | {
      readonly kind: "literal";
      readonly value: FormulaValue;
      readonly offset: number;
    }
  | { readonly kind: "name"; readonly name: string; readonly offset: number }
  | {
      readonly kind: "call";
      readonly name: string;
      readonly args: readonly FormulaNode[];
      readonly offset: number;
    }
  | {
      readonly kind: "unary";
      readonly op: string;
      readonly operand: FormulaNode;
      readonly offset: number;
    }
  | {
      readonly kind: "binary";
      readonly op: string;
      readonly left: FormulaNode;
      readonly right: FormulaNode;
      readonly offset: number;
    };

// A mistake in the formula's text, at an offset.
export class FormulaSyntaxError extends Error {
  readonly offset: number;

  constructor(message: string, offset: number) {
    super(message);
    this.offset = offset;
  }
}

// How tightly each operator holds its operands; ^ groups to the right.
const BINDING: Readonly<Record<string, number>> = {
  "||": 2,
  "&&": 3,
  "==": 4,
  "!=": 4,
  "<": 5,
  "<=": 5,
  ">": 5,
  ">=": 5,
  "+": 6,
  "-": 6,
  "*": 7,
  "/": 7,
  "%": 7,
  "^": 9,
};
const PREFIX_BINDING = 8;
const METHOD_BINDING = 10;

interface Cursor {
  readonly tokens: readonly FormulaToken[];
  index: number;
}

function peek(cursor: Cursor): FormulaToken {
  return (
    cursor.tokens[cursor.index] ??
    cursor.tokens[cursor.tokens.length - 1] ?? { kind: "end", offset: 0 }
  );
}

function next(cursor: Cursor): FormulaToken {
  const token = peek(cursor);
  cursor.index += 1;
  return token;
}

function isOp(token: FormulaToken, value: string): boolean {
  return token.kind === "op" && token.value === value;
}

function expect(cursor: Cursor, value: string): void {
  const token = next(cursor);
  if (!isOp(token, value)) {
    throw new FormulaSyntaxError(`Expected "${value}" here.`, token.offset);
  }
}

function parseArguments(cursor: Cursor): FormulaNode[] {
  expect(cursor, "(");
  return parseItems(cursor, ")");
}

// The values up to the closing bracket, separated by commas.
function parseItems(cursor: Cursor, close: string): FormulaNode[] {
  const args: FormulaNode[] = [];
  if (isOp(peek(cursor), close)) {
    next(cursor);
    return args;
  }
  for (;;) {
    args.push(parseExpression(cursor, 0));
    const token = next(cursor);
    if (isOp(token, close)) return args;
    if (!isOp(token, ",")) {
      throw new FormulaSyntaxError(
        `Expected "," or "${close}" here.`,
        token.offset,
      );
    }
  }
}

function parseName(
  cursor: Cursor,
  token: FormulaToken & { kind: "name" },
): FormulaNode {
  const { value: name, offset } = token;
  if (name === "true" || name === "false") {
    return { kind: "literal", value: name === "true", offset };
  }
  if (!isOp(peek(cursor), "(")) return { kind: "name", name, offset };
  return { kind: "call", name, args: parseArguments(cursor), offset };
}

function parsePrefix(cursor: Cursor): FormulaNode {
  const token = next(cursor);
  switch (token.kind) {
    case "number":
    case "string":
      return { kind: "literal", value: token.value, offset: token.offset };
    case "name":
      return parseName(cursor, token);
    case "op":
      if (token.value === "(") {
        const inner = parseExpression(cursor, 0);
        expect(cursor, ")");
        return inner;
      }
      // [1, 2, 3]: a list, worked out as list(1, 2, 3).
      if (token.value === "[") {
        const args = parseItems(cursor, "]");
        return { kind: "call", name: "list", args, offset: token.offset };
      }
      if (token.value === "-" || token.value === "!") {
        const operand = parseExpression(cursor, PREFIX_BINDING);
        return {
          kind: "unary",
          op: token.value,
          operand,
          offset: token.offset,
        };
      }
      throw new FormulaSyntaxError("A value is missing here.", token.offset);
    case "end":
      throw new FormulaSyntaxError("A value is missing here.", token.offset);
    default: {
      const unknown: never = token;
      return unknown;
    }
  }
}

// `value.name(args)` as `name(value, args)`.
function parseMethod(cursor: Cursor, target: FormulaNode): FormulaNode {
  const token = next(cursor);
  if (token.kind !== "name") {
    throw new FormulaSyntaxError(
      "A function name is missing here.",
      token.offset,
    );
  }
  const args = parseArguments(cursor);
  return {
    kind: "call",
    name: token.value,
    args: [target, ...args],
    offset: token.offset,
  };
}

function parseExpression(cursor: Cursor, minBinding: number): FormulaNode {
  let left = parsePrefix(cursor);
  for (;;) {
    const token = peek(cursor);
    if (isOp(token, ".") && METHOD_BINDING > minBinding) {
      next(cursor);
      left = parseMethod(cursor, left);
      continue;
    }
    const binding = token.kind === "op" ? BINDING[token.value] : undefined;
    if (token.kind !== "op" || binding === undefined || binding <= minBinding) {
      return left;
    }
    next(cursor);
    const right = parseExpression(
      cursor,
      token.value === "^" ? binding - 1 : binding,
    );
    left = {
      kind: "binary",
      op: token.value,
      left,
      right,
      offset: token.offset,
    };
  }
}

export function parseFormula(tokens: readonly FormulaToken[]): FormulaNode {
  const cursor: Cursor = { tokens, index: 0 };
  const tree = parseExpression(cursor, 0);
  const rest = peek(cursor);
  if (rest.kind !== "end") {
    throw new FormulaSyntaxError(
      "This part is not expected here.",
      rest.offset,
    );
  }
  return tree;
}
