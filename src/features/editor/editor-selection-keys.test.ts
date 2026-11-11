// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { AppState, Command, Dispatch } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { selectBlockRange } from "./editor-selection.commands.ts";
import { onSelectionKeyDown } from "./editor-selection.view.ts";

function selectedState(): AppState {
  const { store, dispatch } = createApp([text("a", "one"), text("b", "two")]);
  dispatch(
    selectBlockRange.create({
      anchorId: toBlockId("a"),
      focusId: toBlockId("b"),
    }),
  );
  return store.getState();
}

function press(init: KeyboardEventInit): Command[] {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const event = new KeyboardEvent("keydown", { cancelable: true, ...init });
  onSelectionKeyDown(event, { state: selectedState(), dispatch });
  return sent;
}

describe("keys on selected blocks", () => {
  it("moves the selected blocks with Ctrl+Shift and an arrow", () => {
    const sent = press({ key: "ArrowDown", ctrlKey: true, shiftKey: true });

    expect(sent).toEqual([
      expect.objectContaining({ type: "block.moveSelectedBy", offset: 1 }),
    ]);
  });

  it("duplicates each selected block with Ctrl+D", () => {
    const sent = press({ key: "d", ctrlKey: true });

    expect(sent.map((command) => command.type)).toEqual([
      "block.duplicate",
      "block.duplicate",
    ]);
  });
});
