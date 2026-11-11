// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { ViewType } from "../../model/index.ts";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { setViewGroupBy, toggleGroupCollapsed } from "./group.commands.ts";
import { setViewType } from "./view-layout.commands.ts";

const STAGE = {
  name: "Stage",
  type: "select",
  options: [
    { id: "todo", name: "Todo", color: "gray" },
    { id: "done", name: "Done", color: "green" },
  ],
};

function rendered(viewType: ViewType, collapsed: readonly string[] = []) {
  const app = createDatabaseApp(
    [STAGE],
    [
      ["Write", "todo"],
      ["Ship", "done"],
    ],
  );
  const viewId = app.view().id;
  const [propertyId] = app.propertyIds;
  if (propertyId === undefined) throw new Error("no property");
  app.dispatch(setViewType.create({ viewId, viewType }));
  app.dispatch(setViewGroupBy.create({ viewId, propertyId }));
  for (const key of collapsed) {
    app.dispatch(toggleGroupCollapsed.create({ viewId, key }));
  }
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  // No cell is being edited, so every title shows as text.
  const built = app.store.getState();
  const state = { ...built, ui: { ...built.ui, activeCell: null } };
  render(renderDatabase(state, dispatch), host);
  const toggles = [
    ...host.querySelectorAll<HTMLButtonElement>("[aria-expanded]"),
  ].filter((button) => button.closest("[data-group-key]") !== null);
  return { host, sent, toggles, propertyId };
}

describe.each<ViewType>(["table", "list", "gallery"])(
  "a grouped %s",
  (viewType) => {
    it("shows a header for each group and collapses one by its key", () => {
      const { sent, toggles } = rendered(viewType);

      expect(toggles.map((toggle) => toggle.textContent.trim())).toEqual([
        expect.stringContaining("No Stage"),
        expect.stringContaining("Todo"),
        expect.stringContaining("Done"),
      ]);
      toggles[1]?.click();

      expect(sent).toEqual([
        expect.objectContaining({
          type: "view.toggleGroupCollapsed",
          key: "todo",
        }),
      ]);
    });

    it("hides the rows of a collapsed group", () => {
      const { host } = rendered(viewType, ["todo"]);

      expect(host.textContent).not.toContain("Write");
      expect(host.textContent).toContain("Ship");
    });

    it("adds a row with the group's value", () => {
      const { host, sent, propertyId } = rendered(viewType);
      const group = host.querySelector('[data-group-key="done"]');
      const add = [
        ...(group?.parentElement?.querySelectorAll("button") ?? []),
      ].find(
        (button) =>
          button.textContent.trim() === "New" &&
          button.closest("[data-group-add]")?.getAttribute("data-group-add") ===
            "done",
      );

      add?.click();

      expect(sent).toEqual([
        expect.objectContaining({
          type: "row.add",
          values: { [propertyId]: "done" },
        }),
      ]);
    });
  },
);
