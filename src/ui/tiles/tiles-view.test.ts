// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { renderTiles } from "./tiles.view.ts";

function draw(current: "number" | "bar" | "ring") {
  const host = document.createElement("div");
  const picked: string[] = [];
  render(
    renderTiles({
      label: "Show as",
      tiles: [
        { value: "number", picture: "42", label: "Number" },
        { value: "bar", picture: "", label: "Bar" },
        { value: "ring", picture: "", label: "Ring" },
      ],
      current,
      onPick: (value) => picked.push(value),
    }),
    host,
  );
  const tiles = [...host.querySelectorAll<HTMLButtonElement>(".tiles__tile")];
  return { host, picked, tiles };
}

describe("renderTiles", () => {
  it("draws a named group of tiles, the chosen one pressed", () => {
    const { host, tiles } = draw("bar");

    expect(host.querySelector(".tiles")?.getAttribute("aria-label")).toBe(
      "Show as",
    );
    expect(tiles.map((tile) => tile.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    expect(tiles[0]?.textContent).toContain("Number");
  });

  it("calls onPick with a clicked tile's value", () => {
    const { picked, tiles } = draw("number");

    tiles[2]?.click();

    expect(picked).toEqual(["ring"]);
  });

  it("is reached and pressed with the keyboard, each tile a button", () => {
    const { tiles } = draw("number");

    expect(tiles.every((tile) => tile.type === "button")).toBe(true);
  });
});
