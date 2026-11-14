// What the code of a part of the app does besides drawing controls: the
// commands it dispatches, the keys it handles, the DOM events it listens
// to, the drags it starts, what it announces, the menu entries it lists,
// and the server paths it calls or serves. All read with patterns from
// the source as it is now.
import type { SourceFile } from "./inventory-source.ts";

const unique = (values: Iterable<string>): string[] =>
  [...new Set(values)].sort();

// Each command's factory name and its type: `export const toggleSidebar =
// defineCommand<…>({ type: "ui.toggleSidebar"` gives toggleSidebar → ui.toggleSidebar.
export function commandNames(
  files: readonly SourceFile[],
): Map<string, string> {
  const names = new Map<string, string>();
  const pattern = /const (\w+) = defineCommand[^(]*\(\{\s*type: "([\w.]+)"/g;
  for (const file of files) {
    for (const match of file.text.matchAll(pattern)) {
      names.set(match[1] ?? "", match[2] ?? "");
    }
  }
  return names;
}

export function commandsUsed(
  text: string,
  names: Map<string, string>,
): string[] {
  const found = [...text.matchAll(/type: "([a-z]\w*\.[a-z]\w*)"/g)].map(
    (m) => m[1] ?? "",
  );
  for (const match of text.matchAll(/\b(\w+)\.create\(/g)) {
    const type = names.get(match[1] ?? "");
    if (type !== undefined) found.push(type);
  }
  return unique(found);
}

const KEYS =
  /"(Enter|Escape|Tab|Backspace|Delete|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|PageUp|PageDown|F2|F10|ContextMenu| )"/g;

export function keysHandled(text: string): string[] {
  if (!/keydown|KeyboardEvent|\.key\b/.test(text)) return [];
  const keys = [...text.matchAll(KEYS)].map((m) =>
    m[1] === " " ? "Space" : (m[1] ?? ""),
  );
  const letters = [
    ...text.matchAll(/key(?:\.toLowerCase\(\))? === "([a-z0-9/\\[\],.])"/g),
  ];
  const modifiers = ["ctrlKey", "metaKey", "shiftKey", "altKey"].filter((m) =>
    text.includes(m),
  );
  return unique([
    ...keys,
    ...letters.map((m) => `key ${m[1] ?? ""}`),
    ...modifiers,
  ]);
}

export function domEvents(text: string): string[] {
  return unique(
    [...text.matchAll(/addEventListener\(\s*"([a-z]+)"/g)].map(
      (m) => m[1] ?? "",
    ),
  );
}

export function dragKinds(text: string): string[] {
  const kinds: string[] = [];
  if (/startPointerDrag\(|setPointerCapture\(/.test(text))
    kinds.push("pointer drag");
  if (/draggable|"dragstart"|@dragstart/.test(text)) kinds.push("html5 drag");
  if (/@drop=|"drop"/.test(text)) kinds.push("drop target");
  if (/@paste=|"paste"/.test(text)) kinds.push("paste");
  if (/@wheel=|"wheel"/.test(text)) kinds.push("wheel");
  return kinds;
}

export function announced(text: string): string[] {
  return unique(
    [...text.matchAll(/announce\(\s*(COPY(?:\.\w+)+)/g)].map((m) => m[1] ?? ""),
  );
}

// Entries listed as data (menus, slash items, options): `label: COPY.x.y`.
export function listedLabels(text: string): string[] {
  return unique(
    [...text.matchAll(/label:\s*(COPY(?:\.\w+)+)/g)].map((m) => m[1] ?? ""),
  );
}

export function apiCalls(text: string): string[] {
  return unique(
    [...text.matchAll(/["`](\/api\/[\w/:${}.-]*)/g)].map((m) => m[1] ?? ""),
  );
}

export function serverRoutes(text: string): string[] {
  return unique(
    [...text.matchAll(/"((?:GET|POST|PUT|PATCH|DELETE) \/api\/[^"]*)"/g)].map(
      (m) => m[1] ?? "",
    ),
  );
}
