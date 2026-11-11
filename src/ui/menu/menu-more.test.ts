// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { renderMenu, type MenuItem } from "./index.ts";

const noop = (): void => undefined;

const TEMPLATES: OpenOverlay = { kind: "templates", anchorId: "db" };

// A list of templates: choosing one uses it, its "…" opens its actions.
function rendered(overlay: OpenOverlay = TEMPLATES) {
  const sent: Command[] = [];
  const dispatch = (command: Command) => {
    sent.push(command);
    return { ok: true } as const;
  };
  const chosen: string[] = [];
  const actions: MenuItem[] = [
    { label: "Delete", onSelect: () => chosen.push("Delete") },
  ];
  const items: MenuItem[] = [
    {
      label: "Weekly",
      onSelect: () => chosen.push("Weekly"),
      more: {
        id: "t1-more",
        menu: () => ({ label: "Weekly", items: actions }),
      },
    },
  ];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderMenu({
      label: "Templates",
      items,
      onClose: noop,
      context: { overlay, dispatch },
    }),
    host,
  );
  const more = host.querySelector<HTMLElement>(".menu__more");
  return { host, sent, chosen, more };
}

describe("a menu row with its own actions", () => {
  it("chooses the row when the row is pressed", () => {
    const { host, chosen } = rendered();

    host.querySelector<HTMLElement>("[data-index]")?.click();

    expect(chosen).toEqual(["Weekly"]);
  });

  it("opens its actions beside it from the … button, not choosing the row", () => {
    const { sent, chosen, more } = rendered();

    more?.click();

    expect(chosen).toEqual([]);
    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openChildOverlay",
        anchorId: "t1-more",
      }),
    ]);
  });

  it("shows its open actions, whose choice runs", () => {
    const open = { ...TEMPLATES, children: [{ anchorId: "t1-more" }] };
    const { host, chosen, more } = rendered(open);
    const action = [
      ...host.querySelectorAll<HTMLElement>(".menu [data-index]"),
    ].find((row) => row.textContent.trim() === "Delete");

    action?.click();

    expect(more?.getAttribute("aria-expanded")).toBe("true");
    expect(chosen).toEqual(["Delete"]);
  });
});
