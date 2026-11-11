// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  createTestApp,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { calloutCommands, setCalloutIcon } from "./callout.commands.ts";
import type { CalloutBlock } from "./callout.schema.ts";
import { CALLOUT_ICON_OVERLAY, renderCallout } from "./callout.view.ts";

const CALLOUT = toBlockId("c");
const block: CalloutBlock = {
  id: CALLOUT,
  type: "callout",
  parentId: toBlockId("page"),
  childIds: [],
  props: { text: [], icon: "💡" },
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
  render(renderCallout(block, dispatch, state), host);
  return { host, sent };
}

describe("callout.setIcon", () => {
  it("changes the icon, and an empty icon removes it", () => {
    const workspace = buildWorkspace([{ id: "page", children: [block] }]);
    const app = createTestApp({ workspace, commands: calloutCommands });
    const icon = () =>
      app.store.getState().workspace.blocks[CALLOUT]?.props.icon;

    app.dispatch(setCalloutIcon.create({ blockId: CALLOUT, icon: "🔥" }));
    expect(icon()).toBe("🔥");
    app.dispatch(setCalloutIcon.create({ blockId: CALLOUT, icon: "" }));
    expect(icon()).toBe("");
  });
});

describe("renderCallout", () => {
  it("opens the emoji picker from its icon", () => {
    const { host, sent } = rendered();

    host.querySelector<HTMLElement>(".callout__icon")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: CALLOUT_ICON_OVERLAY, anchorId: "c" },
      }),
    ]);
  });

  it("sets the emoji chosen in the picker", () => {
    const initial = createInitialState();
    const overlay = { kind: CALLOUT_ICON_OVERLAY, anchorId: "c" };
    const { host, sent } = rendered({
      ...initial,
      ui: { ...initial.ui, overlay },
    });
    const choice = host.querySelector<HTMLElement>("[data-emoji]");

    choice?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "callout.setIcon",
        icon: choice?.dataset.emoji,
      }),
    );
  });
});
