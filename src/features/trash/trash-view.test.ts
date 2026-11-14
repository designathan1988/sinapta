// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createInitialState, type Command } from "../../state/index.ts";
import { renderTrash, TRASH_OVERLAY } from "./trash.view.ts";

describe("the trash, as Notion's", () => {
  it("opens as a panel beside the sidebar, its search first", () => {
    const initial = createInitialState();
    const state = {
      ...initial,
      ui: { ...initial.ui, overlay: { kind: TRASH_OVERLAY } },
    };
    const host = document.createElement("div");
    document.body.replaceChildren(host);

    render(
      renderTrash(state, () => ({ ok: true })),
      host,
    );

    const dialog = host.querySelector("dialog");
    expect(dialog?.getAttribute("data-variant")).toBe("panel");
    expect(dialog?.querySelector(".dialog__header")).toBeNull();
    expect(dialog?.querySelector("input")).not.toBeNull();
  });
});

describe("a trashed page's row", () => {
  it("restores the page from its Restore button", () => {
    const initial = createInitialState();
    const props = {
      title: [{ text: "Scratch" }],
      icon: null,
      isFavorite: false,
      isTrashed: true,
      trashedAt: "2026-11-13T00:00:00.000Z",
    };
    const state = {
      ...initial,
      workspace: buildWorkspace([{ id: "scratch", props }]),
      ui: { ...initial.ui, overlay: { kind: TRASH_OVERLAY } },
    };
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderTrash(state, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    host
      .querySelector<HTMLElement>(".trash__row [aria-label='Restore']")
      ?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "page.restore", pageId: "scratch" }),
    );
  });
});

describe("the trash's search", () => {
  it("closes the trash on Escape even while it holds words, as Notion's", () => {
    const initial = createInitialState();
    const overlay = { kind: TRASH_OVERLAY, query: "Walk" };
    const state = { ...initial, ui: { ...initial.ui, overlay } };
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderTrash(state, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    host.querySelector(".trash__search")?.dispatchEvent(escape);

    expect(escape.defaultPrevented).toBe(true);
    expect(sent).toContainEqual(
      expect.objectContaining({ type: "ui.closeOverlay" }),
    );
  });
});
