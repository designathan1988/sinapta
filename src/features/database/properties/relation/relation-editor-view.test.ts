// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { toBlockId } from "../../../../model/index.ts";
import { renderRelationEditor } from "./relation-editor.view.ts";

describe("renderRelationEditor", () => {
  it("adds and removes a related page with its checkbox", () => {
    const chosen: string[][] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderRelationEditor({
        selected: ["a"],
        choices: [
          { id: toBlockId("a"), title: "Alpha" },
          { id: toBlockId("b"), title: "" },
        ],
        onChange: (ids) => chosen.push([...ids]),
      }),
      host,
    );
    const boxes = [...host.querySelectorAll<HTMLInputElement>("input")];

    expect(boxes.map((box) => box.checked)).toEqual([true, false]);
    expect(host.textContent).toContain("Untitled");
    boxes[1]?.click();
    boxes[0]?.click();

    expect(chosen).toEqual([["a", "b"], []]);
  });
});
