// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type Command } from "../../state/index.ts";
import { renderRowDiscussions } from "./comment-popovers.view.ts";

function submit(form: Element | null | undefined, text: string): void {
  const input = form?.querySelector("input");
  if (input) input.value = text;
  form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

describe("a database row's comments", () => {
  it("keep their field open under the properties, without taking focus", () => {
    const workspace = buildWorkspace([
      {
        id: "row",
        props: {
          title: [],
          icon: null,
          isFavorite: false,
          isTrashed: false,
        },
      },
    ]);
    const state = { ...createInitialState(), workspace };
    const page = selectPage(state, toBlockId("row"));
    if (page === undefined) throw new Error("setup");
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderRowDiscussions(
        state,
        (command) => {
          sent.push(command);
          return { ok: true };
        },
        page,
      ),
      host,
    );
    const input = host.querySelector<HTMLInputElement>(
      ".comments__field input",
    );

    submit(host.querySelector(".comments__field"), "Ship it");

    expect(input?.placeholder).toBe("Add a comment…");
    expect(document.activeElement).not.toBe(input);
    expect(sent).toEqual([
      expect.objectContaining({
        type: "comment.start",
        pageId: "row",
        blockId: null,
        text: "Ship it",
      }),
    ]);
  });
});
