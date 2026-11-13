import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import {
  buildWorkspace,
  TEST_TIME,
  toBlockId,
  toPropertyId,
  type Workspace,
} from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  commentCommands,
  deleteComment,
  discussionTidier,
  replyToDiscussion,
  resolveDiscussion,
  startDiscussion,
} from "./comment.commands.ts";
import { selectOpenDiscussions } from "./comments.selectors.ts";

const page = toBlockId("page");
const text = toBlockId("t");

function createApp() {
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
  const app = createTestApp({ workspace, commands: commentCommands });
  const discussions = () =>
    selectPage(app.store.getState(), page)?.props.discussions ?? [];
  const spans = () => app.store.getState().workspace.blocks[text]?.props.text;
  app.dispatch(
    startDiscussion.create({
      pageId: page,
      blockId: text,
      range: { start: 9, end: 13 },
      text: "Which plan?",
    }),
  );
  return { ...app, discussions, spans };
}

describe("comments", () => {
  it("start a discussion on text, marking it", () => {
    const { discussions, spans } = createApp();

    expect(discussions()).toEqual([
      {
        id: "new-1",
        blockId: "t",
        quote: "plan",
        isResolved: false,
        comments: [{ id: "new-2", text: "Which plan?", createdAt: TEST_TIME }],
      },
    ]);
    expect(spans()).toEqual([
      { text: "Ship the " },
      { text: "plan", comments: ["new-1"] },
    ]);
  });

  it("take replies, and resolving unmarks the text", () => {
    const { dispatch, discussions, spans } = createApp();
    const discussionId = toBlockId("new-1");

    dispatch(
      replyToDiscussion.create({ pageId: page, discussionId, text: "Q4" }),
    );
    dispatch(
      resolveDiscussion.create({
        pageId: page,
        discussionId,
        isResolved: true,
      }),
    );

    expect(discussions()[0]?.comments.map((item) => item.text)).toEqual([
      "Which plan?",
      "Q4",
    ]);
    expect(discussions()[0]?.isResolved).toBe(true);
    expect(spans()).toEqual([{ text: "Ship the plan" }]);
  });

  it("end with their last comment, unmarking the text", () => {
    const { dispatch, discussions, spans } = createApp();

    dispatch(
      deleteComment.create({
        pageId: page,
        discussionId: toBlockId("new-1"),
        commentId: toBlockId("new-2"),
      }),
    );

    expect(discussions()).toEqual([]);
    expect(spans()).toEqual([{ text: "Ship the plan" }]);
  });

  it("go with the block they are about", () => {
    const { store } = createApp();
    const before = store.getState().workspace;
    const { [text]: _gone, ...blocks } = before.blocks;
    const holder = before.blocks[page];
    if (holder === undefined) throw new Error("setup");
    const after: Workspace = {
      ...before,
      blocks: { ...blocks, [page]: { ...holder, childIds: [] } },
    };

    const operations = discussionTidier(after, new Set([text]), before);

    expect(operations).toMatchObject([
      {
        type: "record.update",
        id: "page",
        patch: { props: { discussions: [] } },
      },
    ]);
  });

  it("keep a value's discussions apart from the page's own", () => {
    const { dispatch, store } = createApp();

    dispatch(
      startDiscussion.create({
        pageId: page,
        blockId: null,
        value: { propertyId: toPropertyId("p"), quote: "Done" },
        text: "Since when?",
      }),
    );

    const own = selectOpenDiscussions(store.getState(), page);
    expect(own?.discussions).toEqual([]);
  });
});
