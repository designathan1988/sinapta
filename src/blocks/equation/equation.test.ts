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
import { equationCommands, setEquation } from "./equation.commands.ts";
import type { EquationBlock } from "./equation.schema.ts";
import { EQUATION_EDITOR, renderEquation } from "./equation.view.ts";

const EQUATION = toBlockId("e");
const block: EquationBlock = {
  id: EQUATION,
  type: "equation",
  parentId: toBlockId("page"),
  childIds: [],
  props: { expression: "\\frac{a}{b}" },
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
  render(renderEquation(block, dispatch, state), host);
  return { host, sent };
}

describe("equation.set", () => {
  it("changes the expression, and typing undoes as one step", () => {
    const workspace = buildWorkspace([{ id: "page", children: [block] }]);
    const app = createTestApp({ workspace, commands: equationCommands });
    const expression = () =>
      app.store.getState().workspace.blocks[EQUATION]?.props.expression;
    for (const value of ["x", "x^", "x^2"]) {
      app.dispatch(
        setEquation.create({ blockId: EQUATION, expression: value }),
      );
    }
    expect(expression()).toBe("x^2");

    app.dispatch({ type: "history.undo" });

    expect(expression()).toBe("\\frac{a}{b}");
  });
});

describe("renderEquation", () => {
  it("draws the equation as MathML, with no markup from strings", () => {
    const math = rendered().host.querySelector("math");

    expect(math?.getAttribute("display")).toBe("block");
    expect(math?.querySelector("mfrac")).not.toBeNull();
  });

  it("opens its editor when pressed", () => {
    const { host, sent } = rendered();

    host.querySelector<HTMLElement>(".equation__display")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: EQUATION_EDITOR, anchorId: "e" },
      }),
    ]);
  });

  it("changes the expression as it is typed in the editor", () => {
    const initial = createInitialState();
    const overlay = { kind: EQUATION_EDITOR, anchorId: "e" };
    const { host, sent } = rendered({
      ...initial,
      ui: { ...initial.ui, overlay },
    });
    const field = host.querySelector("textarea");
    if (field === null) throw new Error("no editor");

    field.value = "x^2";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({ type: "equation.set", expression: "x^2" }),
    ]);
  });
});
