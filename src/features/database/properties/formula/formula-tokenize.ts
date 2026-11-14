// Splits a formula's text into numbers, text in quotes, names and
// operators, each with the offset where it starts.
export type FormulaToken =
  | { readonly kind: "number"; readonly value: number; readonly offset: number }
  | { readonly kind: "string"; readonly value: string; readonly offset: number }
  | { readonly kind: "name"; readonly value: string; readonly offset: number }
  | { readonly kind: "op"; readonly value: string; readonly offset: number }
  | { readonly kind: "end"; readonly offset: number };

export type TokenizeResult =
  | { readonly ok: true; readonly tokens: readonly FormulaToken[] }
  | { readonly ok: false; readonly error: string; readonly offset: number };

const OPERATORS = [
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  "<",
  ">",
  "!",
  "?",
  ":",
  "(",
  ")",
  "[",
  "]",
  ",",
  ".",
];

// Notion's word operators.
const WORDS: Readonly<Record<string, string>> = {
  and: "&&",
  or: "||",
  not: "!",
};

const NUMBER = /^\d+(\.\d+)?/;
const NAME = /^[A-Za-z_][A-Za-z0-9_]*/;
const SPACE = /^\s+/;

// The text in quotes at the start, with \" and \\ read as one character.
function readString(
  rest: string,
): { value: string; length: number } | undefined {
  const match = /^"((?:[^"\\]|\\.)*)"/.exec(rest);
  if (match === null) return undefined;
  const value = (match[1] ?? "").replace(/\\(.)/g, "$1");
  return { value, length: match[0].length };
}

function tokenAt(source: string, offset: number) {
  const rest = source.slice(offset);
  const number = NUMBER.exec(rest);
  if (number !== null) {
    const token = { kind: "number", value: Number(number[0]), offset } as const;
    return { token, length: number[0].length };
  }
  if (rest.startsWith('"')) {
    const text = readString(rest);
    if (text === undefined) return undefined;
    return {
      token: { kind: "string", value: text.value, offset } as const,
      length: text.length,
    };
  }
  const name = NAME.exec(rest);
  if (name !== null) {
    const word = WORDS[name[0]];
    const token =
      word === undefined
        ? ({ kind: "name", value: name[0], offset } as const)
        : ({ kind: "op", value: word, offset } as const);
    return { token, length: name[0].length };
  }
  const op = OPERATORS.find((each) => rest.startsWith(each));
  return op === undefined
    ? undefined
    : { token: { kind: "op", value: op, offset } as const, length: op.length };
}

export function tokenizeFormula(source: string): TokenizeResult {
  const tokens: FormulaToken[] = [];
  let offset = 0;
  while (offset < source.length) {
    const space = SPACE.exec(source.slice(offset));
    if (space !== null) {
      offset += space[0].length;
      continue;
    }
    const next = tokenAt(source, offset);
    if (next === undefined) {
      return { ok: false, error: "This part cannot be read.", offset };
    }
    tokens.push(next.token);
    offset += next.length;
  }
  tokens.push({ kind: "end", offset: source.length });
  return { ok: true, tokens };
}
