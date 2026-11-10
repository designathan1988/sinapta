// Reads Design Tokens Format 2025.10 trees into a flat map of path to token.

export interface Token {
  readonly path: string;
  readonly type: string | undefined;
  readonly value: unknown;
}

export interface TokenError {
  readonly path: string;
  readonly message: string;
}

export type TokenMap = ReadonlyMap<string, Token>;

const ALIAS_PATTERN = /^\{([^{}]+)\}$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function aliasTarget(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return ALIAS_PATTERN.exec(value)?.[1];
}

interface Walk {
  readonly node: Record<string, unknown>;
  readonly path: string;
  readonly inheritedType: string | undefined;
}

function walk(
  { node, path, inheritedType }: Walk,
  tokens: Map<string, Token>,
): void {
  const ownType = typeof node.$type === "string" ? node.$type : undefined;
  const type = ownType ?? inheritedType;
  if ("$value" in node) {
    tokens.set(path, { path, type, value: node.$value });
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$") || !isRecord(child)) continue;
    const childPath = path === "" ? key : `${path}.${key}`;
    walk({ node: child, path: childPath, inheritedType: type }, tokens);
  }
}

export function flattenTokens(tree: unknown): Map<string, Token> {
  const tokens = new Map<string, Token>();
  if (isRecord(tree))
    walk({ node: tree, path: "", inheritedType: undefined }, tokens);
  return tokens;
}

// Follows an alias chain to the type of the token it ends at.
export function resolveType(
  token: Token,
  tokens: TokenMap,
): string | TokenError {
  const seen = new Set<string>();
  let current = token;
  for (;;) {
    if (current.type !== undefined) return current.type;
    const target = aliasTarget(current.value);
    if (target === undefined) {
      return { path: token.path, message: "Token has no $type." };
    }
    const next = tokens.get(target);
    if (next === undefined || seen.has(target)) {
      const reason = next === undefined ? "Unknown alias" : "Alias cycle at";
      return { path: token.path, message: `${reason} {${target}}.` };
    }
    seen.add(target);
    current = next;
  }
}

export function customPropertyName(path: string): string {
  const kebab = path
    .split(".")
    .map((segment) =>
      segment.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
    )
    .join("-");
  return `--${kebab}`;
}
