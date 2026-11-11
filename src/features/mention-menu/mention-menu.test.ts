import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { createState, TODAY } from "./mention-menu-builder.ts";
import {
  MENTION_MENU_OVERLAY,
  PAGE_LINK_MENU_OVERLAY,
  selectBacklinks,
  selectOpenMentionMenu,
} from "./mention-menu.selectors.ts";

describe("selectOpenMentionMenu", () => {
  it("offers the pages whose title matches what follows the @", () => {
    const menu = selectOpenMentionMenu(
      createState("@road", MENTION_MENU_OVERLAY),
      TODAY,
    );

    expect(menu?.items[0]).toEqual({
      label: "Roadmap plan",
      span: {
        text: "Roadmap plan",
        mention: { kind: "page", pageId: "plan" },
      },
    });
    expect(menu?.items.map((item) => item.label)).not.toContain("Old plan");
  });

  it("offers today and tomorrow as dates", () => {
    const menu = selectOpenMentionMenu(
      createState("@to", MENTION_MENU_OVERLAY),
      TODAY,
    );
    const dates = menu?.items.flatMap((item) =>
      item.span.mention?.kind === "date" ? [item.span.mention.date] : [],
    );

    expect(dates).toEqual(["2026-11-11", "2026-11-12"]);
  });

  it("offers only pages after [[", () => {
    const menu = selectOpenMentionMenu(
      createState("[[plan", PAGE_LINK_MENU_OVERLAY),
      TODAY,
    );

    expect(
      menu?.items.every((item) => item.span.mention?.kind === "page"),
    ).toBe(true);
  });

  it("closes once the @ is gone", () => {
    const state = createState("no at sign", MENTION_MENU_OVERLAY);

    expect(selectOpenMentionMenu(state, TODAY)).toBeUndefined();
  });
});

describe("selectBacklinks", () => {
  it("lists the blocks that mention or link to a page", () => {
    const plan = toBlockId("plan");
    const mention = { kind: "page" as const, pageId: plan };
    const workspace = buildWorkspace([
      { id: "plan" },
      {
        id: "notes",
        children: [
          {
            id: "m",
            type: "paragraph",
            props: { text: [{ text: "x", mention }] },
          },
          { id: "link", type: "page-link", props: { pageId: "plan" } },
          { id: "other", type: "paragraph", props: { text: [{ text: "x" }] } },
        ],
      },
    ]);
    const state = { ...createInitialState(), workspace };

    expect(selectBacklinks(state, plan)).toEqual(["m", "link"]);
  });
});
