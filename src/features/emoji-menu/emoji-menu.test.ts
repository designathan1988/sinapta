// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import {
  EMOJI_MENU_OVERLAY,
  selectOpenEmojiMenu,
} from "./emoji-menu.selectors.ts";
import { emojiMenuKeys } from "./emoji-menu.view.ts";
import { loadEmoji as loadEmojiList } from "../../ui/emoji/index.ts";

beforeAll(async () => {
  await loadEmojiList();
});

const A = toBlockId("a");

function createState(text: string, start: number): AppState {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "a", type: "paragraph", props: { text: [{ text }] } }],
    },
  ]);
  const initial = createInitialState();
  const caret = text.length;
  const ui = {
    ...initial.ui,
    selection: { blockId: A, anchorOffset: caret, focusOffset: caret },
    overlay: { kind: EMOJI_MENU_OVERLAY, anchorId: A, start },
  };
  return { ...initial, workspace, ui };
}

describe("selectOpenEmojiMenu", () => {
  it("offers emoji once two letters follow the colon", () => {
    const menu = selectOpenEmojiMenu(createState("hi :rocke", 3));

    expect(menu?.items[0]?.char).toBe("🚀");
  });

  it("waits for two letters", () => {
    expect(selectOpenEmojiMenu(createState("hi :r", 3))).toBeUndefined();
  });

  it("closes at a space, as in a time like 10: 30", () => {
    expect(selectOpenEmojiMenu(createState("at 10: 30", 5))).toBeUndefined();
  });
});

describe("emojiMenuKeys", () => {
  it("puts the chosen emoji in place of the colon and the name", () => {
    const sent: Command[] = [];
    const dispatch: Dispatch = (command) => {
      sent.push(command);
      return { ok: true };
    };
    const state = createState("hi :rocke", 3);
    const event = new KeyboardEvent("keydown", { key: "Enter" });

    emojiMenuKeys.keys.Enter?.({ state, dispatch, event });

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.closeOverlay" }),
      expect.objectContaining({
        type: "text.replace",
        start: 3,
        end: 9,
        text: "🚀",
      }),
    ]);
  });
});
