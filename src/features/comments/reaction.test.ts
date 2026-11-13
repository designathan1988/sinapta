import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { commentCommands, startDiscussion } from "./comment.commands.ts";
import { reactionCommands, toggleReaction } from "./reaction.commands.ts";

const page = toBlockId("page");
const text = toBlockId("t");

// A page whose paragraph "Ship the plan" has a reaction on "plan".
function reacted() {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: { title: [], icon: null, isFavorite: false, isTrashed: false },
      children: [
        {
          id: "t",
          type: "paragraph",
          props: { text: [{ text: "Ship the plan" }] },
        },
      ],
    },
  ]);
  const app = createTestApp({
    workspace,
    commands: [...commentCommands, ...reactionCommands],
  });
  app.dispatch(
    startDiscussion.create({
      pageId: page,
      blockId: text,
      range: { start: 9, end: 13 },
      text: "",
      reaction: "👍",
    }),
  );
  const discussions = () =>
    selectPage(app.store.getState(), page)?.props.discussions ?? [];
  const spans = () => app.store.getState().workspace.blocks[text]?.props.text;
  return { ...app, discussions, spans };
}

describe("reactions", () => {
  it("start a discussion on text with a reaction alone", () => {
    const { discussions } = reacted();

    expect(discussions()[0]?.comments).toEqual([
      expect.objectContaining({ text: "", reactions: ["👍"] }),
    ]);
    expect(discussions()[0]?.quote).toBe("plan");
  });

  it("add another reaction, and take one away", () => {
    const { dispatch, discussions } = reacted();
    const target = () => {
      const discussion = discussions()[0];
      const comment = discussion?.comments[0];
      if (discussion === undefined || comment === undefined) throw new Error();
      return {
        pageId: page,
        discussionId: discussion.id,
        commentId: comment.id,
      };
    };

    dispatch(toggleReaction.create({ ...target(), emoji: "🎉" }));
    dispatch(toggleReaction.create({ ...target(), emoji: "👍" }));

    expect(discussions()[0]?.comments[0]?.reactions).toEqual(["🎉"]);
  });

  it("drop a reaction-only discussion and its mark with its last reaction", () => {
    const { dispatch, discussions, spans } = reacted();
    const discussion = discussions()[0];
    const comment = discussion?.comments[0];
    if (discussion === undefined || comment === undefined) throw new Error();

    dispatch(
      toggleReaction.create({
        pageId: page,
        discussionId: discussion.id,
        commentId: comment.id,
        emoji: "👍",
      }),
    );

    expect(discussions()).toEqual([]);
    expect(JSON.stringify(spans())).not.toContain("comments");
  });
});
