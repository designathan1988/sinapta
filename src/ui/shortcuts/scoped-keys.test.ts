import { describe, expect, it } from "vitest";
import { createTestApp } from "../../state/index.ts";
import {
  matchScopedKey,
  type KeyStroke,
  type ScopedKeyHandler,
  type ScopedKeys,
} from "./index.ts";

function stroke(overrides: Partial<KeyStroke>): KeyStroke {
  return {
    key: "ArrowDown",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    ...overrides,
  };
}

// Three distinct handlers, told apart by identity.
const down: ScopedKeyHandler = () => undefined;
const other: ScopedKeyHandler = () => undefined;
const toolbar: ScopedKeyHandler = () => undefined;

function scope(isActive: boolean, keys: ScopedKeys["keys"]): ScopedKeys {
  return { isActive: () => isActive, keys };
}

describe("matchScopedKey", () => {
  const state = createTestApp().store.getState();

  it("returns the handler of the first active scope", () => {
    const scopes = [
      scope(false, { ArrowDown: other }),
      scope(true, { ArrowDown: down }),
      scope(true, { ArrowDown: other }),
    ];
    expect(matchScopedKey(scopes, state, stroke({}))).toBe(down);
  });

  it("returns nothing when no scope is active", () => {
    const scopes = [scope(false, { ArrowDown: down })];
    expect(matchScopedKey(scopes, state, stroke({}))).toBeUndefined();
  });

  it("returns nothing while an input method is composing", () => {
    const scopes = [scope(true, { ArrowDown: down })];
    const composing = stroke({ isComposing: true });
    expect(matchScopedKey(scopes, state, composing)).toBeUndefined();
  });

  it("names a key held with Alt as Alt plus the key", () => {
    const scopes = [scope(true, { "Alt+F10": toolbar })];
    const withAlt = stroke({ key: "F10", altKey: true });
    expect(matchScopedKey(scopes, state, withAlt)).toBe(toolbar);
    expect(
      matchScopedKey(scopes, state, stroke({ key: "F10" })),
    ).toBeUndefined();
  });
});
