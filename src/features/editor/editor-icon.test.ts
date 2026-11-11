// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { ICON_OVERLAY, renderIconControl } from "./editor-icon.view.ts";

function rendered(query: string) {
  const props = { title: [], icon: "📄", isFavorite: false, isTrashed: false };
  const initial = createInitialState();
  const state = {
    ...initial,
    workspace: buildWorkspace([{ id: "page", props }]),
    ui: { ...initial.ui, overlay: { kind: ICON_OVERLAY, query } },
  };
  const page = selectPage(state, toBlockId("page"));
  if (page === undefined) throw new Error("The builder lost the page.");
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderIconControl(state, page, dispatch), host);
  return { host, sent };
}

describe("the page icon picker", () => {
  it("sets the chosen emoji as the page icon and closes", () => {
    const { host, sent } = rendered("rocket");

    host.querySelector<HTMLElement>("[data-emoji]")?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "page.setIcon",
      "ui.closeOverlay",
    ]);
    expect(sent[0]).toMatchObject({ icon: "🚀" });
  });

  it("keeps what is typed in the search field in the overlay", () => {
    const { host, sent } = rendered("");
    const field = host.querySelector("input");
    if (field === null) throw new Error("The picker has no search field.");

    field.value = "cat";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: ICON_OVERLAY, query: "cat" },
      }),
    ]);
  });
});
