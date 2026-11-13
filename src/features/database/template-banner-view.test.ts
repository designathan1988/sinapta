// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderTemplateBanner } from "./template-banner.view.ts";
import { TEMPLATE_REPEAT_OVERLAY } from "./template-repeat.view.ts";
import { addTemplate } from "./template.commands.ts";

// A template's strip, with its Repeat… list open or not.
function rendered(isRepeatOpen = false) {
  const app = createDatabaseApp([], []);
  const viewId = app.view().id;
  app.dispatch(addTemplate.create({ databaseId: app.databaseId, viewId }));
  const templateId = app.database().props.templateIds[0];
  if (templateId === undefined) throw new Error("setup");
  const built = app.store.getState();
  const overlay = isRepeatOpen
    ? { kind: TEMPLATE_REPEAT_OVERLAY, anchorId: templateId }
    : null;
  const state = { ...built, ui: { ...built.ui, overlay } };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderTemplateBanner(state, templateId, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { app, host, sent, templateId };
}

describe("the template strip", () => {
  it("names the database, and opens it from its name", () => {
    const { app, host, sent } = rendered();

    host.querySelector<HTMLElement>(".database__template-link")?.click();

    expect(host.textContent).toContain("You’re editing a template in");
    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.setActivePage",
        pageId: app.databaseId,
      }),
    ]);
  });

  it("opens Repeat…, and a choice there starts a cadence to edit", () => {
    const closed = rendered();
    closed.host
      .querySelector<HTMLElement>(".database__template-repeat")
      ?.click();
    const open = rendered(true);
    const week = [
      ...open.host.querySelectorAll<HTMLElement>("[role^=menuitem]"),
    ].find((row) => row.textContent.trim() === "2 Weeks");

    week?.click();

    expect(closed.sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: TEMPLATE_REPEAT_OVERLAY,
          anchorId: closed.templateId,
        },
      }),
    ]);
    expect(open.sent).toEqual([
      expect.objectContaining({ type: "ui.setOverlayValues", name: "cadence" }),
    ]);
    expect(open.sent[0]?.values).toEqual(
      expect.arrayContaining(["every=week", "interval=2"]),
    );
  });
});
