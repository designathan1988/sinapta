// Reading TeX tokens one after another, and the failure a broken
// structure returns.
import type { TexToken } from "./tex-tokenize.ts";
import type { MathNode, TexError } from "./tex-tree.ts";

export interface Cursor {
  readonly tokens: readonly TexToken[];
  readonly end: number;
  index: number;
}

export interface Failure {
  readonly kind: "failure";
  readonly error: TexError;
  readonly offset: number;
}

export type Parsed = MathNode | Failure;

export function fail(error: TexError, offset: number): Failure {
  return { kind: "failure", error, offset };
}

export function peek(cursor: Cursor): TexToken | undefined {
  return cursor.tokens[cursor.index];
}

export function next(cursor: Cursor): TexToken | undefined {
  const token = cursor.tokens[cursor.index];
  cursor.index += 1;
  return token;
}

export function isCommand(token: TexToken | undefined, name: string): boolean {
  return token?.kind === "command" && token.name === name;
}

export type Stop = (token: TexToken) => boolean;

// Tokens that are a node by themselves.
export function leafNode(token: TexToken): MathNode | undefined {
  switch (token.kind) {
    case "number":
      return { kind: "number", text: token.text };
    case "letter":
      return { kind: "identifier", text: token.text };
    case "symbol":
      return { kind: "operator", text: token.text };
    case "raw":
      return { kind: "text", text: token.text };
    case "amp":
      return { kind: "error", text: "&" };
    default:
      return undefined;
  }
}
