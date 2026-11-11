// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import type { ButtonBlock } from "./button.schema.ts";
import { BUTTON_CONFIG, renderButtonBlock } from "./button.view.ts";

const block: ButtonBlock = {
  id: toBlockId("b"),
  type: "button",
  parentId: toBlockId("page"),
  childIds: [],
  props: {
    label: "Add notes",
    actions: [
      {
        kind: "insert-blocks",
        blocks: [{ type: "paragraph", text: [{ text: "x" }] }],
      },
    ],
  },
  createdAt: "",
  updatedAt: "",
};

function rendered(state: AppState = createInitialState()) {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderButtonBlock(block, dispatch, state), host);
  return { host, sent };
}

describe("renderButtonBlock", () => {
  it("runs the button's actions when pressed", () => {
    const { host, sent } = rendered();

    host.querySelector<HTMLElement>(".button-block__press")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "button.press",
        blockId: "b",
        blockCount: 1,
      }),
    ]);
  });

  it("sets the blocks to insert from Markdown lines", () => {
    const initial = createInitialState();
    const overlay = { kind: BUTTON_CONFIG, anchorId: "b" };
    const { host, sent } = rendered({
      ...initial,
      ui: { ...initial.ui, overlay },
    });
    const field = host.querySelector<HTMLTextAreaElement>("textarea");
    if (field === null) throw new Error("no settings");

    expect(field.value).toBe("x");
    field.value = "## Notes\n- [ ] Follow up";
    field.dispatchEvent(new Event("change"));

    const set = sent.find((command) => command.type === "button.setActions");
    expect(set).toMatchObject({
      actions: [
        {
          kind: "insert-blocks",
          blocks: [
            { type: "heading", text: [{ text: "Notes" }], level: 2 },
            { type: "to-do", text: [{ text: "Follow up" }], isChecked: false },
          ],
        },
      ],
    });
  });
});
