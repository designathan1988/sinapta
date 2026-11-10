// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { startPointerDrag, type DragPosition } from "./pointer-drag.ts";

function mount() {
  const list = document.createElement("ul");
  list.innerHTML = "<li data-item>one</li><li data-item>two</li>";
  document.body.replaceChildren(list);
  const [one, two] = [...list.querySelectorAll<HTMLElement>("[data-item]")];
  if (one === undefined || two === undefined) throw new Error("setup failed");
  const drops: [string, string, DragPosition][] = [];
  list.addEventListener("pointerdown", (event) => {
    startPointerDrag(event, {
      itemSelector: "[data-item]",
      onDrop(source, target, position) {
        drops.push([source.textContent, target.textContent, position]);
      },
    });
  });
  // Stand in for layout: the pointer is over whichever item a test names.
  let under: Element = one;
  document.elementFromPoint = () => under;
  const fire = (type: string, target: Element, y = 0): void => {
    under = target;
    const init = { bubbles: true, clientX: 0, clientY: y, button: 0 };
    target.dispatchEvent(new PointerEvent(type, init));
  };
  return { list, one, two, drops, fire };
}

describe("startPointerDrag", () => {
  it("reports a drop on another item", () => {
    const { one, two, drops, fire } = mount();

    fire("pointerdown", one);
    fire("pointermove", two, 40);
    fire("pointerup", two, 40);

    expect(drops.map(([source, target]) => [source, target])).toEqual([
      ["one", "two"],
    ]);
  });

  it("does not treat a press without movement as a drag", () => {
    const { one, drops, fire } = mount();

    fire("pointerdown", one);
    fire("pointerup", one);

    expect(drops).toEqual([]);
    expect(one.hasAttribute("data-dragging")).toBe(false);
  });

  it("swallows the click that ends a drag", () => {
    const { list, one, two, fire } = mount();
    const onClick = vi.fn();
    list.addEventListener("click", onClick);

    fire("pointerdown", one);
    fire("pointermove", two, 40);
    fire("pointerup", two, 40);
    two.click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("lets a later click through when the drag ended without a click", () => {
    const { list, one, two, fire } = mount();
    const onClick = vi.fn();
    list.addEventListener("click", onClick);
    fire("pointerdown", one);
    fire("pointermove", two, 40);
    fire("pointerup", two, 40);

    fire("pointerdown", one);
    fire("pointerup", one);
    one.click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("drops before or after, never inside, along the inline axis", () => {
    const row = document.createElement("div");
    row.innerHTML = "<span data-item>one</span><span data-item>two</span>";
    document.body.replaceChildren(row);
    const [one, two] = [...row.querySelectorAll<HTMLElement>("[data-item]")];
    if (one === undefined || two === undefined) throw new Error("setup");
    const positions: DragPosition[] = [];
    row.addEventListener("pointerdown", (event) => {
      startPointerDrag(event, {
        axis: "inline",
        itemSelector: "[data-item]",
        onDrop: (_source, _target, position) => positions.push(position),
      });
    });
    two.getBoundingClientRect = () => new DOMRect(100, 0, 100, 20);
    let under: Element = one;
    document.elementFromPoint = () => under;
    const fire = (type: string, target: Element, x: number): void => {
      under = target;
      const init = { bubbles: true, clientX: x, clientY: 0, button: 0 };
      target.dispatchEvent(new PointerEvent(type, init));
    };

    fire("pointerdown", one, 0);
    fire("pointermove", two, 150);
    fire("pointerup", two, 150);
    fire("pointerdown", one, 0);
    fire("pointermove", two, 120);
    fire("pointerup", two, 120);

    expect(positions).toEqual(["after", "before"]);
  });
});
