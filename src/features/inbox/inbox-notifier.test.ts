import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import { createTestApp, defineCommand } from "../../state/index.ts";
import { setDesktopNotices } from "./inbox.commands.ts";
import { startDesktopNotices, type Notifier } from "./inbox-notifier.ts";

// Grace mentions Ada on a page: a notice for Ada.
const mentioned = defineCommand<{ isMentioned: boolean }>({
  type: "test.mention",
  handle: (state, { isMentioned }) => ({
    workspace: buildWorkspace([
      {
        id: "p1",
        props: { title: [{ text: "Plans" }] },
        children: [
          {
            id: "b1",
            type: "paragraph",
            props: {
              text: isMentioned
                ? [
                    {
                      text: "@Ada",
                      mention: { kind: "person", userId: "u1", name: "Ada" },
                    },
                  ]
                : [{ text: "Hello" }],
            },
          },
        ],
      },
    ]),
    persistence: {
      ...state.persistence,
      account: {
        ...state.persistence.account,
        status: "signed-in",
        user: {
          id: "u1",
          email: "ada@pagecraft.test",
          name: "Ada",
          photo: null,
        },
      },
    },
  }),
});

function notifierShowing(shown: string[], isAllowed = true): Notifier {
  return {
    isAllowed: () => isAllowed,
    show: (reminder) => shown.push(reminder.text),
  };
}

describe("desktop notifications", () => {
  it("shows each new notice once while they are on", () => {
    const { store, dispatch } = createTestApp({
      commands: [mentioned, setDesktopNotices],
    });
    const shown: string[] = [];
    dispatch(mentioned.create({ isMentioned: false }));
    startDesktopNotices(store, notifierShowing(shown));
    dispatch(setDesktopNotices.create({ isOn: true }));

    dispatch(mentioned.create({ isMentioned: true }));
    dispatch(setDesktopNotices.create({ isOn: true }));

    expect(shown).toEqual(["You were mentioned: @Ada"]);
  });

  it("shows nothing while they are off or the system refuses", () => {
    const { store, dispatch } = createTestApp({
      commands: [mentioned, setDesktopNotices],
    });
    const shown: string[] = [];
    startDesktopNotices(store, notifierShowing(shown, false));
    dispatch(setDesktopNotices.create({ isOn: true }));

    dispatch(mentioned.create({ isMentioned: true }));

    expect(shown).toEqual([]);
  });
});
