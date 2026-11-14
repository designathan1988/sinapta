import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectNotices } from "./inbox-notices.selectors.ts";

const AT = "2026-11-14T10:00:00.000Z";
const ME = { id: "me", name: "Me" };

// A page by its maker, with a discussion Grace started and the person
// has not taken part in.
function stateWith(
  maker: { id: string; name: string },
  level?: "all" | "replies",
): AppState {
  const state = createInitialState();
  const discussion = {
    id: "d1",
    blockId: "p1",
    isResolved: false,
    comments: [
      {
        id: "c1",
        text: "Shall we ship?",
        createdAt: AT,
        author: { id: "u2", name: "Grace" },
      },
    ],
  };
  const workspace = buildWorkspace([
    {
      id: "p1",
      props: {
        ...{ icon: null, isFavorite: false, isTrashed: false },
        title: [{ text: "Launch" }],
        discussions: [discussion],
      },
    },
  ]);
  const page = workspace.blocks[toBlockId("p1")];
  if (page === undefined) throw new Error("setup");
  const blocks = {
    ...workspace.blocks,
    [page.id]: { ...page, createdBy: maker },
  };
  return {
    ...state,
    workspace: { ...workspace, blocks },
    ui: {
      ...state.ui,
      commentNotices: level === undefined ? {} : { [page.id]: level },
    },
    persistence: {
      ...state.persistence,
      account: {
        ...state.persistence.account,
        status: "signed-in",
        user: { ...ME, email: "me@pagecraft.test", photo: null },
      },
    },
  };
}

const texts = (state: AppState) =>
  selectNotices(state).map((notice) => notice.text);

describe("a page's comment notices", () => {
  it("tells the page's maker of every comment, as Notion's All comments", () => {
    expect(texts(stateWith(ME))).toEqual(["Grace commented: Shall we ship?"]);
  });

  it("tells others only of replies and mentions, unless they ask for all", () => {
    const grace = { id: "u2", name: "Grace" };

    expect(texts(stateWith(grace))).toEqual([]);
    expect(texts(stateWith(grace, "all"))).toEqual([
      "Grace commented: Shall we ship?",
    ]);
    expect(texts(stateWith(ME, "replies"))).toEqual([]);
  });
});
