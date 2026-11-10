// Finds the one replaced range that turns one text into another: the part
// between their common start and their common end.
export interface TextEdit {
  readonly start: number;
  // End of the replaced range in the old text.
  readonly end: number;
  readonly text: string;
}

export function diffText(before: string, after: string): TextEdit | undefined {
  if (before === after) return undefined;
  const shorter = Math.min(before.length, after.length);
  let start = 0;
  while (
    start < shorter &&
    before.charCodeAt(start) === after.charCodeAt(start)
  ) {
    start += 1;
  }
  let tail = 0;
  while (
    tail < shorter - start &&
    before.charCodeAt(before.length - 1 - tail) ===
      after.charCodeAt(after.length - 1 - tail)
  ) {
    tail += 1;
  }
  return {
    start,
    end: before.length - tail,
    text: after.slice(start, after.length - tail),
  };
}
