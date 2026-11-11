import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createApp, text } from "./editor-builder.ts";
import {
  makeInlineEquation,
  setInlineEquation,
} from "./editor-equation.commands.ts";

const A = toBlockId("a");

function app(value = "so x^2 holds") {
  const built = createApp([text("a", value)]);
  const spans = () => built.store.getState().workspace.blocks[A]?.props.text;
  return { ...built, spans };
}

describe("text.makeEquation", () => {
  it("turns the selected text into an inline equation", () => {
    const { dispatch, spans, store } = app();

    dispatch(makeInlineEquation.create({ blockId: A, start: 3, end: 6 }));

    expect(spans()).toEqual([
      { text: "so " },
      { text: "x^2", equation: "x^2" },
      { text: " holds" },
    ]);
    expect(store.getState().ui.selection).toMatchObject({ focusOffset: 6 });
  });

  it("does nothing without selected text", () => {
    const { dispatch, spans } = app();

    dispatch(makeInlineEquation.create({ blockId: A, start: 3, end: 3 }));

    expect(spans()).toEqual([{ text: "so x^2 holds" }]);
  });
});

describe("text.setEquation", () => {
  it("changes an inline equation's source", () => {
    const { dispatch, spans } = app();
    dispatch(makeInlineEquation.create({ blockId: A, start: 3, end: 6 }));

    dispatch(
      setInlineEquation.create({ blockId: A, start: 3, end: 6, source: "y_1" }),
    );

    expect(spans()).toEqual([
      { text: "so " },
      { text: "y_1", equation: "y_1" },
      { text: " holds" },
    ]);
  });

  it("removes an inline equation whose source is cleared", () => {
    const { dispatch, spans } = app();
    dispatch(makeInlineEquation.create({ blockId: A, start: 3, end: 6 }));

    dispatch(
      setInlineEquation.create({ blockId: A, start: 3, end: 6, source: "" }),
    );

    expect(spans()).toEqual([{ text: "so  holds" }]);
  });
});
