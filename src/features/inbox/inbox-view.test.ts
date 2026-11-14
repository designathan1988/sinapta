// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createInitialState, type Command } from "../../state/index.ts";
import { renderInbox } from "./inbox.view.ts";

function mount() {
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderInbox(createInitialState(), () => ({ ok: true })),
    host,
  );
  return host;
}

describe("the inbox's panel", () => {
  it("flies out beside the sidebar, as Notion's, not over a dimmed page", () => {
    const host = mount();

    expect(host.querySelector("dialog")?.dataset.variant).toBe("flyout");
  });

  it("heads its panel with its own title and a close button", () => {
    const host = mount();

    const header = host.querySelector(".inbox__header");

    expect(header?.textContent).toContain("Inbox");
    expect(header?.querySelector("button[aria-label='Close inbox']")).not.toBe(
      null,
    );
  });
});

function withDueReminder() {
  return {
    ...createInitialState(),
    workspace: buildWorkspace([
      {
        id: "page",
        props: {
          title: [{ text: "Plans" }],
          icon: null,
          isFavorite: false,
          isTrashed: false,
        },
        children: [
          {
            id: "due",
            type: "paragraph",
            props: {
              text: [
                {
                  text: "2026-01-02",
                  mention: {
                    kind: "date" as const,
                    date: "2026-01-02",
                    isReminder: true,
                  },
                },
              ],
            },
          },
        ],
      },
    ]),
  };
}

describe("Mark all as read", () => {
  it("marks every unread one and keeps the focus in the panel", async () => {
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    const dispatch = (command: Command) => {
      sent.push(command);
      return { ok: true } as const;
    };
    render(renderInbox(withDueReminder(), dispatch), host);
    const mark = [...host.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Mark all as read",
    );
    mark?.focus();

    mark?.click();
    // The button goes once nothing is unread.
    mark?.remove();
    await Promise.resolve();

    expect(sent.map((command) => command.type)).toEqual(["inbox.markRead"]);
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Close inbox",
    );
  });
});
