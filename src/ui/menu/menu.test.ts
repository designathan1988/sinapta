// @vitest-environment happy-dom
import { render } from "lit-html";
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
});
