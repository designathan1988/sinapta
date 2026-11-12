// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type Command } from "../../state/index.ts";
import {
  COMMENT_COMPOSER_OVERLAY,
  renderPageDiscussions,
} from "./comment-popovers.view.ts";

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
