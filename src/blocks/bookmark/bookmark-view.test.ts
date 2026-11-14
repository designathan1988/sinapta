// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { BookmarkBlock, BookmarkProps } from "./bookmark.schema.ts";
import { renderBookmark } from "./bookmark.view.ts";

const AT = "2026-11-14T00:00:00.000Z";

function cardOf(props: BookmarkProps): HTMLAnchorElement | null {
  const block: BookmarkBlock = {
    id: toBlockId("mark"),
    type: "bookmark",
    parentId: toBlockId("page"),
    childIds: [],
    props,
    createdAt: AT,
    updatedAt: AT,
  };
  const host = document.createElement("div");
  render(
    renderBookmark(block, () => ({ ok: true })),
    host,
  );
  return host.querySelector("a.bookmark");
}

describe("the bookmark card", () => {
  it("shows the host and address until the page has been read", () => {
    const card = cardOf({ url: "https://www.example.com/docs" });

    expect(card?.querySelector(".bookmark__host")?.textContent).toBe(
      "example.com",
    );
    expect(card?.getAttribute("target")).toBe("_blank");
    expect(card?.getAttribute("rel")).toContain("noopener");
    expect(card?.hasAttribute("data-preview")).toBe(false);
  });

  it("shows the page's title, description, icon and image once read", () => {
    const card = cardOf({
      url: "https://example.com/post",
      preview: {
        title: "Launch & ship",
        description: "Everything about the launch.",
        image: "https://example.com/cover.png",
        icon: "https://example.com/favicon.png",
      },
    });

    expect(card?.querySelector(".bookmark__host")?.textContent).toBe(
      "Launch & ship",
    );
    expect(card?.querySelector(".bookmark__description")?.textContent).toBe(
      "Everything about the launch.",
    );
    expect(card?.querySelector(".bookmark__image")?.getAttribute("src")).toBe(
      "https://example.com/cover.png",
    );
    expect(card?.querySelector(".bookmark__icon")?.getAttribute("alt")).toBe(
      "",
    );
  });
});
