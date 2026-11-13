import { describe, expect, it } from "vitest";
import { setTheme, setViewTabStyle, toggleTheme } from "./settings.commands.ts";
import { createTestApp } from "./state-builder.ts";

describe("settings.toggleTheme", () => {
  it("switches dark to light, and anything else to dark", () => {
    const { store, dispatch } = createTestApp({
      commands: [setTheme, toggleTheme],
    });
    const theme = () => store.getState().workspace.settings.theme;

    dispatch(toggleTheme.create({}));
    expect(theme()).toBe("dark");

    dispatch(toggleTheme.create({}));
    expect(theme()).toBe("light");

    dispatch(setTheme.create({ theme: "system" }));
    dispatch(toggleTheme.create({}));
    expect(theme()).toBe("dark");
  });
});

describe("settings.setViewTabStyle", () => {
  it("sets how view tabs show, and undo leaves it", () => {
    const { store, dispatch } = createTestApp({ commands: [setViewTabStyle] });
    const style = () => store.getState().workspace.settings.viewTabStyle;

    expect(style()).toBeUndefined();
    dispatch(setViewTabStyle.create({ style: "icon" }));
    expect(style()).toBe("icon");

    dispatch({ type: "history.undo" });
    expect(style()).toBe("icon");
  });
});
