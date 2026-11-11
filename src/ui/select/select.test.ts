// @vitest-environment happy-dom
import { render } from "lit-html";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { renderSelect, SELECT_OVERLAY, type SelectProps } from "./index.ts";

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    value: () => undefined,
    configurable: true,
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
});

const OPTIONS = [
  { value: "and", label: "And" },
  { value: "or", label: "Or" },
];

function rendered(
  overlay: OpenOverlay | null,
  props: Partial<SelectProps> = {},
) {
  const sent: Command[] = [];
  const dispatch = (command: Command) => {
    sent.push(command);
    return { ok: true } as const;
  };
  const onChoose = vi.fn();
  const host = document.createElement("div");
  document.body.replaceChildren(host);
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

  it("lists the options with the chosen one checked, and chooses one", () => {
    const { host, onChoose, sent } = rendered({
      kind: "filters",
      anchorId: "db",
      child: { anchorId: "join" },
    });
    const options = [...host.querySelectorAll<HTMLElement>("[role=option]")];

    options[1]?.click();

    expect(
      options.map((option) => option.getAttribute("aria-selected")),
    ).toEqual(["true", "false"]);
    expect(host.querySelector(".menu")?.hasAttribute("data-child")).toBe(true);
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
