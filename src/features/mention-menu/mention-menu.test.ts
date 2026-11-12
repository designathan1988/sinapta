import { describe, expect, it } from "vitest";
import { createState, TODAY } from "./mention-menu-builder.ts";
import {
  MENTION_MENU_OVERLAY,
  PAGE_LINK_MENU_OVERLAY,
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
