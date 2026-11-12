// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { Command } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { renderEditor } from "./editor.view.ts";

// The title field of an untitled page.
function titleField() {
  const untitled = {
    id: "untitled",
    type: "page",
    props: { title: [], icon: null },
  };
  const { store } = createApp([text("a", "")], [untitled]);
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderEditor(
      store.getState(),
      (command) => {
        sent.push(command);
        return { ok: true };
      },
      toBlockId("untitled"),
    ),
    host,
  );
  const field = host.querySelector(".editor__title");
  return { field, sent };
}

describe("the page title", () => {
  it("wraps onto more lines, as Notion's", () => {
    const { field } = titleField();

    expect(field).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("offers to add an icon, a cover and a comment as alike buttons", () => {
    const { field } = titleField();
    const actions = [
      ...(field
        ?.closest(".editor")
        ?.querySelectorAll(".editor__page-actions > button") ?? []),
    ];

    expect(actions.map((item) => item.textContent.trim())).toEqual([
      "Add icon",
      "Add cover",
      "Add comment",
    ]);
    expect(actions.every((item) => item.classList.contains("button"))).toBe(
      true,
    );
    expect(
      actions.map((item) =>
        item.querySelector(".icon")?.getAttribute("data-icon"),
      ),
    ).toEqual(["smile", "image", "comment"]);
  });

  it("keeps a pasted line break out of the title", () => {
    const { field, sent } = titleField();
    if (!(field instanceof HTMLTextAreaElement)) throw new Error("no field");

    field.value = "One\nTwo";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent.at(-1)).toMatchObject({
      type: "page.rename",
      title: "One Two",
    });
  });
});
