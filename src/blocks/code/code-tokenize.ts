// Reads code into tokens for highlighting: one pass from the start, each
// position trying a comment, a string, a name, a number and punctuation,
// in that order. Offsets are UTF-16 code units, as DOM ranges count them;
// tokens are painted and never stored.
import { C_FAMILY_GRAMMARS } from "./code-grammar-c.ts";
import { MARKUP_GRAMMARS } from "./code-grammar-markup.ts";
import { SCRIPT_GRAMMARS } from "./code-grammar-script.ts";
import type { Grammar, TokenKind } from "./code-grammar.ts";
import type { CodeLanguage } from "./code.schema.ts";

export interface Token {
  readonly start: number;
  readonly end: number;
  readonly kind: TokenKind;
}

const GRAMMARS: Readonly<Partial<Record<CodeLanguage, Grammar>>> = {
  ...C_FAMILY_GRAMMARS,
  ...SCRIPT_GRAMMARS,
  ...MARKUP_GRAMMARS,
};

const SPACE = /\s+/y;
const WORD = /[A-Za-z_$][\w$]*/y;
const NUMBER =
  /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)(?:[A-Za-z%][\w%]*)?/y;
const PUNCTUATION = /[{}()[\];,.:<>+\-*/%=!&|^~?@#\\]/y;
const CALL = /\s*\(/y;

// Where a sticky pattern matches at the index, or -1.
function matchEnd(pattern: RegExp, text: string, index: number): number {
  pattern.lastIndex = index;
  return pattern.test(text) ? pattern.lastIndex : -1;
}

function lineEnd(text: string, index: number): number {
  const end = text.indexOf("\n", index);
  return end === -1 ? text.length : end;
}

function commentEnd(grammar: Grammar, text: string, index: number): number {
  if (grammar.lineComments?.some((mark) => text.startsWith(mark, index))) {
    return lineEnd(text, index);
  }
  for (const [open, close] of grammar.blockComments ?? []) {
    if (!text.startsWith(open, index)) continue;
    const end = text.indexOf(close, index + open.length);
    return end === -1 ? text.length : end + close.length;
  }
  return -1;
}

// A backslash keeps the next character inside the string.
function stringEnd(grammar: Grammar, text: string, index: number): number {
  const quote = grammar.quotes?.find((mark) => text.startsWith(mark, index));
  if (quote === undefined) return -1;
  const isMultiline = grammar.multilineQuotes?.includes(quote) === true;
  const limit = isMultiline ? text.length : lineEnd(text, index);
  let at = index + quote.length;
  while (at < limit) {
    if (text[at] === "\\") at += 2;
    else if (text.startsWith(quote, at)) return at + quote.length;
    else at += 1;
  }
  return limit;
}

function isTagName(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - 2), index);
  return before.endsWith("<") || before === "</";
}

function wordKind(grammar: Grammar, text: string, span: [number, number]) {
  const [start, end] = span;
  const word = text.slice(start, end);
  const key = grammar.isCaseInsensitive === true ? word.toLowerCase() : word;
  if (grammar.keywords.has(key)) return "keyword";
  if (grammar.hasTags === true && isTagName(text, start)) return "keyword";
  return matchEnd(CALL, text, end) === -1 ? undefined : "function";
}

interface Step {
  readonly end: number;
  readonly kind?: TokenKind | undefined;
}

function step(grammar: Grammar, text: string, index: number): Step {
  const space = matchEnd(SPACE, text, index);
  if (space !== -1) return { end: space };
  const comment = commentEnd(grammar, text, index);
  if (comment !== -1) return { end: comment, kind: "comment" };
  const string = stringEnd(grammar, text, index);
  if (string !== -1) return { end: string, kind: "string" };
  const word = matchEnd(grammar.word ?? WORD, text, index);
  if (word !== -1) {
    return { end: word, kind: wordKind(grammar, text, [index, word]) };
  }
  const number = matchEnd(NUMBER, text, index);
  if (number !== -1) return { end: number, kind: "number" };
  const mark = matchEnd(PUNCTUATION, text, index);
  return mark === -1 ? { end: index + 1 } : { end: mark, kind: "punctuation" };
}

export function tokenize(language: CodeLanguage, text: string): Token[] {
  const grammar = GRAMMARS[language];
  if (grammar === undefined) return [];
  const tokens: Token[] = [];
  let index = 0;
  while (index < text.length) {
    const { end, kind } = step(grammar, text, index);
    if (kind !== undefined) tokens.push({ start: index, end, kind });
    index = end;
  }
  return tokens;
}
