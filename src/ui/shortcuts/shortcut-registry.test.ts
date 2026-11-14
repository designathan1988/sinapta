import { describe, expect, it } from "vitest";
import { REDO_COMMAND, UNDO_COMMAND } from "../../state/index.ts";
import { matchShortcut, type KeyStroke } from "./shortcut-registry.ts";

function stroke(overrides: Partial<KeyStroke>): KeyStroke {
  return {
    key: "z",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    ...overrides,
  };
}

describe("Notion's navigation keys", () => {
  it.each([
    ["Ctrl+N", stroke({ key: "n", ctrlKey: true }), "new-page"],
    ["Ctrl+[", stroke({ key: "[", ctrlKey: true }), "back"],
    ["Ctrl+]", stroke({ key: "]", ctrlKey: true }), "forward"],
    ["Ctrl+L", stroke({ key: "l", ctrlKey: true }), "copy-link"],
    [
      "Ctrl+Alt+L, as Notion's page menu shows it",
      stroke({ key: "l", ctrlKey: true, altKey: true }),
      "copy-link",
    ],
    [
      "Ctrl+Shift+P, Notion's Move to",
      stroke({ key: "P", ctrlKey: true, shiftKey: true }),
      "move-to",
    ],
    [
      "Ctrl+Shift+U",
      stroke({ key: "U", ctrlKey: true, shiftKey: true }),
      "parent-page",
    ],
  ])("match %s", (_, keyStroke, action) => {
    expect(matchShortcut(keyStroke)?.action).toBe(action);
  });
});

describe("matchShortcut", () => {
  it.each([
    ["Ctrl+Z", stroke({ ctrlKey: true }), UNDO_COMMAND],
    ["Cmd+Z", stroke({ metaKey: true }), UNDO_COMMAND],
    [
      "Ctrl+Shift+Z",
      stroke({ key: "Z", ctrlKey: true, shiftKey: true }),
      REDO_COMMAND,
    ],
    ["Ctrl+Y", stroke({ key: "y", ctrlKey: true }), REDO_COMMAND],
  ])("matches %s", (_, keyStroke, type) => {
    expect(matchShortcut(keyStroke)?.command?.type).toBe(type);
  });

  it.each(["?", "/"])(
    "opens the shortcut reference for Ctrl+Shift and slash reported as %j",
    (key) => {
      const shortcut = matchShortcut(
        stroke({ key, ctrlKey: true, shiftKey: true }),
      );

      expect(shortcut?.command).toMatchObject({
        overlay: { kind: "shortcut-help" },
      });
    },
  );

  it("switches between light and dark on Ctrl+Shift+L", () => {
    const shortcut = matchShortcut(
      stroke({ key: "L", ctrlKey: true, shiftKey: true }),
    );

    expect(shortcut?.command?.type).toBe("settings.toggleTheme");
  });

  it("ignores a key with no modifier", () => {
    expect(matchShortcut(stroke({}))).toBeUndefined();
  });

  it("ignores a key that has no shortcut", () => {
    expect(matchShortcut(stroke({ key: "q", ctrlKey: true }))).toBeUndefined();
  });

  it("ignores keys pressed while an input method is composing", () => {
    const composing = stroke({ ctrlKey: true, isComposing: true });

    expect(matchShortcut(composing)).toBeUndefined();
  });
});

describe("search and comment keys", () => {
  it.each([
    ["Ctrl+K", stroke({ key: "k", ctrlKey: true })],
    ["Cmd+K", stroke({ key: "k", metaKey: true })],
    ["Ctrl+P", stroke({ key: "p", ctrlKey: true })],
  ])("%s opens search", (_, keyStroke) => {
    expect(matchShortcut(keyStroke)?.command).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: "command-palette" },
    });
  });

  it("Ctrl+Shift+M comments on the selection", () => {
    const keyStroke = stroke({ key: "M", ctrlKey: true, shiftKey: true });

    expect(matchShortcut(keyStroke)?.action).toBe("comment");
  });
});
