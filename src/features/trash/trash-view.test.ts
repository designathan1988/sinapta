// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createInitialState } from "../../state/index.ts";
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
