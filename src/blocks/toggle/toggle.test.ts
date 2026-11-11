import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { setAllTogglesOpen, toggleCommands } from "./toggle.commands.ts";

const toggle = (
  id: string,
  isOpen: boolean,
  children: BlockSpec[] = [],
): BlockSpec => ({
  id,
  type: "toggle",
  props: { text: [{ text: id }], isOpen },
  children,
});

function createApp() {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [
        toggle("a", false, [toggle("inner", false)]),
        toggle("b", true),
        { id: "sub", children: [toggle("elsewhere", false)] },
      ],
    },
  ]);
  const app = createTestApp({ workspace, commands: toggleCommands });
  const isOpen = (id: string) =>
    app.store.getState().workspace.blocks[toBlockId(id)]?.props.isOpen;
  return { ...app, isOpen };
}

describe("toggle.setAllOpen", () => {
  it("opens every toggle of the page, nested ones too, in one step", () => {
    const { dispatch, isOpen, store } = createApp();

    dispatch(
      setAllTogglesOpen.create({ pageId: toBlockId("page"), isOpen: true }),
    );

    expect([isOpen("a"), isOpen("inner"), isOpen("b")]).toEqual([
      true,
      true,
      true,
    ]);
    expect(store.getState().history.undo).toHaveLength(1);
  });

  it("leaves the toggles of a subpage alone", () => {
    const { dispatch, isOpen } = createApp();

    dispatch(
      setAllTogglesOpen.create({ pageId: toBlockId("page"), isOpen: true }),
    );

    expect(isOpen("elsewhere")).toBe(false);
  });
});
