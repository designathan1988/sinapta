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
  const [due] = app.propertyIds;
  if (due === undefined) throw new Error("setup");
  const condition = { propertyId: due, operator: "is-not-empty", value: "" };
  if (withRule) app.dispatch(addColorRule.create({ viewId, condition }));
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

  it("shows the note, and New color setting asks for a property first", () => {
    const { host, sent, button } = rendered();

    expect(host.textContent).toContain("Customize page colors");
    // With no rows, New color setting is what the panel focuses first.
    expect(button("New color setting")?.hasAttribute("data-autofocus")).toBe(
      true,
    );
    button("New color setting")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlayPanel",
        panel: "color-property",
      }),
    ]);
  });

  it("makes a green rule on the property chosen, the title listed first", () => {
    const { host, sent, viewId } = rendered(false, "color-property");
    const rows = [...host.querySelectorAll<HTMLElement>(".menu [data-index]")];

    expect(rows.map((row) => row.textContent.trim())).toEqual(["Name", "Due"]);
    rows[1]?.click();

    expect(sent[0]).toMatchObject({ type: "view.addColorRule", viewId });
    // The rule holds the chosen property's condition.
    expect(JSON.stringify(sent[0])).toContain('"condition":{"propertyId"');
  });

  it("shows a rule as Notion's: its condition, Page background, Apply to", () => {
    const { host, sent, button } = rendered(true);
    const rule = host.querySelector(".view-settings__rule")?.textContent ?? "";

    // A date names which end it tests, as the filter does.
    expect(rule).toContain("Start date");
    expect(rule).toContain("Page background");
    expect(rule).toContain("Green");
    expect(rule).toContain("Apply to");
    expect(rule).toContain("Entire row");
    expect(button("Add another")).toBeDefined();
    button("Delete color setting")?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "view.deleteColorRule",
    ]);
  });
});
