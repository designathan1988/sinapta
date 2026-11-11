// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { GROUP_MENU_OVERLAY, groupMenuAnchor } from "./group-actions.ts";
import { setViewGroupBy } from "./group.commands.ts";

// A table grouped by a select, with the menu of the "Done" group open
// when asked.
function rendered(isMenuOpen = false) {
  const app = createDatabaseApp(
    [
      {
        name: "Stage",
        type: "select",
        options: [
          { id: "todo", name: "Todo", color: "gray" },
          { id: "done", name: "Done", color: "green" },
        ],
      },
    ],
    [["Ship", "done"]],
  );
  const viewId = app.view().id;
  const [stage] = app.propertyIds;
  if (stage === undefined) throw new Error("setup");
  app.dispatch(setViewGroupBy.create({ viewId, propertyId: stage }));
  const built = app.store.getState();
  const anchorId = groupMenuAnchor(app.databaseId, "done");
  const overlay: OpenOverlay | null = isMenuOpen
    ? { kind: GROUP_MENU_OVERLAY, anchorId }
    : null;
  const state = { ...built, ui: { ...built.ui, activeCell: null, overlay } };
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
  const header = host.querySelector('[data-group-key="done"]');
  const button = (label: string) => {
    const found = header?.querySelector<HTMLElement>(`[aria-label="${label}"]`);
    if (found === null || found === undefined) throw new Error(`no ${label}`);
    return found;
  };
  return { host, sent, button, anchorId, stage };
}

describe("a group's header", () => {
  it("adds a row with the group's value from its +", () => {
    const { sent, button, stage } = rendered();

    button("New row in Done").click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "row.add",
        values: { [stage]: "done" },
      }),
    ]);
  });

  it("opens the group's menu from its …, anchored to the button", () => {
    const closed = rendered();
    const open = rendered(true);

    closed.button("Actions for Done").click();

    expect(closed.sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: GROUP_MENU_OVERLAY, anchorId: closed.anchorId },
      }),
    ]);
    expect(open.button("Actions for Done").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("hides the group from its menu", () => {
    const { host, sent } = rendered(true);
    const hide = [
      ...host.querySelectorAll<HTMLElement>(".menu [data-index]"),
    ].find((row) => row.textContent.trim() === "Hide");

    hide?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "ui.closeOverlay",
      "view.toggleGroupHidden",
    ]);
  });
});
