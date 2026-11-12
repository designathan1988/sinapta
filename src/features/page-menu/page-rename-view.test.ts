// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type Command } from "../../state/index.ts";
import { PAGE_RENAME_OVERLAY, renderPageRename } from "./page-rename.view.ts";

// The page "Plans", its rename field open from the sidebar.
function rendered() {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: {
        title: [{ text: "Plans" }],
        icon: "📌",
        isFavorite: false,
        isTrashed: false,
      },
    },
  ]);
  const initial = createInitialState();
  const overlay = { kind: PAGE_RENAME_OVERLAY, anchorId: "tree:page" };
  const state = { ...initial, workspace, ui: { ...initial.ui, overlay } };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderPageRename(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const field = host.querySelector("input");
  return { host, field, sent };
}

describe("a page's rename field, as Notion's", () => {
  it("shows the page's icon and its title, ready to change", () => {
    const { host, field } = rendered();

    expect(host.textContent).toContain("📌");
    expect(field?.value).toBe("Plans");
  });

  it("renames the page as it is typed", () => {
    const { field, sent } = rendered();
    if (!field) throw new Error("no field");

    field.value = "Plans for May";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent.at(-1)).toMatchObject({
      type: "page.rename",
      pageId: toBlockId("page"),
      title: "Plans for May",
    });
  });

  it("closes on Enter", () => {
    const { field, sent } = rendered();

    field?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(sent.at(-1)).toMatchObject({ type: "ui.closeOverlay" });
  });
});
