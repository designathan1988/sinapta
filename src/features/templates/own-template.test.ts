import { describe, expect, it } from "vitest";
import {
  pageTemplateCommands,
  selectPageCopySize,
  setPageTemplate,
} from "../../blocks/page/index.ts";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import { createTestApp, UNDO_COMMAND } from "../../state/index.ts";
import { useOwnTemplate } from "./own-template.commands.ts";
import { selectOwnTemplates } from "./own-templates.view.ts";
import { templateCommands } from "./template.commands.ts";

const PLAN = toBlockId("plan");

function createApp() {
  const workspace = buildWorkspace([
    {
      id: "home",
      props: { title: [{ text: "Home" }], icon: null, isTrashed: false },
      children: [
        {
          id: "plan",
          props: {
            title: [{ text: "Weekly plan" }],
            icon: null,
            isTrashed: false,
          },
          children: [
            {
              id: "p",
              type: "paragraph",
              props: { text: [{ text: "Goals" }] },
            },
          ],
        },
      ],
    },
  ]);
  return createTestApp({
    workspace,
    commands: [...pageTemplateCommands, ...templateCommands],
  });
}

describe("save as template", () => {
  it("puts the page in Your templates, and takes it out again", () => {
    const { store, dispatch } = createApp();

    dispatch(setPageTemplate.create({ pageId: PLAN, isTemplate: true }));
    const saved = selectOwnTemplates(store.getState()).map((page) => page.id);
    dispatch(setPageTemplate.create({ pageId: PLAN, isTemplate: false }));

    expect(saved).toEqual([PLAN]);
    expect(selectOwnTemplates(store.getState())).toEqual([]);
    expect(store.getState().workspace.blocks[PLAN]?.parentId).toBe(
      toBlockId("home"),
    );
  });

  it("makes a top-level copy of a saved page, not itself a template, and opens it", () => {
    const { store, dispatch } = createApp();
    dispatch(setPageTemplate.create({ pageId: PLAN, isTemplate: true }));
    const size = selectPageCopySize(store.getState(), PLAN);

    dispatch(useOwnTemplate.create({ pageId: PLAN, ...size }));

    const { workspace, ui } = store.getState();
    const copyId = workspace.rootIds.at(-1);
    const copy = copyId === undefined ? undefined : workspace.blocks[copyId];
    expect(copy?.parentId).toBeNull();
    expect(copy?.props).toMatchObject({ title: [{ text: "Weekly plan" }] });
    expect(copy?.props).not.toHaveProperty("isTemplate");
    expect(copy?.childIds).toHaveLength(1);
    expect(ui.activePageId).toBe(copyId);
  });

  it("is undone in one step", () => {
    const { store, dispatch } = createApp();
    dispatch(setPageTemplate.create({ pageId: PLAN, isTemplate: true }));
    const size = selectPageCopySize(store.getState(), PLAN);
    dispatch(useOwnTemplate.create({ pageId: PLAN, ...size }));

    dispatch({ type: UNDO_COMMAND });

    expect(store.getState().workspace.rootIds).toEqual([toBlockId("home")]);
  });
});
