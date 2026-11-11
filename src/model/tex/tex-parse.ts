// Reads TeX into a MathNode tree: groups, fractions, roots, scripts,
// stretchy brackets, matrices and the symbols in tex-symbols.ts. A command
// the parser does not know stays as an error piece; only a broken
// structure, such as an unclosed brace, fails the whole expression.
import { delimiterOf, ENVIRONMENTS, symbolNode } from "./tex-symbols.ts";
import {
  fail,
  isCommand,
  leafNode,
  next,
  peek,
  type Cursor,
  type Failure,
  type Parsed,
  type Stop,
} from "./tex-cursor.ts";
import { tokenizeTex, type TexToken } from "./tex-tokenize.ts";
import { row, type MathNode, type TexResult } from "./tex-tree.ts";

function parseRow(cursor: Cursor, stop: Stop): Parsed {
  const children: MathNode[] = [];
  for (
    let token = peek(cursor);
    token !== undefined && !stop(token);
    token = peek(cursor)
  ) {
    const node = parseScripted(cursor);
    if (node.kind === "failure") return node;
    children.push(node);
  }
  return row(children);
}

function parseGroup(cursor: Cursor, open: TexToken): Parsed {
  const body = parseRow(cursor, (token) => token.kind === "close");
  if (body.kind === "failure") return body;
  return next(cursor)?.kind === "close"
    ? body
    : fail("unclosed-brace", open.offset);
}

// One argument: a braced group or a single token.
function parseArgument(cursor: Cursor): Parsed {
  const token = peek(cursor);
  if (token === undefined) return fail("missing-argument", cursor.end);
  if (token.kind === "open") {
    next(cursor);
    return parseGroup(cursor, token);
  }
  return parseAtom(cursor);
}

interface ScriptToken {
  readonly kind: "sub" | "sup" | "prime";
  readonly offset: number;
}

function isScript(token: TexToken | undefined): token is ScriptToken {
  return (
    token?.kind === "sub" || token?.kind === "sup" || token?.kind === "prime"
  );
}

// A prime is a superscript of its own.
function readScript(cursor: Cursor, token: ScriptToken): Parsed {
  return token.kind === "prime"
    ? (symbolNode("prime") ?? row([]))
    : parseArgument(cursor);
}

function parseScripted(cursor: Cursor): Parsed {
  const base = parseAtom(cursor);
  if (base.kind === "failure") return base;
  const scripts: { sub?: MathNode; sup?: MathNode } = {};
  for (let token = peek(cursor); isScript(token); token = peek(cursor)) {
    next(cursor);
    const script = readScript(cursor, token);
    if (script.kind === "failure") return script;
    scripts[token.kind === "sub" ? "sub" : "sup"] = script;
  }
  const hasScripts = scripts.sub !== undefined || scripts.sup !== undefined;
  return hasScripts ? { kind: "scripts", base, ...scripts } : base;
}

function parseAtom(cursor: Cursor): Parsed {
  const token = next(cursor);
  if (token === undefined) return fail("missing-argument", cursor.end);
  const leaf = leafNode(token);
  if (leaf !== undefined) return leaf;
  if (token.kind === "open") return parseGroup(cursor, token);
  if (token.kind === "close") return fail("unexpected-close", token.offset);
  if (token.kind === "command") return parseCommand(cursor, token);
  // A script with nothing before it applies to an empty base.
  cursor.index -= 1;
  return row([]);
}

function parseFraction(cursor: Cursor): Parsed {
  const numerator = parseArgument(cursor);
  if (numerator.kind === "failure") return numerator;
  const denominator = parseArgument(cursor);
  if (denominator.kind === "failure") return denominator;
  return { kind: "fraction", numerator, denominator };
}

function parseRoot(cursor: Cursor): Parsed {
  const bracket = peek(cursor);
  let index: MathNode | undefined;
  if (bracket?.kind === "symbol" && bracket.text === "[") {
    next(cursor);
    const parsed = parseRow(
      cursor,
      (token) => token.kind === "symbol" && token.text === "]",
    );
    if (parsed.kind === "failure") return parsed;
    if (next(cursor) === undefined)
      return fail("unclosed-brace", bracket.offset);
    index = parsed;
  }
  const base = parseArgument(cursor);
  if (base.kind === "failure") return base;
  return { kind: "root", base, ...(index && { index }) };
}

function parseText(cursor: Cursor, command: TexToken): Parsed {
  const raw = next(cursor);
  if (raw?.kind !== "raw") return fail("missing-argument", command.offset);
  return raw.isClosed
    ? { kind: "text", text: raw.text }
    : fail("unclosed-brace", raw.offset);
}

function operatorText(name: string): string | undefined {
  const node = symbolNode(name);
  return node?.kind === "operator" ? node.text : undefined;
}

function readDelimiter(cursor: Cursor, at: number): string | Failure {
  const token = next(cursor);
  if (token?.kind === "symbol") return token.text === "." ? "" : token.text;
  if (token?.kind !== "command") return fail("missing-delimiter", at);
  const delimiter = delimiterOf(token.name) ?? operatorText(token.name);
  return delimiter ?? fail("missing-delimiter", token.offset);
}

function parseFence(cursor: Cursor, left: TexToken): Parsed {
  const open = readDelimiter(cursor, left.offset);
  if (typeof open !== "string") return open;
  const body = parseRow(cursor, (token) => isCommand(token, "right"));
  if (body.kind === "failure") return body;
  if (!isCommand(next(cursor), "right"))
    return fail("missing-right", left.offset);
  const close = readDelimiter(cursor, left.offset);
  if (typeof close !== "string") return close;
  return { kind: "fenced", open, close, body };
}

const ENDS_CELL: Stop = (token) =>
  token.kind === "amp" || isCommand(token, "\\") || isCommand(token, "end");

function isEmptyRow(cells: readonly MathNode[] | undefined): boolean {
  const [only] = cells ?? [];
  return (
    cells?.length === 1 && only?.kind === "row" && only.children.length === 0
  );
}

// The cells of a matrix up to \end, split into rows by \ and into
// cells by &. A last row left empty by a final \ is dropped.
function parseCells(cursor: Cursor, begin: TexToken) {
  const rows: MathNode[][] = [[]];
  for (;;) {
    const cell = parseRow(cursor, ENDS_CELL);
    if (cell.kind === "failure") return cell;
    rows.at(-1)?.push(cell);
    const token = next(cursor);
    if (token === undefined) return fail("unclosed-environment", begin.offset);
    if (isCommand(token, "end")) break;
    if (isCommand(token, "\\")) rows.push([]);
  }
  return rows.length > 1 && isEmptyRow(rows.at(-1)) ? rows.slice(0, -1) : rows;
}

function parseEnvironment(cursor: Cursor, begin: TexToken): Parsed {
  const name = next(cursor);
  if (name?.kind !== "raw") return fail("missing-argument", begin.offset);
  const rows = parseCells(cursor, begin);
  if ("kind" in rows) return rows;
  next(cursor);
  const matrix: MathNode = { kind: "matrix", rows };
  const [open, close] = ENVIRONMENTS.get(name.text) ?? ["", ""];
  if (open === "" && close === "") return matrix;
  return { kind: "fenced", open, close, body: matrix };
}

type CommandToken = Extract<TexToken, { kind: "command" }>;
type CommandParser = (cursor: Cursor, token: CommandToken) => Parsed;

const TEXT_COMMANDS = [
  "text",
  "textrm",
  "textbf",
  "textit",
  "mathrm",
  "operatorname",
];

// Commands with arguments or a body of their own.
const COMMANDS: ReadonlyMap<string, CommandParser> = new Map<
  string,
  CommandParser
>([
  ["frac", parseFraction],
  ["dfrac", parseFraction],
  ["tfrac", parseFraction],
  ["sqrt", parseRoot],
  ["left", parseFence],
  ["begin", parseEnvironment],
  ...TEXT_COMMANDS.map((name): [string, CommandParser] => [name, parseText]),
]);

function parseCommand(cursor: Cursor, token: CommandToken): Parsed {
  const parse = COMMANDS.get(token.name);
  if (parse !== undefined) return parse(cursor, token);
  return symbolNode(token.name) ?? { kind: "error", text: `\\${token.name}` };
}

export function parseTex(source: string): TexResult {
  const cursor: Cursor = {
    tokens: tokenizeTex(source),
    end: source.length,
    index: 0,
  };
  const tree = parseRow(cursor, () => false);
  if (tree.kind === "failure") {
    return { ok: false, error: tree.error, offset: tree.offset };
  }
  return { ok: true, tree };
}
