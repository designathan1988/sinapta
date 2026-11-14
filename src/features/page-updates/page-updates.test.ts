import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId, type Block } from "../../model/index.ts";
import { createInitialState, type PageVersion } from "../../state/index.ts";
import {
  selectDailyViews,
  selectTimeAgo,
  selectUpdateEntries,
  selectViewers,
} from "./page-updates.selectors.ts";

const PAGE = toBlockId("page");
const AT = "2026-11-13T12:00:00.000Z";

function workspaceWith(title: string, texts: Readonly<Record<string, string>>) {
  return buildWorkspace([
    {
      id: "page",
      props: {
        title: [{ text: title }],
        icon: null,
        isFavorite: false,
        isTrashed: false,
      },
      children: Object.entries(texts).map(([id, text]) => ({
        id,
        type: "paragraph",
        props: { text: [{ text }] },
      })),
    },
  ]);
}

function versionOf(title: string, texts: Readonly<Record<string, string>>) {
  const workspace = workspaceWith(title, texts);
  const blocks: Block[] = ["page", ...Object.keys(texts)].flatMap(
    (id) => workspace.blocks[toBlockId(id)] ?? [],
  );
  const version: PageVersion = { id: "v1", takenAt: AT, blocks };
  return version;
}

describe("the page's updates", () => {
  it("list the blocks and title changed since the last version", () => {
    const initial = createInitialState();
    const state = {
      ...initial,
      workspace: workspaceWith("Plan", { a: "Ship it", b: "New line" }),
      ui: {
        ...initial.ui,
        pageVersions: {
          pageId: PAGE,
          versions: [versionOf("Draft", { a: "Ship it" })],
        },
      },
    };

    const [entry, ...rest] = selectUpdateEntries(state, PAGE);

    expect(rest).toEqual([]);
    expect(entry?.versionIndex).toBeNull();
    expect(entry?.lines.map((line) => [line.text, line.isTitle])).toEqual([
      ["Plan", true],
      ["New line", false],
    ]);
  });
});

describe("the page's analytics", () => {
  const views = [
    { viewedAt: "2026-11-13T08:00:00.000Z", viewer: "Ada" },
    { viewedAt: "2026-11-14T08:00:00.000Z", viewer: "Bia" },
    { viewedAt: "2026-11-14T09:00:00.000Z", viewer: "Ada" },
    { viewedAt: "2026-09-01T09:00:00.000Z", viewer: "Ada" },
  ];

  it("count views by day over the last 28 days, and all of them", () => {
    const { days, total } = selectDailyViews(views, "2026-11-14T10:00:00Z");

    expect(days).toEqual([
      { day: "2026-11-13", count: 1 },
      { day: "2026-11-14", count: 2 },
    ]);
    expect(total).toBe(4);
  });

  it("count every day of the views when All time is chosen", () => {
    const { days } = selectDailyViews(views, "2026-11-14T10:00:00Z", "all");

    expect(days[0]).toEqual({ day: "2026-09-01", count: 1 });
    expect(days.at(-1)).toEqual({ day: "2026-11-14", count: 2 });
  });

  it("name each viewer once, at their latest view", () => {
    const hidden = { viewedAt: "2026-11-14T09:30:00.000Z", viewer: null };

    expect(selectViewers([...views, { ...hidden, isHidden: true }])).toEqual([
      { viewer: "Ada", viewedAt: "2026-11-14T09:00:00.000Z" },
      { viewer: "Bia", viewedAt: "2026-11-14T08:00:00.000Z" },
    ]);
  });

  it("say how long ago, as Notion's panel does", () => {
    const now = "2026-11-14T12:00:00.000Z";

    expect(selectTimeAgo("2026-11-14T11:59:07.000Z", now)).toBe(
      "53 seconds ago",
    );
    expect(selectTimeAgo("2026-11-13T12:00:00.000Z", now)).toBe("1 day ago");
  });
});
