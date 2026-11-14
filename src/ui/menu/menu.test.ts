// @vitest-environment happy-dom
import { render } from "lit-html";
import { visibleEntries } from "./menu-entry.ts";
import { describe, expect, it } from "vitest";
import { renderMenu, type MenuItem } from "./index.ts";

function rendered(items: MenuItem[]): HTMLElement {
  const host = document.createElement("div");
  const onClose = (): void => undefined;
  render(renderMenu({ label: "Page actions", items, onClose }), host);
  return host;
}

const noop = (): void => undefined;

describe("renderMenu", () => {
  it("marks a chosen option of a group as a checked radio item", () => {
    const host = rendered([
      { label: "Default", onSelect: noop, check: "radio", isChecked: true },
      { label: "Serif", onSelect: noop, check: "radio", isChecked: false },
    ]);
    const radios = [...host.querySelectorAll("[role=menuitemradio]")];

    expect(radios.map((item) => item.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
    ]);
  });

  it("marks an option that turns on and off as a checkbox item", () => {
    const host = rendered([
      { label: "Small text", onSelect: noop, check: "box", isChecked: true },
    ]);

    const item = host.querySelector("[role=menuitemcheckbox]");
    expect(item?.getAttribute("aria-checked")).toBe("true");
  });

  it("keeps a plain action a menu item without a checked state", () => {
    const host = rendered([{ label: "Duplicate", onSelect: noop }]);

    const item = host.querySelector("[role=menuitem]");
    expect(item?.hasAttribute("aria-checked")).toBe(false);
  });

  it("keeps its search field out of the list of items", () => {
    const host = document.createElement("div");
    const onClose = (): void => undefined;
    const items = [{ label: "Duplicate", onSelect: noop }];
    const search = { placeholder: "Filter", query: "", onQuery: noop };
    render(renderMenu({ label: "Filter", items, onClose, search }), host);

    const list = host.querySelector("[role=menu]");
    expect(list?.getAttribute("aria-label")).toBe("Filter");
    expect(list?.querySelector("input")).toBeNull();
    expect(list?.querySelectorAll("[role=menuitem]")).toHaveLength(1);
  });

  it("makes a row's own actions button an item that opens a menu", () => {
    const host = rendered([
      {
        label: "Weekly",
        onSelect: noop,
        more: { id: "w", menu: () => ({ label: "Weekly", items: [] }) },
      },
    ]);

    const more = host.querySelector(".menu__more");
    expect(more?.getAttribute("role")).toBe("menuitem");
    expect(more?.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("shows a note below the items that is not an item", () => {
    const host = document.createElement("div");
    const onClose = (): void => undefined;
    const items = [{ label: "Duplicate", onSelect: noop }];
    render(
      renderMenu({ label: "Page", items, onClose, footer: "12 words" }),
      host,
    );

    const footer = host.querySelector(".menu__footer");
    expect(footer?.textContent).toBe("12 words");
    expect(footer?.getAttribute("role")).toBe("none");
  });

  it("places a menu opened at a point at that point", () => {
    const host = document.createElement("div");
    const onClose = (): void => undefined;
    const items = [{ label: "Duplicate", onSelect: noop }];
    render(
      renderMenu({ label: "Block", items, onClose, point: { x: 10, y: 20 } }),
      host,
    );

    const menu = host.querySelector<HTMLElement>(".menu");
    expect(menu?.hasAttribute("data-at-point")).toBe(true);
    expect(menu?.style.getPropertyValue("--menu-x")).toBe("10px");
    expect(menu?.style.getPropertyValue("--menu-y")).toBe("20px");
  });
});

describe("a menu's search", () => {
  it("finds the actions inside a submenu, as Notion's", () => {
    const fullWidth = { label: "Full width", onSelect: () => undefined };
    const entries = [
      { label: "Copy link", onSelect: () => undefined },
      {
        label: "Appearance and layout",
        submenu: {
          id: "look",
          menu: () => ({ label: "Look", items: [fullWidth] }),
        },
      },
    ];

    expect(visibleEntries(entries, "full")).toEqual([fullWidth]);
  });
});
