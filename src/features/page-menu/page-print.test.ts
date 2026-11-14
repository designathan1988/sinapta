import { afterEach, describe, expect, it, vi } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { exportItems } from "./page-menu-items.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Print or save as PDF", () => {
  it("prints the page, whose chrome the print style hides", () => {
    const print = vi.fn();
    vi.stubGlobal("window", { print });
    const item = exportItems(createInitialState(), toBlockId("page")).find(
      (entry) => entry.label === "Print or save as PDF",
    );

    item?.onSelect?.();

    expect(print).toHaveBeenCalledTimes(1);
  });
});
