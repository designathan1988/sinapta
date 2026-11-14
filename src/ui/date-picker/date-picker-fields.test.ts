// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  datePickerItems,
  renderDatePicker,
  type DateRangeValue,
} from "./index.ts";

// The picker drawn with a value; each change is kept, and items() lists
// the rows under it for that value.
function mount(value: DateRangeValue | undefined) {
  const changes: (DateRangeValue | undefined)[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  const props = (shown: DateRangeValue | undefined) => ({
    label: "Due",
    value: shown,
    month: "2026-11",
    today: "2026-11-11",
    onChange: (next: DateRangeValue | undefined) => changes.push(next),
    onMonth: () => undefined,
  });
  render(renderDatePicker(props(value)), host);
  const item = (label: string) => {
    const found = datePickerItems(props(value)).find(
      (entry) => "label" in entry && entry.label === label,
    );
    if (found === undefined || !("onSelect" in found)) {
      throw new Error(`no ${label}`);
    }
    return found;
  };
  return { host, changes, item, props };
}

describe("the picker's fields, as Notion's", () => {
  it("offers an empty field for a day typed before any is chosen, as Notion's", () => {
    const { host, changes } = mount(undefined);
    const field = host.querySelector<HTMLInputElement>(
      "input.date-picker__field[type=text]",
    );

    expect(field?.value).toBe("");
    if (field) field.value = "Nov 20";
    field?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(changes).toEqual([{ start: "2026-11-20" }]);
  });

  it("gives the end its own time, beside the end's day", () => {
    const { host, changes, item, props } = mount({
      start: "2026-11-16",
      end: "2026-11-20",
    });

    item("Include time").onSelect?.();
    render(renderDatePicker(props(changes[0])), host);
    const times = host.querySelectorAll<HTMLInputElement>(
      "input.date-picker__field[type=time]",
    );
    const endTime = times[1];
    if (endTime) endTime.value = "17:30";
    endTime?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(changes).toEqual([
      {
        start: "2026-11-16",
        end: "2026-11-20",
        time: "09:00",
        endTime: "09:00",
      },
      {
        start: "2026-11-16",
        end: "2026-11-20",
        time: "09:00",
        endTime: "17:30",
      },
    ]);
  });
});
