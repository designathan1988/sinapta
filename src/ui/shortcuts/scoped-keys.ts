// Keys that act only while one part of the interface is active, such as
// the arrow keys while the slash menu is open. Global shortcuts are in
// shortcut-registry.ts; both are listened for here and in bootstrap only.
import type { AppState, AppStore, Dispatch } from "../../state/index.ts";
import type { KeyStroke } from "./shortcut-registry.ts";

export interface ScopedKeyContext {
  readonly state: AppState;
  readonly dispatch: Dispatch;
  readonly event: KeyboardEvent;
}

export type ScopedKeyHandler = (context: ScopedKeyContext) => void;

export interface ScopedKeys {
  // True while these keys apply, such as while the slash menu is open.
  readonly isActive: (state: AppState) => boolean;
  // Keyed by `KeyboardEvent.key`, with "Alt+" before it when Alt is held.
  readonly keys: Readonly<Record<string, ScopedKeyHandler>>;
}

function nameOf(stroke: KeyStroke): string {
  return stroke.altKey ? `Alt+${stroke.key}` : stroke.key;
}

export function matchScopedKey(
  scopes: readonly ScopedKeys[],
  state: AppState,
  stroke: KeyStroke,
): ScopedKeyHandler | undefined {
  // Keys pressed while composing belong to the input method.
  if (stroke.isComposing) return undefined;
  const name = nameOf(stroke);
  for (const scope of scopes) {
    if (!scope.isActive(state)) continue;
    if (Object.hasOwn(scope.keys, name)) return scope.keys[name];
  }
  return undefined;
}

// One listener in the capture phase, so scoped keys are caught on the way
// down, before the editor that has focus handles them.
export function installScopedKeys(
  store: AppStore,
  dispatch: Dispatch,
  scopes: readonly ScopedKeys[],
): void {
  const onKeyDown = (event: KeyboardEvent): void => {
    const state = store.getState();
    const handler = matchScopedKey(scopes, state, event);
    if (handler === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    handler({ state, dispatch, event });
  };
  document.addEventListener("keydown", onKeyDown, { capture: true });
}
