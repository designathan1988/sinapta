// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { SELECT_OVERLAY } from "../../ui/select/index.ts";
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
  // The date's fields show in the popover its value opens.
  const overlay = {
    kind: SELECT_OVERLAY,
    anchorId: `row-${rowId}-${app.propertyIds[0] ?? ""}`,
  };
  const show = () => {
    const state = app.store.getState();
    const ui = { ...state.ui, activePageId: rowId, overlay };
    render(renderRowProperties({ ...state, ui }, app.dispatch), container);
  };
  show();
  const day = (date: string) => {
    const found = container.querySelector<HTMLElement>(`[data-day="${date}"]`);
    if (found === null) throw new Error(`no ${date}`);
    return found;
  };
  const row = (label: string) => {
    const found = [
      ...container.querySelectorAll<HTMLElement>(".menu [data-index]"),
    ].find((item) => item.textContent.trim() === label);
    if (found === undefined) throw new Error(`no ${label}`);
    return found;
  };
  const press = (element: HTMLElement) => {
    element.click();
    show();
  };
  const due = () => {
    const values = selectPage(app.store.getState(), rowId)?.props.values;
    return values?.[app.propertyIds[0] ?? ""];
  };
  return { container, day, row, press, due, show };
}

describe("a date on the row's page", () => {
  it("marks the first day, the last day and shows the time", () => {
    const { container, day } = mount({
      start: "2026-11-10",
      end: "2026-11-12",
      time: "09:30",
    });

    expect(day("2026-11-10").getAttribute("aria-pressed")).toBe("true");
    expect(day("2026-11-12").getAttribute("aria-pressed")).toBe("true");
    expect(day("2026-11-11").hasAttribute("data-in-range")).toBe(true);
    expect(
      container.querySelector<HTMLInputElement>("input[type=time]")?.value,
    ).toBe("09:30");
  });

  it("stores a range and a time", () => {
    const { row, day, press, due } = mount({ start: "2026-11-10" });

    press(row("End date"));
    press(day("2026-11-14"));
    press(row("Include time"));

    expect(due()).toEqual({
      start: "2026-11-10",
      end: "2026-11-14",
      time: "09:00",
    });
  });

  it("changes the time from its field", () => {
    const { container, due, show } = mount({
      start: "2026-11-10",
      time: "09:00",
    });
    const time = container.querySelector<HTMLInputElement>("input[type=time]");

    if (time !== null) time.value = "18:00";
    time?.dispatchEvent(new Event("change", { bubbles: true }));
    show();

    expect(due()).toEqual({ start: "2026-11-10", time: "18:00" });
  });

  it("clears the date", () => {
    const { row, press, due } = mount({ start: "2026-11-10" });

    press(row("Clear"));

    expect(due()).toBeUndefined();
  });
});
