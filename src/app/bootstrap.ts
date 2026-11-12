// The composition root: creates the one store, registers every command and
// owns the single root render.
import { render } from "lit-html";
import {
  BLOCK_COMMANDS,
  BLOCK_PROPS_SCHEMAS,
  BLOCK_TIDIERS,
} from "../blocks/index.ts";
import {
  emptyOldTrash,
  lockGuard,
  pageCommands,
  pageLockCommands,
  pageStyleCommands,
  pageDuplicateCommands,
  pageMoveCommands,
  pageTrashCommands,
} from "../blocks/page/index.ts";
import {
  DATABASE_TIDIERS,
  databaseCommands,
  withPropertyConfigs,
} from "../features/database/index.ts";
import { editorCommands } from "../features/editor/index.ts";
import { peekCommands } from "../features/row-peek/index.ts";
import { templateCommands } from "../features/templates/index.ts";
import { inboxCommands } from "../features/inbox/index.ts";
import { markdownImportCommands } from "../features/markdown-import/index.ts";
import { startReminderNotices } from "./reminder-notices.ts";
import {
  pageContent,
  pageHistoryCommands,
} from "../features/page-history/index.ts";
import {
  commentCommands,
  discussionTidier,
} from "../features/comments/index.ts";
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
  pageVersionCommands,
  uiCommands,
  workspaceCommands,
} from "../state/index.ts";
import {
  createIndexedDbAdapter,
  createTabCoordination,
  createIndexedDbSnapshots,
  startAssetStore,
  startFileTools,
  startSnapshots,
  startRepository,
  type RepositoryStart,
} from "../persistence/index.ts";
import { installAssetSaver } from "../ui/asset/index.ts";
import { installSelectionSync, restoreSelection } from "../ui/caret/index.ts";
import { announce } from "../ui/announcer/index.ts";
import { COPY } from "../ui/copy.ts";
import { installOverlayDismiss } from "../ui/overlay/index.ts";
import { installScopedKeys, matchShortcut } from "../ui/shortcuts/index.ts";
import { installTooltip } from "../ui/tooltip/index.ts";
import { startRouter } from "./router.ts";
import { runShortcutAction } from "./shortcut-actions.ts";
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
  ...pageLockCommands,
  ...BLOCK_COMMANDS,
  ...editorCommands,
  ...databaseCommands,
  ...peekCommands,
  ...onboardingCommands,
  ...templateCommands,
  ...commentCommands,
  ...pageHistoryCommands,
  ...inboxCommands,
  ...markdownImportCommands,
  ...pageVersionCommands,
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
  const propsSchemas = withPropertyConfigs(BLOCK_PROPS_SCHEMAS);
  startFileTools({
    store,
    dispatch,
    adapter,
    propsSchemas,
  });
  const { isFirstRun } = await startRepository({
    store,
    dispatch,
    adapter,
    propsSchemas,
    tabs: createTabCoordination(),
  });
  // Files people add to blocks are kept beside the workspace.
  installAssetSaver(startAssetStore({ adapter, dispatch }));
  // Versions of the pages being edited, for their history.
  startSnapshots({
    store,
    dispatch,
    storage: createIndexedDbSnapshots(),
    contentOf: pageContent,
  });
  return { isFirstRun };
}

// The one dispatcher, with every command, tidier and guard. A change a
// lock refuses says so, as Notion's locked pages do.
function createAppDispatch(store: AppStore): Dispatch {
  const dispatchCommand = createDispatcher({
    store,
    registry: createCommandRegistry(COMMANDS),
    tidiers: [...BLOCK_TIDIERS, ...DATABASE_TIDIERS, discussionTidier],
    guards: [lockGuard],
  });
  return (command) => {
    const result = dispatchCommand(command);
    if (!result.ok && result.error.kind === "locked") {
      announce(COPY.lock.refused);
    }
    return result;
  };
}

export async function startApp(container: HTMLElement): Promise<void> {
  const store = createAppStore(createInitialState());
  const dispatch = createAppDispatch(store);
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
  // The trash empties itself of pages kept there over 30 days.
  dispatch(emptyOldTrash.create({}));
  startReminderNotices(store);
  startRouter(store, dispatch);
  installOverlayDismiss(store, dispatch);
  installSelectionSync(store, dispatch);
  installScopedKeys(store, dispatch, SCOPED_KEYS);
  installTooltip();
  document.addEventListener("keydown", (event) => {
    const shortcut = matchShortcut(event);
    if (shortcut === undefined) return;
    event.preventDefault();
    if (shortcut.command !== undefined) dispatch(shortcut.command);
    else runShortcutAction(shortcut.action, store.getState(), dispatch);
  });
  store.subscribe(renderRoot);
  renderRoot();
}
