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

describe("a menu's tiles", () => {
  it("are stops of the arrows, in their place above the rows", () => {
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    const items = [{ label: "Card size", onSelect: noop }];
    const lead = html`<button type="button" data-arrow-stop>Board</button>`;
    render(renderMenu({ label: "Layout", items, onClose: noop, lead }), host);
    const [tile, row] = [
      host.querySelector<HTMLElement>("[data-arrow-stop]"),
      host.querySelector<HTMLElement>("[data-index]"),
    ];
    row?.focus();
    const press = (key: string) =>
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );

    press("ArrowUp");
    expect(document.activeElement).toBe(tile);
    press("ArrowDown");
    expect(document.activeElement).toBe(row);
  });
});

describe("a panel's own controls", () => {
  it("are stops of the arrows, but not the header's back and close", () => {
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    const lead = html`<button type="button" class="rule">Red</button>
      <button type="button" class="add">New color setting</button>`;
    render(
      renderMenu({
        label: "Conditional color",
        title: "Conditional color",
        onBack: noop,
        items: [],
        onClose: noop,
        lead,
      }),
      host,
    );
    const rule = host.querySelector<HTMLElement>(".rule");
    const add = host.querySelector<HTMLElement>(".add");
    rule?.focus();
    const press = (key: string) =>
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );

    press("ArrowDown");
    expect(document.activeElement).toBe(add);
    press("ArrowDown");
    expect(document.activeElement).toBe(rule);
  });
});

describe("a menu's description field", () => {
  it("keeps the arrows inside its text and passes them on at its ends", () => {
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    const items = [{ label: "Number format", onSelect: noop }];
    const lead = html`<textarea aria-label="Description"></textarea>`;
    render(renderMenu({ label: "Settings", items, onClose: noop, lead }), host);
    const field = host.querySelector("textarea");
    if (field === null) throw new Error("no field");
    field.value = "one\ntwo";
    field.focus();
    const press = (key: string) =>
      field.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

    field.setSelectionRange(0, 0);
    press("ArrowDown");
    expect(document.activeElement).toBe(field);

    field.setSelectionRange(7, 7);
    press("ArrowDown");
    expect(document.activeElement).toBe(host.querySelector("[data-index]"));
  });
});
