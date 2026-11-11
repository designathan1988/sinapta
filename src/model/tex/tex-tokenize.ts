// Splits TeX source into tokens. Offsets count UTF-16 code units, as the
// source of an equation is edited as plain text; TeX's own characters are
// all ASCII.
export type TexToken =
  | { readonly kind: "command"; readonly name: string; readonly offset: number }
  | {
      readonly kind: "open" | "close" | "sup" | "sub" | "amp" | "prime";
      readonly offset: number;
    }
  | {
      readonly kind: "number" | "letter" | "symbol";
      readonly text: string;
      readonly offset: number;
    }
  // The braced argument of \text and its kind, taken as it is written.
  | {
      readonly kind: "raw";
      readonly text: string;
      readonly offset: number;
      readonly isClosed: boolean;
    };

const RAW_COMMANDS = new Set([
  "text",
  "textrm",
  "textbf",
  "textit",
  "mathrm",
  "operatorname",
  "begin",
  "end",
]);

type SingleKind = "open" | "close" | "sup" | "sub" | "amp" | "prime";

const SINGLE: Readonly<Record<string, SingleKind>> = {
  "{": "open",
  "}": "close",
  "^": "sup",
  _: "sub",
  "&": "amp",
  "'": "prime",
};

// The braced group from the brace at `start`, nested braces included.
function rawGroup(source: string, start: number) {
  let depth = 0;
  for (let at = start; at < source.length; at += 1) {
    if (source[at] === "{") depth += 1;
    if (source[at] === "}") depth -= 1;
    if (depth === 0) {
      const text = source.slice(start + 1, at);
      return {
        token: { kind: "raw", text, offset: start, isClosed: true } as const,
        end: at + 1,
      };
    }
  }
  const text = source.slice(start + 1);
  return {
    token: { kind: "raw", text, offset: start, isClosed: false } as const,
    end: source.length,
  };
}

interface Read {
  readonly tokens: readonly TexToken[];
  readonly end: number;
}

function readCommand(source: string, start: number): Read {
  const letters = /^[A-Za-z]+/.exec(source.slice(start + 1))?.[0];
  const name = letters ?? source[start + 1] ?? "";
  const command = { kind: "command", name, offset: start } as const;
  let end = start + 1 + name.length;
  if (!RAW_COMMANDS.has(name)) return { tokens: [command], end };
  while (source[end] === " ") end += 1;
  if (source[end] !== "{") return { tokens: [command], end };
  const group = rawGroup(source, end);
  return { tokens: [command, group.token], end: group.end };
}

function readOne(source: string, start: number): Read {
  const char = source[start] ?? "";
  if (char === "\\") return readCommand(source, start);
  const single = Object.hasOwn(SINGLE, char) ? SINGLE[char] : undefined;
  if (single !== undefined) {
    return { tokens: [{ kind: single, offset: start }], end: start + 1 };
  }
  const number = /^\d+(?:\.\d+)?/.exec(source.slice(start))?.[0];
  if (number !== undefined) {
    return {
      tokens: [{ kind: "number", text: number, offset: start }],
      end: start + number.length,
    };
  }
  const symbol = String.fromCodePoint(source.codePointAt(start) ?? 0);
  const kind = /^[A-Za-z]$/.test(symbol) ? "letter" : "symbol";
  return {
    tokens: [{ kind, text: symbol, offset: start }],
    end: start + symbol.length,
  };
}

export function tokenizeTex(source: string): TexToken[] {
  const tokens: TexToken[] = [];
  let at = 0;
  while (at < source.length) {
    if (/\s/.test(source[at] ?? "")) {
      at += 1;
      continue;
    }
    const read = readOne(source, at);
    tokens.push(...read.tokens);
    at = read.end;
  }
  return tokens;
}
