import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  parseWorkspaceFile,
  toBlockId,
} from "../../model/index.ts";
import { createTestApp } from "../../state/index.ts";
import {
  codeCommands,
  setCodeCaption,
  setCodeLanguage,
  toggleCodeWrap,
} from "./code.commands.ts";
import { codeLanguageOf, codePropsSchema } from "./code.schema.ts";

const CODE = toBlockId("code");

function createApp() {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "code", type: "code", props: { text: [] } }],
    },
  ]);
  const app = createTestApp({ workspace, commands: codeCommands });
  const props = () => app.store.getState().workspace.blocks[CODE]?.props;
  return { ...app, props };
}

// Whether a code block with these props loads from a workspace file.
function loads(props: Record<string, unknown>): boolean {
  const block = {
    id: "c",
    type: "code",
    parentId: null,
    childIds: [],
    props,
    createdAt: "",
    updatedAt: "",
  };
  const file = {
    schemaVersion: 1,
    rootIds: ["c"],
    blocks: { c: block },
    views: {},
    settings: { theme: "system" },
  };
  const result = parseWorkspaceFile(file, new Map([["code", codePropsSchema]]));
  return result.ok && result.skipped.length === 0;
}

describe("code block props", () => {
  it("accept a language, wrapping and a caption", () => {
    const props = {
      text: [{ text: "x" }],
      language: "python",
      isWrapped: true,
      caption: [{ text: "Example" }],
    };

    expect(loads(props)).toBe(true);
  });

  it("refuse a language the app does not know", () => {
    expect(loads({ text: [], language: "cobol" })).toBe(false);
  });
});

describe("codeLanguageOf", () => {
  it.each([
    ["ts", "typescript"],
    ["JS", "javascript"],
    ["bash", "shell"],
    ["c#", "csharp"],
    ["rust", "rust"],
    ["cobol", undefined],
  ])("reads %j as %j", (name, language) => {
    expect(codeLanguageOf(name)).toBe(language);
  });
});

describe("code commands", () => {
  it("set the language", () => {
    const { dispatch, props } = createApp();

    dispatch(setCodeLanguage.create({ blockId: CODE, language: "rust" }));

    expect(props()).toEqual({ text: [], language: "rust" });
  });

  it("turn line wrapping on and off", () => {
    const { dispatch, props } = createApp();

    dispatch(toggleCodeWrap.create({ blockId: CODE }));
    expect(props()?.isWrapped).toBe(true);
    dispatch(toggleCodeWrap.create({ blockId: CODE }));
    expect(props()?.isWrapped).toBe(false);
  });

  it("keep the caption as one span", () => {
    const { dispatch, props } = createApp();

    dispatch(setCodeCaption.create({ blockId: CODE, caption: "Example" }));

    expect(props()?.caption).toEqual([{ text: "Example" }]);
  });

  it("remove the caption when it is cleared", () => {
    const { dispatch, props } = createApp();
    dispatch(setCodeCaption.create({ blockId: CODE, caption: "Example" }));

    dispatch(setCodeCaption.create({ blockId: CODE, caption: null }));

    expect(props()).toEqual({ text: [] });
  });

  it("are undone in one step", () => {
    const { store, dispatch } = createApp();
    const before = store.getState().workspace;
    dispatch(setCodeLanguage.create({ blockId: CODE, language: "go" }));

    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });
});
