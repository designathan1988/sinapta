// The sidebar's width on the shell element, in rem, and the width a
// pointer position stands for.
const WIDTH_PROPERTY = "--app-sidebar-width";

export function setWidth(
  shell: Element | null | undefined,
  width: number,
): void {
  if (shell instanceof HTMLElement) {
    shell.style.setProperty(WIDTH_PROPERTY, `${String(width)}rem`);
  }
}

// The pointer position converted to a sidebar width in rem.
export function widthAt(event: PointerEvent): number {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return event.clientX / rem;
}
