// Hiding or showing the sidebar takes away the control that has the focus
// when it is in the sidebar or on the button that brings the sidebar back.
// The focus then goes to the control that undoes it, so a person on the
// keyboard keeps their place instead of starting again at the page's top.
import { toggleSidebar, type Dispatch } from "../../state/index.ts";
import { afterRender } from "../../ui/focus/index.ts";

const SIDEBAR = ".app__sidebar";
const SHOW_HOLDER = "[data-sidebar-open]";
const SHOW = `${SHOW_HOLDER} button`;
const HIDE = `${SIDEBAR} .sidebar__top button`;

export function toggleSidebarKeepingFocus(dispatch: Dispatch): void {
  const active = document.activeElement;
  const wasInside = active?.closest(SIDEBAR) !== null;
  const wasOnShow = active?.closest(SHOW_HOLDER) !== null;
  dispatch(toggleSidebar.create({}));
  if (active === null || (!wasInside && !wasOnShow)) return;
  afterRender(() => {
    document.querySelector<HTMLElement>(wasInside ? SHOW : HIDE)?.focus();
  });
}

// Customize sidebar replaces its button with the mode, and Done gives the
// button back: the focus follows, to the mode's first control and back.
export function focusAfterRender(selector: string): void {
  afterRender(() => {
    document.querySelector<HTMLElement>(selector)?.focus();
  });
}
