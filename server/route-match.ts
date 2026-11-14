// Finds the route for a method and path: an exact key first, then a key
// whose ":name" parts take any one segment of the path.
export interface Match<TRoute> {
  readonly route: TRoute;
  readonly params: Readonly<Record<string, string>>;
}

function matchPattern(
  pattern: readonly string[],
  parts: readonly string[],
): Record<string, string> | undefined {
  if (pattern.length !== parts.length) return undefined;
  const params: Record<string, string> = {};
  for (const [index, part] of pattern.entries()) {
    const actual = parts[index] ?? "";
    if (part.startsWith(":")) {
      if (actual === "") return undefined;
      params[part.slice(1)] = decodeURIComponent(actual);
    } else if (part !== actual) {
      return undefined;
    }
  }
  return params;
}

export function matchRoute<TRoute>(
  routes: Readonly<Record<string, TRoute>>,
  method: string,
  path: string,
): Match<TRoute> | undefined {
  const exact = routes[`${method} ${path}`];
  if (exact !== undefined) return { route: exact, params: {} };
  const parts = path.split("/");
  for (const [key, route] of Object.entries(routes)) {
    const [keyMethod, keyPath = ""] = key.split(" ");
    if (keyMethod !== method || !keyPath.includes(":")) continue;
    const params = matchPattern(keyPath.split("/"), parts);
    if (params !== undefined) return { route, params };
  }
  return undefined;
}
