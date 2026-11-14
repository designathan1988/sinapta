// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { PASTE_AS_OVERLAY, renderPasteAs } from "./editor-paste-as.view.ts";

const PR = "https://github.com/acme/site/pull/12";

function opened(href: string, apps: readonly { app: string; host: null }[]) {
  const { store } = createApp([text("a", href)]);
  const state = store.getState();
  const overlay = {
    kind: PASTE_AS_OVERLAY,
    anchorId: "a",
    start: 0,
    end: href.length,
    values: { href: [href] },
  };
  const sync = { ...state.persistence.sync, apps };
  const sent: Command[] = [];
  const host = document.createElement("div");
  render(
    renderPasteAs(
      {
        ...state,
        ui: { ...state.ui, overlay },
        persistence: { ...state.persistence, sync },
      },
      (command) => {
        sent.push(command);
        return { ok: true };
      },
    ),
    host,
  );
  const rows = [...host.querySelectorAll<HTMLElement>("[role^=menuitem]")];
  return { rows, sent };
}

describe("Paste as, for a connected app's link", () => {
  it("offers the link's preview first, naming the app", () => {
    const { rows, sent } = opened(PR, [{ app: "github", host: null }]);

    rows[0]?.click();

    expect(rows[0]?.textContent.replace(/\s+/g, " ").trim()).toBe(
      "Preview GitHub",
    );
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "block.pasteAsCard",
        kind: "bookmark",
        href: PR,
      }),
    );
  });

  it("offers no preview while the app is not connected", () => {
    const { rows } = opened(PR, []);

    expect(rows[0]?.textContent.trim()).toBe("Mention");
  });
});
