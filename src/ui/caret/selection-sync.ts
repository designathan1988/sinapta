// Keeps `ui.selection` in step with the browser's caret. The browser owns
// the caret while the user moves it; the store learns where it ended up.
import {
  setSelection,
  type AppStore,
  type Dispatch,
} from "../../state/index.ts";
import { readSelection } from "./caret.ts";

export function installSelectionSync(
  store: AppStore,
  dispatch: Dispatch,
): void {
  document.addEventListener("selectionchange", () => {
    const active = document.activeElement;
    // While composing, the caret belongs to the input method.
    if (active?.closest("[data-composing]") != null) return;
    const selection =
      active?.closest("[data-text]") == null ? null : readSelection();
    if (selection === null && store.getState().ui.selection === null) return;
    dispatch(setSelection.create({ selection }));
  });
}
