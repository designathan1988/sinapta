// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderRowProperties } from "./row-properties.view.ts";

// Renders a row's date property on the row's page.
function mount(value?: unknown) {
  const app = createDatabaseApp(
    [{ name: "Due", type: "date" }],
    [value === undefined ? ["A"] : ["A", value]],
  );
  const rowId = app.rowIds[0];
  if (rowId === undefined) throw new Error("setup");
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  const show = () => {
    const state = app.store.getState();
    const ui = { ...state.ui, activePageId: rowId };
    render(renderRowProperties({ ...state, ui }, app.dispatch), container);
  };
  show();
  const part = (name: string) => {
    const input = container.querySelector(`[data-part="${name}"]`);
    if (!(input instanceof HTMLInputElement)) throw new Error(`no ${name}`);
    return input;
  };
  const change = (name: string, value: string) => {
    const input = part(name);
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    show();
  };
  const due = () => {
    const values = selectPage(app.store.getState(), rowId)?.props.values;
    return values?.[app.propertyIds[0] ?? ""];
  };
  return { part, change, due };
}

describe("a date on the row's page", () => {
  it("shows the first day, the last day and the time", () => {
    const { part } = mount({
      start: "2026-11-10",
      end: "2026-11-12",
      time: "09:30",
    });

    expect(part("start").value).toBe("2026-11-10");
    expect(part("end").value).toBe("2026-11-12");
    expect(part("time").value).toBe("09:30");
  });

  it("stores a range and a time", () => {
    const { change, due } = mount();

    change("start", "2026-11-10");
    change("end", "2026-11-14");
    change("time", "18:00");

    expect(due()).toEqual({
      start: "2026-11-10",
      end: "2026-11-14",
      time: "18:00",
    });
  });

  it("refuses an end before the start and keeps the stored date", () => {
    const { change, due, part } = mount({ start: "2026-11-10" });

    change("end", "2026-11-01");

    expect(due()).toEqual({ start: "2026-11-10" });
    expect(part("end").getAttribute("aria-invalid")).toBe("");
  });

  it("clears the date when the first day is emptied", () => {
    const { change, due } = mount({ start: "2026-11-10", time: "08:00" });

    change("start", "");

    expect(due()).toBeUndefined();
  });
});
