import { render } from "lit-html";
import { renderSignIn } from "../features/sign-in/index.ts";
import { selectTheme, type AppStore, type Dispatch } from "../state/index.ts";
import { restoreSelection } from "../ui/caret/index.ts";
import { renderShell } from "./shell.view.ts";
import { applyTheme } from "./theme.ts";

// The one root render: Notion's sign-in page while no one is signed in to
// the server, else the app.
export function rootRenderer(
  store: AppStore,
  dispatch: Dispatch,
  container: HTMLElement,
): () => void {
  return () => {
    const state = store.getState();
    applyTheme(selectTheme(state));
    const isSignedOut = state.persistence.account.status === "signed-out";
    render(
      isSignedOut
        ? renderSignIn(state, dispatch)
        : renderShell(state, dispatch),
      container,
    );
    restoreSelection(container, state.ui.selection);
  };
}
