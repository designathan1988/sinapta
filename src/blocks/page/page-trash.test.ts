import { describe, expect, it } from "vitest";
import { buildWorkspace, TEST_TIME, toBlockId } from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  emptyOldTrash,
  pageTrashCommands,
  trashPage,
} from "./page-trash.commands.ts";
import { selectPage } from "./page.selectors.ts";

const DAY = 24 * 60 * 60 * 1000;

const daysAgo = (days: number): string =>
  new Date(Date.parse(TEST_TIME) - days * DAY).toISOString();

const page = (extra: Record<string, unknown> = {}) => ({
  title: [],
  icon: null,
  isFavorite: false,
  isTrashed: false,
  ...extra,
});

function createApp() {
  const workspace = buildWorkspace([
    { id: "fresh", props: page() },
    {
      id: "old",
      props: page({ isTrashed: true, trashedAt: daysAgo(31) }),
      children: [{ id: "inside", props: page() }],
    },
    { id: "recent", props: page({ isTrashed: true, trashedAt: daysAgo(5) }) },
  ]);
  return createTestApp({ workspace, commands: pageTrashCommands });
}

describe("the trash", () => {
  it("records when a page went to the trash", () => {
    const { store, dispatch } = createApp();

    dispatch(trashPage.create({ pageId: toBlockId("fresh") }));

    expect(
      selectPage(store.getState(), toBlockId("fresh"))?.props,
    ).toMatchObject({ isTrashed: true, trashedAt: TEST_TIME });
  });

  it("deletes for good what has been in it over 30 days, with all inside", () => {
    const { store, dispatch } = createApp();

    dispatch(emptyOldTrash.create({}));

    const { blocks, rootIds } = store.getState().workspace;
    expect(blocks[toBlockId("old")]).toBeUndefined();
    expect(blocks[toBlockId("inside")]).toBeUndefined();
    expect(rootIds).toEqual(["fresh", "recent"]);
  });
});
