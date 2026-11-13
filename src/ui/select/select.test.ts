// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it, vi } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { renderSelect, SELECT_OVERLAY, type SelectProps } from "./index.ts";

const OPTIONS = [
  { value: "and", label: "And" },
  { value: "or", label: "Or" },
];

function rendered(
  overlay: OpenOverlay | null,
  props: Partial<SelectProps> = {},
  isInSubmenu = false,
) {
  const sent: Command[] = [];
  const dispatch = (command: Command) => {
    sent.push(command);
    return { ok: true } as const;
  };
  const onChoose = vi.fn();
  const host = document.createElement("div");
  // A select in a submenu sits inside that submenu's panel.
  const submenu = document.createElement("div");
  Object.assign(submenu.dataset, { overlay: "", child: "" });
  submenu.append(host);
  document.body.replaceChildren(isInSubmenu ? submenu : host);
  render(
    renderSelect(
      {
        id: "join",
        label: "Join",
        value: "and",
        options: OPTIONS,
        onChoose,
        ...props,
      },
      { overlay, dispatch },
    ),
    host,
  );
  const trigger = host.querySelector<HTMLButtonElement>(".select");
  return { host, sent, onChoose, trigger };
}

describe("renderSelect", () => {
  it("is named by its label followed by the option it shows", () => {
    const { host, trigger } = rendered(null);
    const ids = trigger?.getAttribute("aria-labelledby")?.split(" ") ?? [];

    expect(trigger?.hasAttribute("aria-label")).toBe(false);
    expect(ids.map((id) => host.querySelector(`#${id}`))).toEqual([
      host.querySelector(".select__name"),
      trigger,
    ]);
    expect(host.querySelector(".select__name")?.textContent).toBe("Join");
  });

  it("shows the chosen option and opens its list as the overlay", () => {
    const { sent, trigger } = rendered(null);

    trigger?.click();

    expect(trigger?.textContent).toContain("And");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: SELECT_OVERLAY, anchorId: "join" },
      }),
    ]);
  });

  it("opens its list inside an overlay that is already open", () => {
    const { sent, trigger } = rendered({ kind: "filters", anchorId: "db" });

    trigger?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: "join",
      }),
    ]);
  });

  it("opens its list beside the submenu it sits in, keeping that one", () => {
    const overlay = {
      kind: "column-menu",
      anchorId: "p1",
      children: [{ anchorId: "edit" }],
    };
    const closed = rendered(overlay, {}, true);
    closed.trigger?.click();
    const open = rendered(
      { ...overlay, children: [{ anchorId: "edit" }, { anchorId: "join" }] },
      {},
      true,
    );

    expect(closed.sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: "join",
        depth: 1,
      }),
    ]);
    expect(open.trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(open.host.querySelectorAll("[role=option]")).toHaveLength(2);
  });

  it("shows as a menu row, its label then its value, its list beside it", () => {
    const overlay = {
      kind: "column-menu",
      anchorId: "p1",
      children: [{ anchorId: "edit" }, { anchorId: "join" }],
    };
    const { host, trigger } = rendered(overlay, { variant: "row" }, true);

    expect(trigger?.querySelector(".select__label")?.textContent).toBe("Join");
    expect(trigger?.querySelector(".select__value")?.textContent).toBe("And");
    expect(host.querySelector(".menu")?.getAttribute("data-placement")).toBe(
      "beside",
    );
  });

  it("caps a short list's height, as Notion's time list", () => {
    const overlay = {
      kind: "column-menu",
      anchorId: "p1",
      children: [{ anchorId: "edit" }, { anchorId: "join" }],
    };
    const { host } = rendered(overlay, { variant: "row", isShort: true }, true);

    expect(host.querySelector(".menu")?.hasAttribute("data-short")).toBe(true);
  });

  it("lists the options with the chosen one checked, and chooses one", () => {
    const { host, onChoose, sent } = rendered({
      kind: "filters",
      anchorId: "db",
      children: [{ anchorId: "join" }],
    });
    const options = [...host.querySelectorAll<HTMLElement>("[role=option]")];

    options[1]?.click();

    expect(
      options.map((option) => option.getAttribute("aria-selected")),
    ).toEqual(["true", "false"]);
    expect(host.querySelector(".menu")?.hasAttribute("data-child")).toBe(true);
    expect(options.map((option) => option.textContent.trim())).toEqual([
      "And",
      "Or",
    ]);
    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeChildOverlay" }),
    ]);
    expect(onChoose).toHaveBeenCalledWith("or");
  });

  it("searches a long list", () => {
    const { host, sent } = rendered(
      { kind: SELECT_OVERLAY, anchorId: "join", query: "o" },
      { searchPlaceholder: "Search" },
    );
    const input = host.querySelector<HTMLInputElement>(".menu__search input");

    if (input) input.value = "or";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(host.querySelectorAll("[role=option]")).toHaveLength(1);
    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.setOverlayQuery", query: "or" }),
    ]);
  });

  it("shows a placeholder while nothing is chosen", () => {
    const { trigger } = rendered(null, {
      value: undefined,
      placeholder: "Pick one",
    });

    expect(trigger?.textContent).toContain("Pick one");
    expect(trigger?.querySelector("[data-placeholder]")).not.toBeNull();
  });
});
