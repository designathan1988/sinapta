// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { addTemplate } from "./template.commands.ts";
import { TEMPLATES_OVERLAY } from "./templates-menu.view.ts";

// The templates menu with a template's "…" and one of its lists open.
function rendered(list = "template-default") {
  const app = createDatabaseApp([{ name: "Done", type: "checkbox" }], []);
  app.dispatch(addTemplate.create({ databaseId: app.databaseId }));
  const templateId = app.database().props.templateIds[0];
  if (templateId === undefined) throw new Error("setup");
  const overlay: OpenOverlay = {
    kind: TEMPLATES_OVERLAY,
    anchorId: app.databaseId,
    children: [
      { anchorId: `template-more:${templateId}` },
      { anchorId: `${list}:${templateId}` },
    ],
  };
  const built = app.store.getState();
  const state = {
    ...built,
    ui: { ...built.ui, activePageId: app.databaseId, overlay },
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const item = (label: string) =>
    [...host.querySelectorAll<HTMLElement>("[role^=menuitem]")].find((row) =>
      row.textContent.trim().startsWith(label),
    );
  return { app, sent, item, templateId };
}

describe("the templates menu", () => {
  it("sets a template as the default of this view or of all views", () => {
    const { app, sent, item, templateId } = rendered();

    item("For this view")?.click();
    item("For all views")?.click();

    expect(item("For this view")?.textContent).toContain("Table");
    const choices = sent.filter(
      (command) => command.type !== "ui.closeOverlay",
    );
    expect(choices).toEqual([
      expect.objectContaining({
        type: "template.setDefault",
        templateId,
        viewId: app.view().id,
      }),
      { type: "template.setDefault", databaseId: app.databaseId, templateId },
    ]);
  });

  it("repeats a template weekly from its Repeat list", () => {
    const { sent, item, templateId } = rendered("template-repeat");

    item("Weekly")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "template.setRepeat",
        templateId,
        every: "week",
      }),
    );
  });
});

describe("a template's Delete", () => {
  it("asks first, then deletes the template on Delete", () => {
    const { sent, templateId } = rendered("template-delete");
    const confirm = document.querySelector(".confirm");
    const answer = [...(confirm?.querySelectorAll("button") ?? [])].find(
      (button) => button.textContent.trim() === "Delete",
    );

    answer?.click();

    expect(confirm?.textContent).toContain("Delete this template?");
    expect(sent).toContainEqual(
      expect.objectContaining({ type: "template.delete", templateId }),
    );
  });

  it("opens the question from the Delete row, keeping the menu", () => {
    const { sent, item, templateId } = rendered("template-none");

    item("Delete")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: `template-delete:${templateId}`,
        depth: 1,
      }),
    ]);
  });

  it("edits a template in the center peek over the view", () => {
    const { app, sent, item, templateId } = rendered("template-none");

    item("Edit")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "template.edit",
        templateId,
        viewId: app.view().id,
      }),
    );
  });
});

describe("the templates menu of a database with none", () => {
  it("says what a template is, and has no empty-page row", () => {
    const app = createDatabaseApp([{ name: "Done", type: "checkbox" }], []);
    const built = app.store.getState();
    const overlay = { kind: TEMPLATES_OVERLAY, anchorId: app.databaseId };
    const state = {
      ...built,
      ui: { ...built.ui, activePageId: app.databaseId, overlay },
    };
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderDatabase(state, () => ({ ok: true })),
      host,
    );

    const menu = host.querySelector(".menu")?.textContent ?? "";

    expect(menu).toContain(
      "Create a reusable page template for this database.",
    );
    expect(menu).not.toContain("Empty page");
  });
});
