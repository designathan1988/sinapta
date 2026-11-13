// @vitest-environment happy-dom
import { html, render } from "lit-html";
import { describe, expect, it } from "vitest";
import { renderMenu } from "./index.ts";

const noop = (): void => undefined;

// A menu whose head is a name field, as a view's settings, over two rows.
function rendered(type = "text") {
  const closed: string[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  const items = [
    { label: "Layout", onSelect: noop },
    { label: "Filter", onSelect: noop },
  ];
  const lead = html`<input type=${type} aria-label="View name" />`;
  const onClose = (): void => {
    closed.push("closed");
  };
  render(renderMenu({ label: "View settings", items, onClose, lead }), host);
  const field = host.querySelector("input");
  if (field === null) throw new Error("no field");
  field.focus();
  const press = (key: string) =>
    field.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  const rows = [...host.querySelectorAll<HTMLElement>("[data-index]")];
  return { field, press, rows, closed };
}

describe("a menu's name field", () => {
  it("passes the arrows on to the rows below it", () => {
    const down = rendered();
    down.press("ArrowDown");
    expect(document.activeElement).toBe(down.rows[0]);

    const up = rendered();
    up.press("ArrowUp");
    expect(document.activeElement).toBe(up.rows.at(-1));
  });

  it("closes the menu on Tab, as its rows do", () => {
    const { press, closed } = rendered();
    press("Tab");
    expect(closed).toEqual(["closed"]);
  });

  it("keeps the arrows of a number field, which step its value", () => {
    const { field, press } = rendered("number");
    press("ArrowDown");
    expect(document.activeElement).toBe(field);
  });
});
