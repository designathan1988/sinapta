// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { Command, Dispatch, OpenOverlay } from "../../state/index.ts";
import { renderCommentDelete } from "./comment-delete.view.ts";

const target = {
  pageId: toBlockId("page"),
  discussionId: toBlockId("d"),
  commentId: toBlockId("c"),
};

function rendered(overlay: OpenOverlay | null) {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderCommentDelete(overlay, dispatch, target), host);
  return { host, sent };
}

describe("a comment's delete", () => {
  it("asks first, in an overlay of its own under a page's title", () => {
    const { host, sent } = rendered(null);

    host.querySelector<HTMLButtonElement>(".comments__delete")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "comment-delete", anchorId: "comment-delete:c" },
      }),
    ]);
  });

  it("asks as a list of the popover it is in, which stays", () => {
    const { host, sent } = rendered({ kind: "discussions", anchorId: "b" });

    host.querySelector<HTMLButtonElement>(".comments__delete")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: "comment-delete:c",
      }),
    ]);
  });

  it("deletes the comment once Delete is chosen", () => {
    const { host, sent } = rendered({
      kind: "discussions",
      anchorId: "b",
      children: [{ anchorId: "comment-delete:c" }],
    });

    host
      .querySelector<HTMLButtonElement>(".comments__confirm [data-autofocus]")
      ?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "ui.closeChildOverlay",
      "comment.delete",
    ]);
    expect(sent[1]).toEqual(expect.objectContaining(target));
  });
});
