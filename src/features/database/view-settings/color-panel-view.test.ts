// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../../state/index.ts";
import { addColorRule } from "../color-rules.commands.ts";
import { createDatabaseApp } from "../database-builder.ts";
import { renderDatabase } from "../database.view.ts";
import { VIEW_SETTINGS_OVERLAY } from "./index.ts";

// A table with its Conditional color panel open, with one rule when asked.
function rendered(withRule = false, panel = "color") {
  const app = createDatabaseApp([{ name: "Due", type: "date" }], [["Ship"]]);
  const viewId = app.view().id;
  if (withRule) app.dispatch(addColorRule.create({ viewId }));
  const built = app.store.getState();
  const overlay: OpenOverlay = {
    kind: VIEW_SETTINGS_OVERLAY,
    anchorId: app.databaseId,
    panel,
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase({ ...built, ui: { ...built.ui, overlay } }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const button = (label: string) =>
    [...host.querySelectorAll<HTMLButtonElement>("button")].find(
      (item) =>
        item.textContent.trim() === label ||
        item.getAttribute("aria-label") === label,
    );
  return { host, sent, viewId, button };
}

describe("the Conditional color panel", () => {
  it("is reached from the view settings' row", () => {
    const { host } = rendered(false, "");
    const labels = [...host.querySelectorAll(".menu__label")].map((label) =>
      label.textContent.trim(),
    );

    expect(labels).toContain("Conditional color");
  });

  it("shows the note and adds a rule from New color setting", () => {
    const { host, sent, viewId, button } = rendered();

    expect(host.textContent).toContain("Customize page colors");
    button("New color setting")?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "view.addColorRule", viewId }),
    ]);
  });

  it("lists a rule with its color, its target and a condition to add", () => {
    const { host, sent, button } = rendered(true);

    expect(host.querySelector(".view-settings__rule")?.textContent).toContain(
      "Red",
    );
    expect(host.querySelector(".view-settings__rule")?.textContent).toContain(
      "Background",
    );
    button("Add condition")?.click();
    button("Delete color setting")?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "view.setColorRule",
      "view.deleteColorRule",
    ]);
  });
});
