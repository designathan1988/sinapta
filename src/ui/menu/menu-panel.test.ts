// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import { renderMenu, type MenuEntry, type MenuOptions } from "./index.ts";

const noop = (): void => undefined;

function rendered(
  entries: readonly MenuEntry[],
  extra: Partial<MenuOptions> = {},
) {
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  const onClose = vi.fn();
  render(
    renderMenu({ label: "Settings", items: entries, onClose, ...extra }),
    host,
  );
  return { host, onClose };
}

function click(element: Element | null | undefined): void {
  element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

describe("menu panels", () => {
  it("labels sections and divides them without making either an item", () => {
    const { host } = rendered([
      { kind: "section", label: "View" },
      { label: "Layout", onSelect: noop },
      { kind: "divider" },
      { label: "Delete view", onSelect: noop },
    ]);

    expect(host.querySelector(".menu__section")?.textContent.trim()).toBe(
      "View",
    );
    expect(host.querySelector("[role=separator]")).not.toBeNull();
    expect(host.querySelectorAll("[role=menuitem]")).toHaveLength(2);
  });

  it("shows a title with a back and a close button", () => {
    const onBack = vi.fn();
    const { host, onClose } = rendered([{ label: "Name", onSelect: noop }], {
      title: "Group by",
      onBack,
    });

    click(host.querySelector(".menu__back"));
    click(host.querySelector(".menu__close"));

    expect(host.querySelector(".menu__title")?.textContent).toBe("Group by");
    expect(onBack).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows a row's value and opens its panel without closing the menu", () => {
    const onSelect = vi.fn();
    const { host, onClose } = rendered([
      { label: "Layout", value: "Table", opensPanel: true, onSelect },
    ]);
    const row = host.querySelector("[role=menuitem]");

    click(row);

    expect(row?.querySelector(".menu__value")?.textContent).toBe("Table");
    expect(row?.querySelector('[data-icon="chevron"]')).not.toBeNull();
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("turns a switch on and off and stays open", () => {
    const onSelect = vi.fn();
    const { host, onClose } = rendered([
      {
        label: "Hide empty groups",
        check: "switch",
        isChecked: true,
        onSelect,
      },
    ]);
    const row = host.querySelector("[role=menuitemcheckbox]");

    click(row);

    expect(row?.getAttribute("aria-checked")).toBe("true");
    expect(row?.querySelector(".switch")?.hasAttribute("data-on")).toBe(true);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("searches its items and chooses the first match with Enter", () => {
    const onQuery = vi.fn();
    const chosen = vi.fn();
    const { host } = rendered(
      [
        { label: "Status", onSelect: noop },
        { label: "Due date", onSelect: chosen },
      ],
      { search: { placeholder: "Search", query: "du", onQuery } },
    );
    const input = host.querySelector<HTMLInputElement>(".menu__search input");

    expect(input?.value).toBe("du");
    expect(
      [...host.querySelectorAll("[role=menuitem]")].map((item) =>
        item.textContent.trim(),
      ),
    ).toEqual(["Due date"]);
    if (input) input.value = "due";
    input?.dispatchEvent(new Event("input", { bubbles: true }));
    input?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(onQuery).toHaveBeenCalledWith("due");
    expect(chosen).toHaveBeenCalledOnce();
  });

  it("focuses the search field of a panel that comes in, once", async () => {
    const { host } = rendered([{ label: "Group", onSelect: noop }]);
    const items = [{ label: "Due date", onSelect: noop }];
    const search = { placeholder: "Search", query: "", onQuery: noop };
    const show = () => {
      render(
        renderMenu({ label: "Settings", items, onClose: noop, search }),
        host,
      );
    };
    const input = () =>
      host.querySelector<HTMLInputElement>(".menu__search input");

    // The field is focused once lit has put it in the document.
    show();
    await Promise.resolve();
    expect(document.activeElement).toBe(input());
    input()?.blur();
    show();
    await Promise.resolve();

    expect(document.activeElement).not.toBe(input());
  });

  it("lists options to choose one from, the chosen one checked", () => {
    const { host } = rendered(
      [
        { label: "Board", onSelect: noop, check: "radio", isChecked: true },
        { label: "Table", onSelect: noop, check: "radio" },
      ],
      { role: "listbox" },
    );

    expect(host.querySelector(".menu__list")?.getAttribute("role")).toBe(
      "listbox",
    );
    expect(
      [...host.querySelectorAll("[role=option]")].map((option) =>
        option.getAttribute("aria-selected"),
      ),
    ).toEqual(["true", "false"]);
  });

  it("shows an option as a colored chip with a description", () => {
    const { host } = rendered([
      {
        label: "Done",
        color: "green",
        description: "Work that is finished",
        onSelect: noop,
      },
    ]);

    expect(host.querySelector(".chip")?.getAttribute("data-color")).toBe(
      "green",
    );
    expect(host.querySelector(".menu__description")?.textContent).toBe(
      "Work that is finished",
    );
  });
});
