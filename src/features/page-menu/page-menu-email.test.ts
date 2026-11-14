// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { isPageLike } from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { emailItem } from "./page-menu-email.view.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

function withPage(apps: readonly { app: string; host: null }[]) {
  const workspace = buildWorkspace([
    {
      id: "p",
      props: { title: [{ text: "Launch plan" }], icon: null, isTrashed: false },
      children: [
        { id: "a", type: "paragraph", props: { text: [{ text: "Ship it" }] } },
      ],
    },
  ]);
  const initial = createInitialState();
  const sync = { ...initial.persistence.sync, apps };
  const state: AppState = {
    ...initial,
    workspace,
    persistence: { ...initial.persistence, sync },
  };
  const page = workspace.blocks[toBlockId("p")];
  if (page === undefined || !isPageLike(page)) throw new Error("no page");
  return { state, page };
}

describe("Email page", () => {
  it("is offered once Gmail is connected, and opens a draft of the page", () => {
    const opened: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      opened.push(this.href);
    });
    const { state, page } = withPage([{ app: "gmail", host: null }]);

    const [item] = emailItem(state, page);
    item?.onSelect?.();

    expect(item?.label).toBe("Email page");
    expect(opened[0]).toMatch(/^mailto:\?subject=Launch%20plan&body=/);
    expect(decodeURIComponent(opened[0] ?? "")).toContain("Ship it");
  });

  it("is not offered without Gmail", () => {
    const { state, page } = withPage([]);

    expect(emailItem(state, page)).toEqual([]);
  });
});
