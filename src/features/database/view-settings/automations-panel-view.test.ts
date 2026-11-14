// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { PlanId } from "../../../model/index.ts";
import type { Command, OpenOverlay } from "../../../state/index.ts";
import { addAutomation } from "../automation.commands.ts";
import { createDatabaseApp } from "../database-builder.ts";
import { renderDatabase } from "../database.view.ts";
import { VIEW_SETTINGS_OVERLAY } from "./view-settings.view.ts";

// The view settings on a panel, in a workspace on a plan (or the
// browser's own), with one automation when asked.
function rendered(panel: string, plan?: PlanId, withAutomation = false) {
  const app = createDatabaseApp(
    [
      {
        name: "Stage",
        type: "select",
        options: [{ id: "new", name: "New", color: "gray" }],
      },
    ],
    [],
  );
  const { databaseId } = app;
  if (withAutomation) app.dispatch(addAutomation.create({ databaseId }));
  const automationId = app.database().props.automations?.[0]?.id ?? "";
  const built = app.store.getState();
  const workspace = {
    id: "w1",
    name: "Ada's",
    icon: null,
    role: "owner",
    members: 1,
    plan: plan ?? "plus",
  };
  const sync =
    plan === undefined
      ? built.persistence.sync
      : {
          ...built.persistence.sync,
          workspaces: [workspace],
          workspaceId: "w1",
        };
  const stage = app.propertyIds[0] ?? "";
  const name = panel.replace("{id}", automationId).replace("{stage}", stage);
  const overlay: OpenOverlay = {
    kind: VIEW_SETTINGS_OVERLAY,
    anchorId: databaseId,
    panel: name,
  };
  const state = {
    ...built,
    persistence: { ...built.persistence, sync },
    ui: { ...built.ui, overlay },
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
  const row = (label: string) =>
    [...host.querySelectorAll<HTMLElement>("[data-index]")].find(
      (item) =>
        item.querySelector(".menu__label")?.textContent.trim() === label,
    );
  return { host, sent, row, databaseId, automationId, stage };
}

describe("the view settings' Automations, as Notion's", () => {
  it("offers Upgrade now on the Free plan, which opens Plans", () => {
    const { host, sent } = rendered("automations", "free");
    const upgrade = [...host.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Upgrade now",
    );

    upgrade?.click();

    expect(host.textContent).toContain(
      "Edit properties, create pages, send updates and more automatically",
    );
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "settings", anchorId: "plans" },
      }),
    );
  });

  it("adds an automation on a paid plan", () => {
    const { sent, row, databaseId } = rendered("automations", "plus");

    row("New automation")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "database.addAutomation", databaseId }),
    );
  });

  it("chooses what sets it off from its own list, then goes back", () => {
    const { sent, row, automationId } = rendered(
      "automation-when:{id}",
      undefined,
      true,
    );

    row("Stage edited")?.click();

    expect(sent[0]).toMatchObject({
      type: "database.setAutomation",
      patch: { trigger: { kind: "property-edited" } },
    });
    expect(sent[1]).toMatchObject({
      type: "ui.openOverlayPanel",
      panel: `automation:${automationId}`,
    });
  });

  it("shows When as one row, with Do under it", () => {
    const { sent, row, automationId } = rendered(
      "automation:{id}",
      undefined,
      true,
    );

    row("Page added")?.click();
    row("Edit property")?.click();

    expect(sent[0]).toMatchObject({
      type: "ui.openOverlayPanel",
      panel: `automation-when:${automationId}`,
    });
    expect(sent[1]).toMatchObject({
      type: "ui.openOverlayPanel",
      panel: `automation-set:${automationId}`,
    });
  });

  it("sets a property to the value chosen", () => {
    const { sent, row, stage } = rendered(
      "automation-value:{id}:{stage}",
      undefined,
      true,
    );

    row("New")?.click();

    expect(sent[0]).toMatchObject({
      type: "database.setAutomation",
      patch: { values: { [stage]: "new" } },
    });
  });
});
