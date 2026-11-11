// Markdown pipe tables: a row of cells between pipes, a rule of dashes
// under it, and more rows. Only the cell texts are read here; the caller
// reads their marks.

const RULE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function isRow(line: string | undefined): line is string {
  return line?.trim().startsWith("|") === true;
}

// A pipe that a backslash does not escape separates two cells.
function cellsOf(line: string): string[] {
  const inner = line
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "");
  return inner
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

// True when a table starts at the line: a row with a rule under it.
export function isPipeTableAt(
  lines: readonly string[],
  index: number,
): boolean {
  return isRow(lines[index]) && RULE.test(lines[index + 1] ?? "");
}

export interface PipeTable {
  // Cell texts, every row as long as the header.
  readonly cells: string[][];
  // The index of the first line after the table.
  readonly next: number;
}

export function readPipeTable(
  lines: readonly string[],
  index: number,
): PipeTable {
  const header = cellsOf(lines[index] ?? "");
  const width = header.length;
  const fit = (row: string[]): string[] => [
    ...row.slice(0, width),
    ...Array.from({ length: Math.max(0, width - row.length) }, () => ""),
  ];
  const cells = [header];
  let at = index + 2;
  for (let line = lines[at]; isRow(line); line = lines[at]) {
    cells.push(fit(cellsOf(line)));
    at += 1;
  }
  return { cells, next: at };
}

export function hasPipeTable(lines: readonly string[]): boolean {
  return lines.some((_, index) => isPipeTableAt(lines, index));
}
