// The composition root: creates the one store, registers every command and
// owns the single root render.
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
  pageTemplateCommands,
  pageVerifyCommands,
  pageStyleCommands,
  pageDuplicateCommands,
  pageMoveCommands,
  pageTrashCommands,
} from "../blocks/page/index.ts";
import {
  DATABASE_TIDIERS,
  databaseCommands,
  installAutomations,
  withPropertyConfigs,
} from "../features/database/index.ts";
import { editorCommands } from "../features/editor/index.ts";
import { SCOPED_KEYS } from "./scoped-keys.ts";
import { openBillingOnReturn } from "./billing-return.ts";
import { aiFeatureCommands } from "../features/ai/index.ts";
import { peekCommands } from "../features/row-peek/index.ts";
import { templateCommands } from "../features/templates/index.ts";
import { inboxCommands } from "../features/inbox/index.ts";
import { startServices } from "./services.ts";
import { markdownImportCommands } from "../features/markdown-import/index.ts";
import { searchFilterCommands } from "../features/command-palette/index.ts";
import { startReminderNotices } from "./reminder-notices.ts";
import { startTemplateRepeats } from "./template-repeats.ts";
import {
  pageContent,
  pageHistoryCommands,
} from "../features/page-history/index.ts";
import {
  commentCommands,
  reactionCommands,
  suggestionCommands,
  discussionTidier,
  valueDiscussionTidier,
} from "../features/comments/index.ts";
import {
  onboardingCommands,
  seedGettingStarted,
} from "../features/onboarding/index.ts";
import {
  createAppStore,
  type AppStore,
  type Dispatch,
  accountCommands,
  aiCommands,
  linkPreviewCommands,
  meetingCommands,
  syncCommands,
  createCommandRegistry,
  createDispatcher,
  createInitialState,
  assetCommands,
  persistenceCommands,
  settingsCommands,
  pageVersionCommands,
  uiCommands,
  workspaceCommands,
} from "../state/index.ts";
import {
  createIndexedDbAdapter,
  createTabCoordination,
  startAccount,
  createOutbox,
  createSyncLink,
  type SyncLink,
  startAssetStore,
  startFileTools,
  startPageRecords,
  startRepository,
  type RepositoryStart,
} from "../persistence/index.ts";
import { installAssetSaver } from "../ui/asset/index.ts";
import { installSelectionSync } from "../ui/caret/index.ts";
import { announce } from "../ui/announcer/index.ts";
import { COPY } from "../ui/copy.ts";
import {
  closeOverlayOnEscape,
  installOverlayDismiss,
} from "../ui/overlay/index.ts";
import { installScopedKeys, matchShortcut } from "../ui/shortcuts/index.ts";
import { installTooltip } from "../ui/tooltip/index.ts";
import { loadEmoji } from "../ui/emoji/index.ts";
import { startRouter } from "./router.ts";
import { watchViewport } from "./viewport.ts";
import { startOffline } from "./offline.ts";
import { runShortcutAction } from "./shortcut-actions.ts";
import { rootRenderer } from "./root-render.ts";

const COMMANDS = [
  ...uiCommands,
  ...accountCommands,
  ...syncCommands,
  ...aiCommands,
  ...linkPreviewCommands,
  ...meetingCommands,
  ...aiFeatureCommands,
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
  ...pageTemplateCommands,
  ...pageVerifyCommands,
  ...BLOCK_COMMANDS,
  ...editorCommands,
  ...databaseCommands,
  ...peekCommands,
  ...onboardingCommands,
  ...templateCommands,
  ...commentCommands,
  ...reactionCommands,
  ...suggestionCommands,
  ...pageHistoryCommands,
  ...inboxCommands,
  ...markdownImportCommands,
  ...pageVersionCommands,
  ...searchFilterCommands,
];

// Loads the stored workspace, then keeps saving it, and keeps the files
// people add beside it.
async function startPersistence(
  store: AppStore,
  dispatch: Dispatch,
  sync: SyncLink,
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
  installAssetSaver(startAssetStore({ adapter, dispatch, store }));
  // Versions of the pages being edited, for their history, and each
  // opening of a page, for its analytics (persistence/page-records.ts).
  startPageRecords({ store, dispatch, contentOf: pageContent });
  // The workspace on the server, once someone signs in (ADR-0013).
  sync.start({ store, dispatch, propsSchemas, outbox: createOutbox(adapter) });
  startServices(store, dispatch);
  // Database automations run right after the change that sets them off.
  installAutomations(store, dispatch);
  openBillingOnReturn(store, dispatch);
  return { isFirstRun };
}

// The one dispatcher, with every command, tidier and guard. A change a
// lock refuses says so, as Notion's locked pages do.
export function createAppDispatch(store: AppStore, sync: SyncLink): Dispatch {
  const dispatchCommand = createDispatcher({
    store,
    registry: createCommandRegistry(COMMANDS),
    tidiers: [
      ...BLOCK_TIDIERS,
      ...DATABASE_TIDIERS,
      discussionTidier,
      valueDiscussionTidier,
    ],
    guards: [lockGuard],
    onTransaction: sync.onTransaction,
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
  const sync = createSyncLink();
  const dispatch = createAppDispatch(store, sync);
  const renderRoot = rootRenderer(store, dispatch, container);
  // Nothing is rendered until stored data is in the store, so the first
  // paint already has the saved theme and layout.
  const { isFirstRun } = await startPersistence(store, dispatch, sync);
  // A first visit opens a short tour; it is saved like any other change.
  // It comes first, so a workspace the server holds always replaces it.
  if (isFirstRun) dispatch(seedGettingStarted.create({}));
  // Who is signed in to the server, before the first paint (ADR-0013).
  await startAccount({ store, dispatch });
  // The trash empties itself of pages kept there over 30 days.
  dispatch(emptyOldTrash.create({}));
  startReminderNotices(store);
  startTemplateRepeats(store, dispatch);
  startRouter(store, dispatch);
  watchViewport(dispatch);
  startOffline({ store, dispatch });
  installOverlayDismiss(store, dispatch);
  installSelectionSync(store, dispatch);
  installScopedKeys(store, dispatch, SCOPED_KEYS);
  installTooltip();
  document.addEventListener("keydown", (event) => {
    if (closeOverlayOnEscape(event, store, dispatch)) return;
    const shortcut = matchShortcut(event);
    if (shortcut === undefined) return;
    event.preventDefault();
    if (shortcut.command !== undefined) dispatch(shortcut.command);
    else runShortcutAction(shortcut.action, store.getState(), dispatch);
  });
  store.subscribe(renderRoot);
  renderRoot();
  // The emoji list loads after the first paint, then shows where asked.
  void loadEmoji().then(renderRoot);
}
