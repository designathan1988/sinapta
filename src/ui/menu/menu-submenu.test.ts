// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { renderMenu, type MenuItem } from "./index.ts";

const noop = (): void => undefined;

const COLUMN: OpenOverlay = { kind: "column-menu", anchorId: "p1" };

// A column menu whose "Change type" row opens the list of types.
function rendered(overlay: OpenOverlay = COLUMN) {
  const sent: Command[] = [];
  const dispatch = (command: Command) => {
    sent.push(command);
    return { ok: true } as const;
  };
  const chosen: string[] = [];
  const types: MenuItem[] = ["Text", "Number"].map((label) => ({
    label,
    check: "radio",
    isChecked: label === "Number",
    onSelect: () => chosen.push(label),
  }));
  const items: MenuItem[] = [
    {
      label: "Change type",
      submenu: { id: "p1-type", menu: () => ({ label: "Type", items: types }) },
    },
    { label: "Hide", onSelect: noop },
  ];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderMenu({
      label: "Column",
      items,
      onClose: noop,
      context: { overlay, dispatch },
    }),
    host,
  );
  const row = (label: string): HTMLElement => {
    const found = [...host.querySelectorAll<HTMLElement>("[data-index]")].find(
      (item) => item.textContent.trim() === label,
    );
    if (found === undefined) throw new Error(`no ${label} row`);
    return found;
  };
  return { host, sent, chosen, row };
}

const OPEN = { ...COLUMN, children: [{ anchorId: "p1-type" }] };

describe("a menu row with a submenu", () => {
  it("opens its submenu beside the menu and keeps the menu open", () => {
    const { sent, row } = rendered();

    row("Change type").click();

    expect(row("Change type").getAttribute("aria-haspopup")).toBe("menu");
    expect(row("Change type").getAttribute("aria-expanded")).toBe("false");
    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: "p1-type",
        depth: 0,
      }),
    ]);
  });

  it("opens it with the right arrow key", () => {
    const { sent, row } = rendered();

    row("Change type").dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.openChildOverlay" }),
    ]);
  });

  it("draws the open submenu right after its row, as a list beside it", () => {
    const { host, row } = rendered(OPEN);

    const submenu = row("Change type").nextElementSibling;

    expect(row("Change type").getAttribute("aria-expanded")).toBe("true");
    expect(row("Change type").hasAttribute("data-overlay-child-anchor")).toBe(
      true,
    );
    expect(submenu?.getAttribute("data-placement")).toBe("beside");
    expect(submenu?.getAttribute("data-size")).toBe("narrow");
    expect(submenu?.hasAttribute("data-child")).toBe(true);
    expect(host.querySelectorAll(".menu")).toHaveLength(2);
  });

  it("chooses in the submenu, which closes the whole menu", () => {
    const { sent, chosen, row } = rendered(OPEN);

    row("Text").click();

    expect(chosen).toEqual(["Text"]);
    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeOverlay" }),
    ]);
  });

  it("closes only the submenu with the left arrow key", () => {
    const { sent, row } = rendered(OPEN);

    row("Text").dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeChildOverlay", depth: 0 }),
    ]);
  });

  it("moves focus over its own rows only", () => {
    const { row } = rendered(OPEN);
    row("Hide").focus();

    row("Hide").dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
    );

    expect(document.activeElement).toBe(row("Change type"));
  });
});
