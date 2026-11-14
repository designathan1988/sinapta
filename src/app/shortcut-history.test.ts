// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../state/index.ts";
import { runShortcutAction } from "./shortcut-actions.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

function run(action: "back" | "forward" | "copy-link") {
  runShortcutAction(action, createInitialState(), () => ({ ok: true }));
}

describe("Ctrl+[, Ctrl+] and Ctrl+L", () => {
  it("go back and forward through the pages opened, as the browser does", () => {
    const history = { back: vi.fn(), forward: vi.fn() };
    vi.stubGlobal("history", history);

    run("back");
    run("forward");

    expect(history.back).toHaveBeenCalledTimes(1);
    expect(history.forward).toHaveBeenCalledTimes(1);
  });

  it("copies the open page's address", () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("location", { href: "http://pagecraft.test/#/page/a" });

    run("copy-link");

    expect(writeText).toHaveBeenCalledWith("http://pagecraft.test/#/page/a");
  });
});
