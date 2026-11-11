import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  parseWorkspaceFile,
  toBlockId,
  type Block,
} from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import { BLOCK_PROPS_SCHEMAS } from "../block-registry.ts";
import { headingDefinition } from "./heading.definition.ts";
import { headingCommands, setHeadingOpen } from "./heading.commands.ts";

const H = toBlockId("h");

function workspaceWith(props: object) {
  return buildWorkspace([
    {
      id: "page",
      props: { title: [], icon: null, isFavorite: false, isTrashed: false },
      children: [
        {
          id: "h",
          type: "heading",
          props: { text: [{ text: "Plan" }], ...props },
          children: [{ id: "inside", type: "paragraph", props: { text: [] } }],
        },
      ],
    },
  ]);
}

describe("toggle headings", () => {
  it("opens and closes a toggle heading", () => {
    const workspace = workspaceWith({
      level: 2,
      isToggleable: true,
      isOpen: true,
    });
    const { store, dispatch } = createTestApp({
      workspace,
      commands: headingCommands,
    });

    dispatch(setHeadingOpen.create({ blockId: H, isOpen: false }));

    expect(store.getState().workspace.blocks[H]?.props.isOpen).toBe(false);
  });

  it("hides the blocks inside a closed toggle heading only", () => {
    const shows = (props: object): boolean | undefined => {
      const block: Block | undefined = workspaceWith(props).blocks[H];
      return block === undefined
        ? undefined
        : headingDefinition.showsChildren?.(block);
    };

    expect(shows({ level: 1, isToggleable: true, isOpen: false })).toBe(false);
    expect(shows({ level: 1, isToggleable: true, isOpen: true })).toBe(true);
    expect(shows({ level: 1 })).toBe(true);
  });

  it("reads a heading of level 4 and a toggle heading from a file", () => {
    const workspace = workspaceWith({
      level: 4,
      isToggleable: true,
      isOpen: false,
    });
    const file = { schemaVersion: 7, ...workspace };

    const result = parseWorkspaceFile(file, BLOCK_PROPS_SCHEMAS);

    expect(result).toMatchObject({ ok: true, skipped: [] });
  });
});
