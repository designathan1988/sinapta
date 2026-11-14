// How the slash menu finds a name from what is typed after "/", as
// Notion's: by its words, by its words run together ("todo" finds To-do
// list) and by its initials with its numbers ("h2" finds Heading 2).

// Comparison that ignores case in every language.
export function fold(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase("en-US");
}

function wordsOf(name: string): string[] {
  return fold(name)
    .split(/[\s-]+/u)
    .filter((word) => word !== "");
}

function initialsOf(name: string): string {
  return wordsOf(name)
    .map((word) => (/^\d+$/u.test(word) ? word : word.slice(0, 1)))
    .join("");
}

export function isFound(name: string, needle: string): boolean {
  return (
    fold(name).includes(needle) ||
    wordsOf(name).join("").includes(needle) ||
    initialsOf(name).startsWith(needle)
  );
}

// 0 for the whole name or its initials ("h2"), 1 for its start, 2 for a
// word's start, 3 else.
export function matchRank(name: string, needle: string): number {
  const label = fold(name);
  if (needle === "" || label === needle || initialsOf(name) === needle) {
    return 0;
  }
  if (label.startsWith(needle)) return 1;
  return label.includes(` ${needle}`) ? 2 : 3;
}
