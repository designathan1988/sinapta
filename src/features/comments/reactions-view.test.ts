// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Discussion } from "../../blocks/page/index.ts";
import { toBlockId } from "../../model/index.ts";
import type { Command } from "../../state/index.ts";
import { REACTION_OVERLAY } from "./reaction-picker.view.ts";
import { renderAddReaction, renderReactions } from "./reactions.view.ts";

const comment = {
  id: toBlockId("c"),
  text: "",
  createdAt: "2026-11-13T00:00:00.000Z",
  reactions: ["👍"],
};
const discussion: Discussion = {
  id: toBlockId("d"),
  blockId: toBlockId("t"),
  isResolved: false,
  comments: [comment],
};

function rendered() {
  const sent: Command[] = [];
  const target = {
    pageId: toBlockId("page"),
    discussion,
    comment,
    dispatch: (command: Command) => {
      sent.push(command);
      return { ok: true } as const;
    },
    overlay: null,
  };
  const host = document.createElement("div");
  render([renderReactions(target), renderAddReaction(target)], host);
  return { host, sent };
}

describe("a comment's reactions", () => {
  it("take a reaction away from its chip", () => {
    const { host, sent } = rendered();

    host.querySelector<HTMLElement>(".comments__reaction")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "comment.toggleReaction",
        commentId: "c",
        emoji: "👍",
      }),
    ]);
  });

  it("open the emoji picker for the comment from Add reaction", () => {
    const { host, sent } = rendered();

    host.querySelector<HTMLElement>(".comments__add-reaction")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: REACTION_OVERLAY,
          anchorId: "c",
          values: { page: ["page"], discussion: ["d"] },
        },
      }),
    ]);
  });
});
