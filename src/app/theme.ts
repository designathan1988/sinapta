// The theme as the document shows it: a manual theme is an attribute on the
// root element, "system" removes it, and the color-scheme meta follows.

import type { Theme } from "../model/index.ts";

// Writing the color-scheme meta, even with the value it already has, makes
// the browser restyle the whole page. The root render runs on every
// keystroke, so nothing is written unless the theme changed.
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');
  const scheme = theme === "system" ? "light dark" : theme;
  if (theme === "system") {
    if (root.hasAttribute("data-theme")) root.removeAttribute("data-theme");
  } else if (root.dataset.theme !== theme) {
    root.dataset.theme = theme;
  }
  if (meta !== null && meta.getAttribute("content") !== scheme)
    meta.setAttribute("content", scheme);
}
