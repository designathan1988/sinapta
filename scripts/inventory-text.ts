// The words the person sees, for the inventory: COPY paths turned into the
// interface text (src/ui/copy.ts is plain data and loads in Node), and the
// global shortcuts of src/ui/shortcuts/shortcut-registry.ts as keys.
const COPY_FILE = new URL("../src/ui/copy.ts", import.meta.url).href;
const SHORTCUTS_FILE = new URL(
  "../src/ui/shortcuts/shortcut-registry.ts",
  import.meta.url,
).href;

function walk(root: unknown, path: string): string {
  let value: unknown = root;
  for (const key of path.split(".").slice(1)) {
    value =
      typeof value === "object" && value !== null
        ? Reflect.get(value, key)
        : undefined;
  }
  if (typeof value === "string") return value;
  return typeof value === "function" ? `${path}(…)` : path;
}

export async function copyText(): Promise<(path: string) => string> {
  try {
    const module: unknown = await import(COPY_FILE);
    const copy: unknown =
      typeof module === "object" && module !== null
        ? Reflect.get(module, "COPY")
        : undefined;
    return (path) => walk(copy, path);
  } catch {
    return (path) => path;
  }
}

function describe(entry: unknown): string {
  const get = (key: string): unknown =>
    typeof entry === "object" && entry !== null
      ? Reflect.get(entry, key)
      : undefined;
  const keys = [
    get("withModifier") === true ? "Ctrl" : "",
    get("withShift") === true ? "Shift" : "",
    get("withAlt") === true ? "Alt" : "",
    String(get("key")).toUpperCase(),
  ].filter((key) => key !== "");
  const command = get("command");
  const type =
    typeof command === "object" && command !== null
      ? String(Reflect.get(command, "type"))
      : "";
  const action = get("action");
  return `- ${keys.join("+")} → ${typeof action === "string" ? action : type}`;
}

export async function shortcutLines(): Promise<string[]> {
  try {
    const module: unknown = await import(SHORTCUTS_FILE);
    const list: unknown =
      typeof module === "object" && module !== null
        ? Reflect.get(module, "SHORTCUTS")
        : [];
    return Array.isArray(list) ? list.map(describe) : [];
  } catch (error) {
    return [
      `(not read: ${error instanceof Error ? error.message : "unknown"})`,
    ];
  }
}
