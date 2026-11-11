import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  coverFor,
  pageStyleCommands,
  setCoverPosition,
  setPageCover,
  setPageFont,
  togglePageSmallText,
  togglePageFullWidth,
} from "./page-style.commands.ts";

const A = toBlockId("a");
const DB = toBlockId("db");

function createApp() {
  const props = { title: [], icon: null, isFavorite: false, isTrashed: false };
  const workspace = buildWorkspace([
    { id: "a", props },
    {
      id: "db",
      type: "database",
      props: { ...props, properties: [], viewIds: [] },
    },
  ]);
  const app = createTestApp({ workspace, commands: pageStyleCommands });
  const props_ = (id = A) => app.store.getState().workspace.blocks[id]?.props;
  return { ...app, props: props_ };
}

describe("page.setCover", () => {
  it("sets a preset or an image address, and removes the cover", () => {
    const { dispatch, props } = createApp();

    dispatch(setPageCover.create({ pageId: A, cover: "ocean" }));
    expect(props()?.cover).toBe("ocean");

    dispatch(setPageCover.create({ pageId: A, cover: "https://a.b/c.jpg" }));
    expect(props()?.cover).toBe("https://a.b/c.jpg");

    dispatch(setPageCover.create({ pageId: A, cover: null }));
    expect(props()?.cover).toBeNull();
  });

  it("refuses a cover that is neither, and leaves databases alone", () => {
    const { dispatch, props } = createApp();

    dispatch(setPageCover.create({ pageId: A, cover: "javascript:alert(1)" }));
    dispatch(setPageCover.create({ pageId: DB, cover: "ocean" }));

    expect(props()?.cover).toBeUndefined();
    expect(props(DB)?.cover).toBeUndefined();
  });
});

describe("page.toggleFullWidth", () => {
  it("turns full width on and off", () => {
    const { dispatch, props } = createApp();

    dispatch(togglePageFullWidth.create({ pageId: A }));
    expect(props()?.isFullWidth).toBe(true);

    dispatch(togglePageFullWidth.create({ pageId: A }));
    expect(props()?.isFullWidth).toBe(false);
  });
});

describe("coverFor", () => {
  it("picks the same preset for the same page every time", () => {
    expect(coverFor(A)).toBe(coverFor(A));
  });
});

describe("page.setCoverPosition", () => {
  it("keeps the cover's vertical position between 0 and 100", () => {
    const { dispatch, props } = createApp();

    dispatch(setCoverPosition.create({ pageId: A, position: 30 }));
    expect(props()?.coverPosition).toBe(30);

    dispatch(setCoverPosition.create({ pageId: A, position: 140 }));
    expect(props()?.coverPosition).toBe(100);

    dispatch(setCoverPosition.create({ pageId: A, position: -5 }));
    expect(props()?.coverPosition).toBe(0);
  });
});

describe("page.setFont", () => {
  it("sets the page's font and leaves undo one step back", () => {
    const { dispatch, props, store } = createApp();

    dispatch(setPageFont.create({ pageId: A, font: "serif" }));
    expect(props()?.font).toBe("serif");

    dispatch(setPageFont.create({ pageId: A, font: "mono" }));
    expect(props()?.font).toBe("mono");
    expect(store.getState().history.undo).toHaveLength(2);
  });

  it("gives a database no font of its own", () => {
    const { dispatch, props } = createApp();

    dispatch(setPageFont.create({ pageId: DB, font: "serif" }));

    expect(props(DB)?.font).toBeUndefined();
  });
});

describe("page.toggleSmallText", () => {
  it("turns small text on and off", () => {
    const { dispatch, props } = createApp();

    dispatch(togglePageSmallText.create({ pageId: A }));
    expect(props()?.isSmallText).toBe(true);

    dispatch(togglePageSmallText.create({ pageId: A }));
    expect(props()?.isSmallText).toBe(false);
  });
});
