// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { Command } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { renderEditor } from "./editor.view.ts";

// A page in the trash, open.
function rendered() {
  const gone = {
    id: "gone",
    type: "page",
    props: { title: [{ text: "Old notes" }], icon: null, isTrashed: true },
  };
  const { store } = createApp([text("a", "")], [gone]);
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
      toBlockId("gone"),
    ),
    host,
  );
  return { host, sent };
}

describe("a page in the trash, as Notion's", () => {
  it("shows the page under a banner to restore or delete it", () => {
    const { host } = rendered();
    const banner = host.querySelector(".editor__trashed");

    expect(banner?.textContent).toContain("This page is in the trash.");
    expect(
      [...(banner?.querySelectorAll("button") ?? [])].map((button) =>
        button.textContent.trim(),
      ),
    ).toEqual(["Restore page", "Delete permanently"]);
    expect(host.querySelector(".editor__title")).not.toBeNull();
  });

  it("keeps the title read only, as the rest of the page", () => {
    const title = rendered().host.querySelector(".editor__title");

    expect(title).toBeInstanceOf(HTMLTextAreaElement);
    expect(
      (title instanceof HTMLTextAreaElement && title.readOnly) || false,
    ).toBe(true);
  });

  it("restores the page from the banner", () => {
    const { host, sent } = rendered();

    host.querySelector<HTMLElement>(".editor__trashed button")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "page.restore", pageId: "gone" }),
    );
  });
});
