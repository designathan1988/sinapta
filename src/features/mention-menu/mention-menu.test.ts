import { describe, expect, it } from "vitest";
import { createState, TODAY } from "./mention-menu-builder.ts";
import {
  MENTION_MENU_OVERLAY,
  PAGE_LINK_MENU_OVERLAY,
  PLUS_MENU_OVERLAY,
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

  it("offers reminders after @remind, as Notion does", () => {
    const menu = selectOpenMentionMenu(
      createState("@remind tomorrow", MENTION_MENU_OVERLAY),
      TODAY,
    );

    expect(menu?.items.map((item) => item.label)).toEqual([
      "Remind me tomorrow",
    ]);
    expect(menu?.items[0]?.span.mention).toEqual({
      kind: "date",
      date: "2026-11-12",
      isReminder: true,
    });
  });
});

describe("the + menu", () => {
  it("offers a new subpage named as typed, then pages to link to", () => {
    const menu = selectOpenMentionMenu(
      createState("+Road", PLUS_MENU_OVERLAY),
      TODAY,
    );

    expect(menu?.items).toEqual([
      {
        label: "New subpage “Road”",
        span: { text: "Road" },
        action: { kind: "subpage", title: "Road" },
      },
      expect.objectContaining({
        label: "Roadmap plan",
        action: { kind: "link", pageId: "plan" },
        section: "Link to page",
      }),
    ]);
  });

  it("closes when a space follows the +, which starts a list", () => {
    expect(
      selectOpenMentionMenu(createState("+ ", PLUS_MENU_OVERLAY), TODAY),
    ).toBeUndefined();
  });
});

describe("people after @", () => {
  it("lists the workspace's people first, as Notion's", () => {
    const state = createState("@gr", MENTION_MENU_OVERLAY);
    const members = [
      { id: "u1", name: "Grace", email: "g@pagecraft.test", role: "member" },
      { id: "u2", name: "Linus", email: "l@pagecraft.test", role: "member" },
    ];
    const withPeople = {
      ...state,
      persistence: {
        ...state.persistence,
        sync: { ...state.persistence.sync, members },
      },
    };

    const menu = selectOpenMentionMenu(withPeople, TODAY);

    expect(menu?.items[0]).toEqual({
      label: "Grace",
      span: {
        text: "@Grace",
        mention: { kind: "person", userId: "u1", name: "Grace" },
      },
    });
    expect(menu?.items.map((item) => item.label)).not.toContain("Linus");
  });
});
