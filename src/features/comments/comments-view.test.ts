// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type Command } from "../../state/index.ts";
import {
  COMMENT_COMPOSER_OVERLAY,
  renderBlockComments,
  renderComposerPopover,
  renderPageDiscussions,
} from "./comment-popovers.view.ts";
import {
  RESOLVED_COMMENTS_OVERLAY,
  renderResolvedComments,
} from "./resolved-comments.view.ts";

const discussion = {
  id: toBlockId("d1"),
  blockId: null,
  isResolved: false,
  comments: [
    {
      id: toBlockId("c1"),
      text: "Looks good",
      createdAt: "2026-11-10T12:00:00.000Z",
    },
  ],
};

// A page with one discussion of its own, its new comment field open.
function rendered() {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: {
        title: [],
        icon: null,
        isFavorite: false,
        isTrashed: false,
        discussions: [discussion],
      },
    },
  ]);
  const initial = createInitialState();
  const overlay = { kind: COMMENT_COMPOSER_OVERLAY, anchorId: "page" };
  const state = { ...initial, workspace, ui: { ...initial.ui, overlay } };
  const page = selectPage(state, toBlockId("page"));
  if (page === undefined) throw new Error("setup");
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderPageDiscussions(
      state,
      (command) => {
        sent.push(command);
        return { ok: true };
      },
      page,
    ),
    host,
  );
  return { host, sent };
}

function submit(form: Element | null | undefined, text: string): void {
  const input = form?.querySelector("input");
  if (input) input.value = text;
  form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("a page's comments", () => {
  it("show each comment with its author", () => {
    const { host } = rendered();

    expect(host.querySelector(".comments__text")?.textContent).toBe(
      "Looks good",
    );
    expect(host.querySelector(".comments__meta strong")?.textContent).toBe(
      "You",
    );
  });

  it("reply, resolve and start discussions from their fields", () => {
    const { host, sent } = rendered();
    const forms = host.querySelectorAll(".comments__field");

    submit(forms[0], "Agreed");
    host.querySelector<HTMLElement>(".comments__resolve")?.click();
    submit(forms[1], "New topic");

    expect(sent.map((command) => command.type)).toEqual([
      "comment.reply",
      "comment.resolve",
      "comment.start",
      "ui.closeOverlay",
    ]);
  });
});

describe("a block's comment count", () => {
  it("is named by the count it shows", () => {
    const workspace = buildWorkspace([
      {
        id: "page",
        props: {
          title: [],
          icon: null,
          isFavorite: false,
          isTrashed: false,
          discussions: [
            { ...discussion, blockId: toBlockId("a") },
            { ...discussion, id: toBlockId("d2"), blockId: toBlockId("a") },
          ],
        },
        children: [{ id: "a", type: "paragraph", props: { text: [] } }],
      },
    ]);
    const state = { ...createInitialState(), workspace };
    const host = document.createElement("div");
    render(
      renderBlockComments(state, () => ({ ok: true }), toBlockId("a")),
      host,
    );

    const button = host.querySelector(".comments__count");
    expect(button?.textContent.trim()).toBe("2");
    expect(button?.getAttribute("aria-label")).toBe("2 comments");
  });
});

describe("the comment composer by a block", () => {
  it("closes on Escape", () => {
    const workspace = buildWorkspace([
      {
        id: "page",
        children: [{ id: "a", type: "paragraph", props: { text: [] } }],
      },
    ]);
    const initial = createInitialState();
    const overlay = { kind: COMMENT_COMPOSER_OVERLAY, anchorId: "a" };
    const state = { ...initial, workspace, ui: { ...initial.ui, overlay } };
    const sent: Command[] = [];
    const host = document.createElement("div");
    render(
      renderComposerPopover(state, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    host
      .querySelector("input")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

    expect(sent.map((command) => command.type)).toEqual(["ui.closeOverlay"]);
  });
});

describe("a page's resolved comments", () => {
  it("are listed with their text, and reopen from there", () => {
    const resolved = { ...discussion, id: toBlockId("d9"), isResolved: true };
    const workspace = buildWorkspace([
      {
        id: "page",
        props: {
          title: [],
          icon: null,
          isFavorite: false,
          isTrashed: false,
          discussions: [discussion, resolved],
        },
      },
    ]);
    const initial = createInitialState();
    const overlay = { kind: RESOLVED_COMMENTS_OVERLAY, anchorId: "page" };
    const state = { ...initial, workspace, ui: { ...initial.ui, overlay } };
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderResolvedComments(state, (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    const items = host.querySelectorAll(".comments__discussion");
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toContain("Looks good");
    host.querySelector<HTMLElement>(".comments__reopen")?.click();
    expect(sent).toEqual([
      expect.objectContaining({
        type: "comment.resolve",
        pageId: "page",
        discussionId: "d9",
        isResolved: false,
      }),
    ]);
  });
});
