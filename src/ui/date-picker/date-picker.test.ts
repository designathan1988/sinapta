// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  datePickerItems,
  renderDatePicker,
  type DatePickerProps,
  type DateRangeValue,
} from "./index.ts";

function mount(
  value: DateRangeValue | undefined,
  more: Partial<DatePickerProps> = {},
) {
  const changes: (DateRangeValue | undefined)[] = [];
  const months: string[] = [];
  const props: DatePickerProps = {
    label: "Due",
    value,
    month: "2026-11",
    today: "2026-11-11",
    onChange: (next) => changes.push(next),
    onMonth: (month) => months.push(month),
    ...more,
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
        entry.kind !== "note" &&
        entry.label === label,
    );
    if (
      found === undefined ||
      found.kind === "section" ||
      found.kind === "divider" ||
      found.kind === "note"
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

  it("marks which end of a range each chosen day is, for Notion's band", () => {
    const { day } = mount({ start: "2026-11-08", end: "2026-11-14" });
    const single = mount({ start: "2026-11-08" });

    expect(day("2026-11-08").getAttribute("data-range")).toBe("start");
    expect(day("2026-11-14").getAttribute("data-range")).toBe("end");
    expect(day("2026-11-10").hasAttribute("data-range")).toBe(false);
    expect(single.day("2026-11-08").hasAttribute("data-range")).toBe(false);
  });

  it("draws the month's arrows as Notion's chevrons", () => {
    const { host } = mount(undefined);
    const icons = [...host.querySelectorAll(".date-picker__nav svg")].map(
      (icon) => icon.getAttribute("data-icon"),
    );

    expect(icons).toEqual(["back", "chevron"]);
  });

  it("shows a month that is only shown as Notion's filter: no Today, the days after the range grey", () => {
    const { host, day } = mount(
      { start: "2026-11-13", end: "2026-11-20" },
      { isShownOnly: true },
    );

    expect(host.querySelector(".date-picker__today")).toBeNull();
    expect(host.querySelectorAll(".date-picker__nav")).toHaveLength(2);
    expect(host.querySelector("[data-shown-only]")).not.toBeNull();
    expect(day("2026-11-21").hasAttribute("data-after")).toBe(true);
    expect(day("2026-11-20").hasAttribute("data-after")).toBe(false);
    expect(day("2026-11-01").hasAttribute("data-after")).toBe(false);
  });

  it("greys no day of a month that can be chosen", () => {
    const { host, day } = mount({ start: "2026-11-13", end: "2026-11-20" });

    expect(host.querySelector("[data-shown-only]")).toBeNull();
    expect(day("2026-11-21").hasAttribute("data-after")).toBe(false);
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

  it("takes a day typed into its field, and keeps the end and time", () => {
    const { host, changes } = mount({
      start: "2026-11-10",
      end: "2026-11-30",
      time: "10:00",
    });
    const [start, end] = host.querySelectorAll<HTMLInputElement>(
      "input.date-picker__field[type=text]",
    );

    if (start) start.value = "Nov 20";
    start?.dispatchEvent(new Event("change", { bubbles: true }));
    if (end) end.value = "12/24/2026";
    end?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(changes).toEqual([
      { start: "2026-11-20", end: "2026-11-30", time: "10:00" },
      { start: "2026-11-10", end: "2026-12-24", time: "10:00" },
    ]);
  });

  it("puts a typed day that cannot be read back as it was", () => {
    const { host, changes } = mount({ start: "2026-11-10" });
    const field = host.querySelector<HTMLInputElement>(
      "input.date-picker__field[type=text]",
    );

    if (field) field.value = "someday";
    field?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(changes).toEqual([]);
    expect(field?.value).toBe("Nov 10, 2026");
  });

  it("keeps a range in order when a typed day passes its other end", () => {
    const { host, changes } = mount({ start: "2026-11-10", end: "2026-11-12" });
    const [start] = host.querySelectorAll<HTMLInputElement>(
      "input.date-picker__field[type=text]",
    );

    if (start) start.value = "Nov 20";
    start?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(changes).toEqual([{ start: "2026-11-12", end: "2026-11-20" }]);
  });

  it("sets a reminder from its Remind list", () => {
    const { changes, item } = mount({ start: "2026-11-10" });
    const remind = item("Remind");
    const choices = remind.submenu?.menu().items ?? [];
    const dayBefore = choices.find(
      (entry) => "label" in entry && entry.label === "1 day before",
    );

    if (dayBefore && "onSelect" in dayBefore) dayBefore.onSelect?.();

    expect(changes).toEqual([{ start: "2026-11-10", remind: "1-day" }]);
  });
});
