// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createInitialState } from "../../../../state/index.ts";
import { SELECT_OVERLAY } from "../../../../ui/select/index.ts";
import { toBlockId } from "../../../../model/index.ts";
import { toPropertyId } from "../../database-builder.ts";
import { renderNumberConfig } from "./number-config.view.ts";

function rendered(config?: unknown, open?: string) {
  const property = {
    id: toPropertyId("p"),
    name: "Price",
    type: "number",
    config,
  };
  const initial = createInitialState();
  const overlay =
    open === undefined ? null : { kind: SELECT_OVERLAY, anchorId: `p-${open}` };
  const state = { ...initial, ui: { ...initial.ui, overlay } };
  const context = {
    databaseId: toBlockId("db"),
    state,
    dispatch: () => ({ ok: true }) as const,
  };
  const changes: unknown[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderNumberConfig(property, (next) => changes.push(next), context),
    host,
  );
  const pick = (label: string) => {
    const option = [
      ...host.querySelectorAll<HTMLElement>("[role=option]"),
    ].find((item) => item.textContent.trim() === label);
    if (option === undefined) throw new Error(`no ${label} option`);
    option.click();
  };
  return { host, changes, pick };
}

describe("renderNumberConfig", () => {
  it("sets the format from its list", () => {
    const { changes, pick } = rendered(undefined, "format");

    pick("Percent");

    expect(changes).toEqual([{ format: "percent", display: "number" }]);
  });

  it("offers currencies only for the currency format, searchable", () => {
    expect(
      rendered().host.querySelector('[data-field="p-currency"]'),
    ).toBeNull();
    const { host, changes, pick } = rendered(
      { format: "currency", display: "number" },
      "currency",
    );

    pick("BRL");

    expect(host.querySelector(".menu__search")).not.toBeNull();
    expect(changes).toEqual([
      { format: "currency", display: "number", currency: "BRL" },
    ]);
  });

  it("sets what a full bar stands for", () => {
    const { host, changes } = rendered({ format: "number", display: "bar" });
    const field = host.querySelector<HTMLInputElement>(
      '[data-field="divideBy"]',
    );
    const type = (value: string) => {
      if (field === null) throw new Error("no divisor field");
      field.value = value;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    };

    type("250");
    type("-3");

    expect(changes).toEqual([
      { format: "number", display: "bar", divideBy: 250 },
    ]);
  });

  it("shows a number as Ring from its pictured tile, with Notion's note", () => {
    const { host, changes } = rendered();
    const tiles = [...host.querySelectorAll<HTMLElement>(".tiles__tile")];

    expect(
      tiles.map((tile) => tile.textContent.replace(/\s+/g, " ").trim()),
    ).toEqual(["42 Number", "Bar", "Ring"]);
    tiles[2]?.click();

    expect(changes).toEqual([{ format: "number", display: "ring" }]);
    expect(host.textContent).toContain(
      "Changes apply to all views showing this property.",
    );
  });
});
