// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { revealBlock } from "./index.ts";

describe("revealBlock", () => {
  it("scrolls the block into view and flashes it, once rendered", async () => {
    const block = document.createElement("div");
    block.dataset.blockId = "b-1";
    const scroll = vi.fn();
    block.scrollIntoView = scroll;
    document.body.append(block);

    revealBlock("b-1", "start");
    expect(block.hasAttribute("data-flash")).toBe(false);
    await Promise.resolve();

    expect(scroll).toHaveBeenCalledWith({ block: "start" });
    expect(block.hasAttribute("data-flash")).toBe(true);
    block.dispatchEvent(new Event("animationend"));
    expect(block.hasAttribute("data-flash")).toBe(false);
    block.remove();
  });

  it("does nothing for a block that is not in the page", async () => {
    revealBlock("missing");
    await Promise.resolve();

    expect(document.querySelector("[data-flash]")).toBeNull();
  });
});
