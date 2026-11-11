// The keyboard path to the formatting toolbar: Alt+F10 from the text moves
// focus to its first button, the arrow keys move between buttons, and
// Escape goes back to the text with the selection as it was.
import type { ScopedKeys } from "../../ui/shortcuts/index.ts";
import { selectFormatRange } from "./format-toolbar.selectors.ts";

const TOOLBAR = ".format-toolbar:popover-open";
const BUTTONS = "button";

// The button to move to from the current one; undefined for other keys.
export function toolbarStep(
  key: string,
  current: number,
  count: number,
): number | undefined {
  const steps: Readonly<Record<string, number>> = {
    ArrowRight: (current + 1) % count,
    ArrowLeft: (current - 1 + count) % count,
    Home: 0,
    End: count - 1,
  };
  return count === 0 ? undefined : steps[key];
}

function buttonsOf(toolbar: Element): HTMLElement[] {
  return [...toolbar.querySelectorAll<HTMLElement>(BUTTONS)];
}

// The text the selection is in, which the toolbar formats.
function selectedText(): HTMLElement | null {
  const node = document.getSelection()?.anchorNode ?? null;
  const element = node instanceof Element ? node : node?.parentElement;
  return element?.closest<HTMLElement>("[data-text]") ?? null;
}

// Keys pressed inside the toolbar, handled on the toolbar element itself.
export function onToolbarKey(event: KeyboardEvent): void {
  const toolbar = event.currentTarget;
  if (!(toolbar instanceof Element)) return;
  if (event.key === "Escape") {
    event.preventDefault();
    selectedText()?.focus({ preventScroll: true });
    return;
  }
  const buttons = buttonsOf(toolbar);
  const current = buttons.findIndex((button) => button === event.target);
  const next = toolbarStep(event.key, current, buttons.length);
  if (next === undefined) return;
  event.preventDefault();
  buttons[next]?.focus();
}

// While text is selected, Alt+F10 moves focus from the text to the toolbar.
export const formatToolbarKeys: ScopedKeys = {
  isActive: (state) => selectFormatRange(state) !== undefined,
  keys: {
    "Alt+F10": () => {
      const toolbar = document.querySelector(TOOLBAR);
      if (toolbar !== null) buttonsOf(toolbar)[0]?.focus();
    },
  },
};
