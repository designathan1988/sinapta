import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectNotices } from "./inbox-notices.selectors.ts";

const PAGE = { icon: null, isFavorite: false, isTrashed: false };
const AT = "2026-11-14T10:00:00.000Z";

function signedInAs(id: string): AppState {
  const state = createInitialState();
  const discussion = {
    id: "d1",
    blockId: "p1",
    isResolved: false,
    comments: [
      { id: "c1", text: "Ready?", createdAt: AT, author: { id, name: "Me" } },
      {
        id: "c2",
        text: "Yes",
        createdAt: AT,
        author: { id: "u2", name: "Grace" },
      },
    ],
  };
  return {
    ...state,
    workspace: buildWorkspace([
      {
        id: "p1",
        props: {
          ...PAGE,
          title: [{ text: "Plans" }],
          discussions: [discussion],
        },
        children: [
          {
            id: "b1",
            type: "paragraph",
            props: {
              text: [
                { text: "Ask " },
                {
                  text: "@Me",
                  mention: { kind: "person", userId: id, name: "Me" },
                },
              ],
            },
          },
        ],
      },
    ]),
    persistence: {
      ...state.persistence,
      account: {
        ...state.persistence.account,
        status: "signed-in",
        user: { id, email: "me@pagecraft.test", name: "Me", photo: null },
      },
    },
  };
}

describe("the inbox's notices", () => {
  it("lists where the person is mentioned and the others' replies to them", () => {
    const notices = selectNotices(signedInAs("u1"));

    expect(notices.map((notice) => notice.text)).toEqual([
      "You were mentioned: Ask @Me",
      "Grace replied: Yes",
    ]);
    expect(notices.every((notice) => notice.pageTitle === "Plans")).toBe(true);
  });

  it("lists nothing while no one is signed in", () => {
    expect(selectNotices(createInitialState())).toEqual([]);
  });
});
