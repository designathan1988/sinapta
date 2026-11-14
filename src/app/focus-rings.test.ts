// @vitest-environment happy-dom
// Keyboard reach and focus rings (specification 5.6, .claude/rules/ui.md):
// every control of the app's main screen can take the focus, and every
// focused control shows a ring, unless it is a text field, whose caret
// shows where the keyboard is, or a panel focused only so its keys work.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  onboardingCommands,
  seedGettingStarted,
} from "../features/onboarding/index.ts";
import { createTestApp } from "../state/index.ts";
import { renderShell } from "./shell.view.ts";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function cssFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return path.endsWith(".css") ? [path] : [];
  });
}

// Where a ring is left out on purpose, and how many times.
const RINGLESS: Readonly<Record<string, number>> = {
  // Panels focused by script so their keys work; not controls.
  "app/shell.css": 1,
  "features/editor/editor.css": 1,
  "features/row-peek/peek.css": 1,
  "features/slash-menu/slash-menu.css": 1,
  // Text fields: the caret, a background or a drawn line shows focus.
  "features/command-palette/command-palette.css": 1,
  "features/comments/comments.css": 1,
  "features/database/cell-options.css": 1,
  "features/database/database-inline.css": 1,
  "features/database/database.css": 1,
  "features/database/layouts/form/form.css": 2,
  "features/database/row-properties.css": 1,
  "features/database/table.css": 1,
  "features/editor/editor-page-header.css": 1,
  "features/sign-in/sign-in.css": 1,
  "features/trash/trash.css": 1,
  "ui/emoji/emoji.css": 1,
  "ui/menu/menu-field.css": 1,
  "ui/rich-text/rich-text.css": 1,
};

describe("focus rings", () => {
  it("are drawn for every focused control, in the focus color", () => {
    const base = readFileSync(join(SRC, "styles/base.css"), "utf8");

    expect(base).toMatch(
      /:focus-visible \{\s*outline: var\(--size-focus-width\) solid var\(--color-border-focus\);/,
    );
  });

  it("are left out only where the list above says why", () => {
    const ringless = Object.fromEntries(
      cssFiles(SRC).flatMap((path) => {
        const count = (
          readFileSync(path, "utf8").match(/outline: (none|0);/g) ?? []
        ).length;
        const name = relative(SRC, path).split(sep).join("/");
        return count === 0 ? [] : [[name, count]];
      }),
    );

    expect(ringless).toEqual(RINGLESS);
  });
});

const INTERACTIVE_ROLES = [
  "button",
  "checkbox",
  "link",
  "menuitem",
  "option",
  "slider",
  "switch",
  "tab",
  "treeitem",
];
const NATIVE = "a[href], button, input, select, textarea, summary";

describe("keyboard reach of the main screen", () => {
  it("lets every control take the focus", () => {
    const { store, dispatch } = createTestApp({ commands: onboardingCommands });
    dispatch(seedGettingStarted.create({}));
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(renderShell(store.getState(), dispatch), host);

    const roles = INTERACTIVE_ROLES.map((role) => `[role="${role}"]`).join(
      ", ",
    );
    const unreachable = [...host.querySelectorAll<HTMLElement>(roles)]
      .filter(
        (element) =>
          !element.matches(NATIVE) && !element.hasAttribute("tabindex"),
      )
      .map((element) => element.outerHTML.slice(0, 80));
    const disabledLinks = [...host.querySelectorAll("a:not([href])")].length;

    expect(host.querySelectorAll(NATIVE).length).toBeGreaterThan(10);
    expect(unreachable).toEqual([]);
    expect(disabledLinks).toBe(0);
  });
});
