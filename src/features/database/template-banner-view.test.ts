// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import {
  renderTemplateBanner,
  TEMPLATE_REPEAT_OVERLAY,
} from "./template-banner.view.ts";
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

    expect(host.textContent).toContain("You're editing a template in");
    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.setActivePage",
        pageId: app.databaseId,
      }),
    ]);
  });

  it("opens Repeat… and repeats the template weekly from it", () => {
    const closed = rendered();
    closed.host
      .querySelector<HTMLElement>(".database__template-repeat")
      ?.click();
    const open = rendered(true);
    const weekly = [
      ...open.host.querySelectorAll<HTMLElement>("[role^=menuitem]"),
    ].find((row) => row.textContent.trim() === "Weekly");

    weekly?.click();

    expect(closed.sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: TEMPLATE_REPEAT_OVERLAY,
          anchorId: closed.templateId,
        },
      }),
    ]);
    expect(open.sent).toContainEqual(
      expect.objectContaining({ type: "template.setRepeat", every: "week" }),
    );
  });
});
