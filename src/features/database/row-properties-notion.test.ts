// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { SELECT_OVERLAY } from "../../ui/select/index.ts";
import { setPropertyConfig } from "./database.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderRowProperties } from "./row-properties.view.ts";

const TAGS = {
  name: "Tags",
  type: "multi-select",
  options: [
    { id: "a", name: "Alpha", color: "blue" },
    { id: "b", name: "Beta", color: "green" },
  ],
};

// A row with points, a formula doubling them, a due date and tags, its
// page showing its properties; `open` names the property whose editor
// is open.
function mount(open?: "Due" | "Tags") {
  const app = createDatabaseApp(
    [
      { name: "Points", type: "number" },
      { name: "Twice", type: "formula" },
      { name: "Due", type: "date" },
      TAGS,
    ],
    [["A", 4, undefined, { start: "2026-11-10" }, ["a"]]],
  );
  const [, twice, due, tags] = app.propertyIds;
  const rowId = app.rowIds[0];
  if (rowId === undefined || twice === undefined) throw new Error("setup");
  app.dispatch(
    setPropertyConfig.create({
      databaseId: app.databaseId,
      propertyId: twice,
      config: { expression: 'prop("Points") * 2' },
    }),
  );
  const openId = open === "Due" ? due : open === "Tags" ? tags : undefined;
  const overlay: OpenOverlay | null =
    openId === undefined
      ? null
      : { kind: SELECT_OVERLAY, anchorId: `row-${rowId}-${openId}` };
  const built = app.store.getState();
  const state = { ...built, ui: { ...built.ui, activePageId: rowId, overlay } };
  const sent: Command[] = [];
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  render(
    renderRowProperties(state, (command) => {
      sent.push(command);
      return app.dispatch(command);
    }),
    container,
  );
  const property = (name: string) => {
    const found = [
      ...container.querySelectorAll<HTMLElement>(".database__row-property"),
    ].find(
      (item) =>
        item.querySelector(".database__row-name")?.textContent.trim() === name,
    );
    if (found === undefined) throw new Error(`no ${name}`);
    return found;
  };
  const stored = (id: string | undefined) =>
    selectPage(app.store.getState(), rowId)?.props.values?.[id ?? ""];
  return { container, property, sent, stored, due, tags };
}

describe("a row's properties, as Notion's row page shows them", () => {
  it("names each with its type's icon", () => {
    const { container } = mount();

    const names = [...container.querySelectorAll(".database__row-name")];

    expect(names.every((name) => name.querySelector(".icon") !== null)).toBe(
      true,
    );
  });

  it("shows a formula's worked-out value", () => {
    const { property } = mount();

    expect(property("Twice").textContent).toContain("8");
  });

  it("shows a date as text that opens its calendar", () => {
    const closed = mount();
    const open = mount("Due");

    expect(closed.property("Due").querySelector(".date-picker")).toBeNull();
    expect(
      closed.property("Due").querySelector(".select")?.textContent,
    ).toContain("2026");
    expect(
      open
        .property("Due")
        .querySelector('[data-day="2026-11-10"]')
        ?.getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("shows tags as chips that open their options, each one ticked or not", () => {
    const { property, stored, tags } = mount("Tags");
    const options = [
      ...property("Tags").querySelectorAll<HTMLElement>(".menu [data-index]"),
    ];

    options.find((option) => option.textContent.includes("Beta"))?.click();

    expect(property("Tags").querySelector(".select .chip")?.textContent).toBe(
      "Alpha",
    );
    expect(
      options.map((option) => option.getAttribute("aria-checked")),
    ).toEqual(["true", "false"]);
    expect(stored(tags)).toEqual(["a", "b"]);
  });
});
