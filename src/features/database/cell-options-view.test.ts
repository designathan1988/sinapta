// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { CELL_OPTIONS_OVERLAY } from "./table-cell.view.ts";

const OPTIONS = [
  { id: "todo", name: "Todo", color: "gray" },
  { id: "done", name: "Done", color: "green" },
];

// A row whose Stage is Todo, with the editor of one of its cells open.
function rendered(column: "stage" | "status", query?: string) {
  const app = createDatabaseApp(
    [
      { name: "Stage", type: "select", options: OPTIONS },
      { name: "Status", type: "status" },
    ],
    [["Row", "todo", undefined]],
  );
  const [stage, status] = app.propertyIds;
  const rowId = app.rowIds[0];
  if (stage === undefined || status === undefined || rowId === undefined)
    throw new Error("setup");
  const propertyId = column === "stage" ? stage : status;
  const overlay: OpenOverlay = {
    kind: CELL_OPTIONS_OVERLAY,
    anchorId: `${rowId}:${propertyId}`,
    ...(query !== undefined && { query }),
  };
  const built = app.store.getState();
  const state = { ...built, ui: { ...built.ui, overlay } };
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
  const editor = host
    .querySelector(".database__option-field")
    ?.closest<HTMLElement>(".menu");
  const row = (text: string) =>
    [...(editor?.querySelectorAll<HTMLElement>("[data-index]") ?? [])].find(
      (item) =>
        item.textContent.replace(/\s+/g, "") === text.replace(/\s+/g, ""),
    );
  const sections = () =>
    [...(editor?.querySelectorAll(".menu__section") ?? [])].map((item) =>
      item.textContent.trim(),
    );
  return { app, sent, editor, row, sections, rowId, stage };
}

describe("a select cell's editor", () => {
  it("puts the chosen option and the search field first, then the hint", () => {
    const { editor, sections, row } = rendered("stage");
    const field = editor?.querySelector(".database__option-field");

    expect(editor?.firstElementChild).toBe(field);
    expect(field?.querySelector(".chip")?.textContent).toContain("Todo");
    expect(field?.querySelector("input")?.placeholder).toBe(
      "Search for an option...",
    );
    expect(sections()[0]).toBe("Select an option or create one");
    expect(row("Todo")).toBeDefined();
    expect(row("Done")).toBeDefined();
  });

  it("chooses an option, and takes the chosen one off from its ×", () => {
    const { editor, sent, row, rowId, stage } = rendered("stage");

    row("Done")?.click();
    editor
      ?.querySelector<HTMLElement>(".database__option-field .chip button")
      ?.click();

    const values = sent
      .filter((command) => command.type === "row.setValue")
      .map((command) => ("value" in command ? command.value : null));
    expect(values).toEqual(["done", undefined]);
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "row.setValue",
        rowId,
        propertyId: stage,
      }),
    );
  });

  it("keeps what is typed, lists what matches, and offers to create it", () => {
    const { sent, row, rowId } = rendered("stage", "Wip");

    expect(row("Todo")).toBeUndefined();
    row("Create Wip")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "property.addOption",
        name: "Wip",
        rowId,
      }),
    );
  });

  it("follows the field as it is typed in", () => {
    const { editor, sent } = rendered("stage");
    const input = editor?.querySelector("input");
    if (input) input.value = "Do";

    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "ui.setOverlayQuery", query: "Do" }),
    );
  });
});

describe("a status cell's editor", () => {
  it("groups the options under To-do, In progress and Complete", () => {
    const { sections } = rendered("status");

    expect(sections()).toEqual([
      "Select an option or create one",
      "To-do",
      "In progress",
      "Complete",
    ]);
  });
});
