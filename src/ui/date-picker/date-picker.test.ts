// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  datePickerItems,
  renderDatePicker,
  type DatePickerProps,
  type DateRangeValue,
} from "./index.ts";

function mount(value: DateRangeValue | undefined) {
  const changes: (DateRangeValue | undefined)[] = [];
  const months: string[] = [];
  const props: DatePickerProps = {
    label: "Due",
    value,
    month: "2026-11",
    today: "2026-11-11",
    onChange: (next) => changes.push(next),
    onMonth: (month) => months.push(month),
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatePicker(props), host);
  const day = (date: string) => {
    const found = host.querySelector<HTMLElement>(`[data-day="${date}"]`);
    if (found === null) throw new Error(`no ${date}`);
    return found;
  };
  const items = datePickerItems(props);
  const item = (label: string) => {
    const found = items.find(
      (entry) =>
        entry.kind !== "section" &&
        entry.kind !== "divider" &&
        entry.label === label,
    );
    if (
      found === undefined ||
      found.kind === "section" ||
      found.kind === "divider"
    ) {
      throw new Error(`no ${label}`);
    }
    return found;
  };
  return { host, changes, months, day, item };
}

describe("renderDatePicker", () => {
  it("shows the month's six weeks under its name, today and the chosen day marked", () => {
    const { host, day } = mount({ start: "2026-11-20" });

    expect(host.querySelector(".date-picker__month")?.textContent).toBe(
      "Nov 2026",
    );
    expect(host.querySelectorAll("[data-day]")).toHaveLength(42);
    expect(day("2026-11-11").hasAttribute("data-today")).toBe(true);
    expect(day("2026-11-20").getAttribute("aria-pressed")).toBe("true");
    expect(day("2026-12-01").hasAttribute("data-outside")).toBe(true);
  });

  it("chooses a day, keeping the time", () => {
    const { changes, day } = mount({ start: "2026-11-20", time: "09:30" });

    day("2026-11-03").click();

    expect(changes).toEqual([{ start: "2026-11-03", time: "09:30" }]);
  });

  it("with an end, a later day ends the range and an earlier one starts it", () => {
    const { changes, day } = mount({ start: "2026-11-10", end: "2026-11-12" });

    day("2026-11-15").click();
    day("2026-11-02").click();

    expect(changes).toEqual([
      { start: "2026-11-10", end: "2026-11-15" },
      { start: "2026-11-02", end: "2026-11-12" },
    ]);
  });

  it("moves between months and back to today's", () => {
    const { host, months } = mount(undefined);
    const button = (label: string) =>
      host.querySelector<HTMLElement>(`[aria-label="${label}"]`);

    button("Previous month")?.click();
    button("Next month")?.click();
    button("Today")?.click();

    expect(months).toEqual(["2026-10", "2026-12", "2026-11"]);
  });
});

describe("datePickerItems", () => {
  it("turns the end and the time on and off, and clears the date", () => {
    const { changes, item } = mount({ start: "2026-11-10" });

    item("End date").onSelect?.();
    item("Include time").onSelect?.();
    item("Clear").onSelect?.();

    expect(item("End date").check).toBe("switch");
    expect(changes).toEqual([
      { start: "2026-11-10", end: "2026-11-10" },
      { start: "2026-11-10", time: "09:00" },
      undefined,
    ]);
  });
});
