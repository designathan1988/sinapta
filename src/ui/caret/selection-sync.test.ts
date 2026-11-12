// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createTestApp, setSelection, uiCommands } from "../../state/index.ts";
import { installSelectionSync } from "./selection-sync.ts";

const CARET = { blockId: toBlockId("a"), anchorOffset: 2, focusOffset: 2 };

describe("installSelectionSync", () => {
  it("keeps the text's selection while a field in an overlay has focus", () => {
    document.body.innerHTML = `<div data-block-id="a">
      <p data-text contenteditable="true">hello</p>
    </div><div data-overlay><input /></div>`;
    const app = createTestApp({ commands: uiCommands });
    installSelectionSync(app.store, app.dispatch);
    app.dispatch(setSelection.create({ selection: CARET }));

    document.querySelector("input")?.focus();
    document.dispatchEvent(new Event("selectionchange"));

    expect(app.store.getState().ui.selection).toEqual(CARET);
  });
});
