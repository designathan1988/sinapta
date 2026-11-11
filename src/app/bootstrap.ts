// The composition root: creates the one store, registers every command and
// owns the single root render.
import { render } from "lit-html";
import {
  BLOCK_COMMANDS,
  BLOCK_PROPS_SCHEMAS,
  BLOCK_TIDIERS,
} from "../blocks/index.ts";
import {
  pageCommands,
  pageStyleCommands,
  pageDuplicateCommands,
  pageMoveCommands,
  pageTrashCommands,
} from "../blocks/page/index.ts";
import { databaseCommands } from "../features/database/index.ts";
import { editorCommands } from "../features/editor/index.ts";
import { formatToolbarKeys } from "../features/format-toolbar/index.ts";
import {
  onboardingCommands,
  seedGettingStarted,
} from "../features/onboarding/index.ts";
import { emojiMenuKeys } from "../features/emoji-menu/index.ts";
import { mentionMenuKeys } from "../features/mention-menu/index.ts";
import { slashMenuKeys } from "../features/slash-menu/index.ts";
import {
  createAppStore,
  type AppStore,
  type Dispatch,
  createCommandRegistry,
  createDispatcher,
  createInitialState,
  assetCommands,
  persistenceCommands,
  selectTheme,
  settingsCommands,
  uiCommands,
  workspaceCommands,
} from "../state/index.ts";
import {
  createIndexedDbAdapter,
  createTabCoordination,
  startAssetStore,
  startFileTools,
  startRepository,
  type RepositoryStart,
} from "../persistence/index.ts";
import { installAssetSaver } from "../ui/asset/index.ts";
import { installSelectionSync, restoreSelection } from "../ui/caret/index.ts";
import { installOverlayDismiss } from "../ui/overlay/index.ts";
import { installScopedKeys, matchShortcut } from "../ui/shortcuts/index.ts";
import { installTooltip } from "../ui/tooltip/index.ts";
import { startRouter } from "./router.ts";
import { applyTheme } from "./theme.ts";
import { renderShell } from "./shell.view.ts";

const COMMANDS = [
  ...uiCommands,
  ...settingsCommands,
  ...persistenceCommands,
  ...assetCommands,
  ...workspaceCommands,
  ...pageCommands,
  ...pageTrashCommands,
  ...pageMoveCommands,
  ...pageDuplicateCommands,
  ...pageStyleCommands,
  ...BLOCK_COMMANDS,
  ...editorCommands,
  ...databaseCommands,
  ...onboardingCommands,
];

// Keys that apply while one part of the interface is active.
const SCOPED_KEYS = [
  slashMenuKeys,
  mentionMenuKeys,
  emojiMenuKeys,
  formatToolbarKeys,
];

// Loads the stored workspace, then keeps saving it, and keeps the files
// people add beside it.
async function startPersistence(
  store: AppStore,
  dispatch: Dispatch,
): Promise<RepositoryStart> {
  const adapter = createIndexedDbAdapter();
  startFileTools({
    store,
    dispatch,
    adapter,
    propsSchemas: BLOCK_PROPS_SCHEMAS,
  });
  const { isFirstRun } = await startRepository({
    store,
    dispatch,
    adapter,
    propsSchemas: BLOCK_PROPS_SCHEMAS,
    tabs: createTabCoordination(),
  });
  // Files people add to blocks are kept beside the workspace.
  installAssetSaver(startAssetStore({ adapter, dispatch }));
  return { isFirstRun };
}

export async function startApp(container: HTMLElement): Promise<void> {
  const store = createAppStore(createInitialState());
  const dispatch = createDispatcher({
    store,
    registry: createCommandRegistry(COMMANDS),
    tidiers: BLOCK_TIDIERS,
  });
  const renderRoot = (): void => {
    const state = store.getState();
    applyTheme(selectTheme(state));
    render(renderShell(state, dispatch), container);
    restoreSelection(container, state.ui.selection);
  };
  // Nothing is rendered until stored data is in the store, so the first
  // paint already has the saved theme and layout.
  const { isFirstRun } = await startPersistence(store, dispatch);
  // A first visit opens a short tour; it is saved like any other change.
  if (isFirstRun) dispatch(seedGettingStarted.create({}));
  startRouter(store, dispatch);
  installOverlayDismiss(store, dispatch);
  installSelectionSync(store, dispatch);
  installScopedKeys(store, dispatch, SCOPED_KEYS);
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
