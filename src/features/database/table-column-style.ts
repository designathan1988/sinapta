// Places from the store that cells take as numbers are set through the
// CSSOM, not through a style attribute.

// A frozen column's place: the width of the columns before it.
export function setFrozenStart(
  cell: Element | undefined,
  start: number | undefined,
): void {
  if (!(cell instanceof HTMLElement)) return;
  const name = "--database-frozen-start";
  if (start === undefined) cell.style.removeProperty(name);
  else cell.style.setProperty(name, `${String(start)}px`);
}
