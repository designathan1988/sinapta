// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
} from "../../state/index.ts";
import {
  DISCUSSIONS_PANEL_OVERLAY,
  renderCommentsButton,
  renderDiscussionsPanel,
} from "./discussions-panel.view.ts";

const PAGE = toBlockId("page");

function discussion(id: string, isResolved: boolean, text: string) {
  return {
    id: toBlockId(id),
    blockId: null,
    isResolved,
    comments: [
      { id: toBlockId(`${id}c`), text, createdAt: "2026-11-10T12:00:00.000Z" },
    ],
  };
}

function stateWith(
  discussions: ReturnType<typeof discussion>[],
  flags?: string[],
): AppState {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: {
        ...{ title: [], icon: null, isFavorite: false, isTrashed: false },
        discussions,
      },
    },
  ]);
  const initial = createInitialState();
  const overlay = {
    kind: DISCUSSIONS_PANEL_OVERLAY,
    anchorId: "page",
    ...(flags && { flags }),
  };
  return { ...initial, workspace, ui: { ...initial.ui, overlay } };
}

function show(state: AppState) {
  const sent: Command[] = [];
  const root = document.createElement("div");
  render(
    renderDiscussionsPanel(state, (command) => {
      sent.push(command);
      return { ok: true as const };
    }),
    root,
  );
  return { root, sent };
}

describe("the Discussions panel", () => {
  it("opens from the top bar's comments button", () => {
    const sent: Command[] = [];
    const root = document.createElement("div");
    const closed = { ...stateWith([]), ui: createInitialState().ui };
    render(
      renderCommentsButton(closed, PAGE, (command) => {
        sent.push(command);
        return { ok: true as const };
      }),
      root,
    );

    root.querySelector("button")?.click();

    expect(sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: DISCUSSIONS_PANEL_OVERLAY, anchorId: "page" },
    });
  });

  it("says all is read when no discussion is open, and offers View all", () => {
    const { root, sent } = show(stateWith([discussion("d", true, "Done")]));

    expect(root.textContent).toContain("You're all caught up");
    root
      .querySelector<HTMLButtonElement>(".comments__caught-up button")
      ?.click();

    expect(sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { flags: ["all"] },
    });
  });

  it("lists the open discussions, and the resolved ones after View all", () => {
    const discussions = [
      discussion("a", false, "Open one"),
      discussion("b", true, "Closed one"),
    ];

    expect(show(stateWith(discussions)).root.textContent).not.toContain(
      "Closed one",
    );
    const all = show(stateWith(discussions, ["all"])).root.textContent;
    expect(all).toContain("Open one");
    expect(all).toContain("Closed one");
  });
});
