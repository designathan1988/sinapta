import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { UNDO_COMMAND } from "../../state/index.ts";
import { createApp, PAGE, text } from "./editor-builder.ts";
import {
  createPageInAt,
  createSubpageAt,
  linkPageAt,
} from "./editor-plus.commands.ts";

const A = toBlockId("a");
const OTHER = toBlockId("other");

function children(app: ReturnType<typeof createApp>) {
  const { blocks } = app.store.getState().workspace;
  return (blocks[PAGE]?.childIds ?? []).map((id) => {
    const block = blocks[id];
    return { id, type: block?.type, props: block?.props };
  });
}

describe("page.createFromPlus", () => {
  it("turns a line holding only what was typed into the subpage", () => {
    const app = createApp([text("a", "+Ideas"), text("b", "after")]);

    app.dispatch(
      createSubpageAt.create({ blockId: A, start: 0, end: 6, title: "Ideas" }),
    );

    expect(children(app)[0]).toMatchObject({
      id: A,
      type: "page",
      props: { title: [{ text: "Ideas" }] },
    });
    expect(app.outline()).toEqual(["paragraph:after"]);
  });

  it("keeps the line's other words and adds the subpage after it", () => {
    const app = createApp([text("a", "See +Ideas")]);

    app.dispatch(
      createSubpageAt.create({ blockId: A, start: 4, end: 10, title: "Ideas" }),
    );

    expect(app.outline()).toEqual(["paragraph:See "]);
    expect(children(app)[1]).toMatchObject({
      type: "page",
      props: { title: [{ text: "Ideas" }] },
    });
  });
});

describe("block.linkFromPlus", () => {
  it("turns the line into a link to the page", () => {
    const app = createApp([text("a", "+the")], [{ id: "other" }]);

    app.dispatch(
      linkPageAt.create({ blockId: A, start: 0, end: 4, pageId: OTHER }),
    );

    expect(children(app)[0]).toMatchObject({
      id: A,
      type: "page-link",
      props: { pageId: OTHER },
    });
  });

  it("is undone in one step", () => {
    const app = createApp([text("a", "+the")], [{ id: "other" }]);

    app.dispatch(
      linkPageAt.create({ blockId: A, start: 0, end: 4, pageId: OTHER }),
    );
    app.dispatch({ type: UNDO_COMMAND });

    expect(app.outline()).toEqual(["paragraph:+the"]);
  });
});

describe("page.createInFromPlus", () => {
  it("makes the page where the person chose and links the line to it", () => {
    const app = createApp([text("a", "+Ideas")], [{ id: "other" }]);

    app.dispatch(
      createPageInAt.create({
        blockId: A,
        start: 0,
        end: 6,
        title: "Ideas",
        parentId: OTHER,
      }),
    );

    const { blocks } = app.store.getState().workspace;
    const pageId = blocks[OTHER]?.childIds.at(-1);
    const made = pageId === undefined ? undefined : blocks[pageId];
    expect(made).toMatchObject({
      type: "page",
      props: { title: [{ text: "Ideas" }] },
    });
    expect(children(app)[0]).toMatchObject({
      id: A,
      type: "page-link",
      props: { pageId },
    });
  });

  it("makes it at the top level when chosen so", () => {
    const app = createApp([text("a", "See +Ideas")]);

    app.dispatch(
      createPageInAt.create({
        blockId: A,
        start: 4,
        end: 10,
        title: "Ideas",
        parentId: null,
      }),
    );

    const { rootIds, blocks } = app.store.getState().workspace;
    const made = blocks[rootIds.at(-1) ?? PAGE];
    expect(made?.props.title).toEqual([{ text: "Ideas" }]);
    expect(app.outline()).toEqual(["paragraph:See "]);
  });
});
