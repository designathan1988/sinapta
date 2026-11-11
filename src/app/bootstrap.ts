// The composition root: creates the one store, registers every command and
// owns the single root render.
import { render } from "lit-html";
import {
  BLOCK_COMMANDS,
  BLOCK_PROPS_SCHEMAS,
} from "../blocks/block-registry.ts";
import {
  pageCommands,
  pageDuplicateCommands,
  pageMoveCommands,
  pageTrashCommands,
} from "../blocks/page/index.ts";
import { databaseCommands } from "../features/database/index.ts";
import { editorCommands } from "../features/editor/index.ts";
import { installSlashMenuKeys } from "../features/slash-menu/index.ts";
import type { Theme } from "../model/index.ts";
import {
  createAppStore,
  createCommandRegistry,
  createDispatcher,
  createInitialState,
  persistenceCommands,
  selectTheme,
  settingsCommands,
  uiCommands,
  workspaceCommands,
} from "../state/index.ts";
import {
  createIndexedDbAdapter,
  startFileTools,
  startRepository,
} from "../persistence/index.ts";
import { installSelectionSync, restoreSelection } from "../ui/caret/index.ts";
import { installOverlayDismiss } from "../ui/overlay/index.ts";
import { matchShortcut } from "../ui/shortcuts/index.ts";
import { installTooltip } from "../ui/tooltip/index.ts";
import { startRouter } from "./router.ts";
import { renderShell } from "./shell.view.ts";

const COMMANDS = [
  ...uiCommands,
  ...settingsCommands,
  ...persistenceCommands,
  ...workspaceCommands,
  ...pageCommands,
  ...pageTrashCommands,
  ...pageMoveCommands,
  ...pageDuplicateCommands,
  ...BLOCK_COMMANDS,
  ...editorCommands,
  ...databaseCommands,
];

// A manual theme is an attribute on the root element; "system" removes it.
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (theme === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = theme;
  meta?.setAttribute("content", theme === "system" ? "light dark" : theme);
}

export async function startApp(container: HTMLElement): Promise<void> {
  const store = createAppStore(createInitialState());
  const dispatch = createDispatcher({
    store,
    registry: createCommandRegistry(COMMANDS),
  });
  const renderRoot = (): void => {
    const state = store.getState();
    applyTheme(selectTheme(state));
    render(renderShell(state, dispatch), container);
    restoreSelection(container, state.ui.selection);
  };
  // Nothing is rendered until stored data is in the store, so the first
  // paint already has the saved theme and layout.
  startFileTools({ store, dispatch, propsSchemas: BLOCK_PROPS_SCHEMAS });
  await startRepository({
    store,
    dispatch,
    adapter: createIndexedDbAdapter(),
    propsSchemas: BLOCK_PROPS_SCHEMAS,
  });
  startRouter(store, dispatch);
  installOverlayDismiss(store, dispatch);
  installSelectionSync(store, dispatch);
  installSlashMenuKeys(store, dispatch);
  installTooltip();
  document.addEventListener("keydown", (event) => {
    const shortcut = matchShortcut(event);
    if (shortcut === undefined) return;
    event.preventDefault();
    dispatch(shortcut.command);
  });
  store.subscribe(renderRoot);
  renderRoot();
}
