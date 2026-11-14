import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectNotices } from "./inbox-notices.selectors.ts";

const AT = "2026-11-14T10:00:00.000Z";

// A row an automation told Ada about, seen by the one signed in.
function signedInAs(id: string): AppState {
  const state = createInitialState();
  const user = { id, email: `${id}@pagecraft.test`, name: id, photo: null };
  return {
    ...state,
    persistence: {
      ...state.persistence,
      account: { ...state.persistence.account, user },
    },
    workspace: buildWorkspace([
      {
        id: "row",
        props: {
          title: [{ text: "Ship it" }],
          icon: null,
          isFavorite: false,
          isTrashed: false,
          automationNotices: [
            {
              id: "a1:ada@" + AT,
              userId: "ada",
              text: "Automation in Tasks: Page added",
              at: AT,
            },
          ],
        },
      },
    ]),
  };
}

describe("what automations told people, in the inbox", () => {
  it("shows to the person named, with the page it is about", () => {
    const notices = selectNotices(signedInAs("ada"));

    expect(notices).toContainEqual(
      expect.objectContaining({
        pageTitle: "Ship it",
        text: "Automation in Tasks: Page added",
        date: "2026-11-14",
        isNotice: true,
      }),
    );
  });

  it("is not shown to anyone else", () => {
    const notices = selectNotices(signedInAs("bia"));

    expect(notices.map((notice) => notice.text)).not.toContain(
      "Automation in Tasks: Page added",
    );
  });
});
