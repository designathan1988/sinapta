// Runs a database's automations right after the change that sets them
// off, each as a step of its own, as Notion's: only for a change made
// here (not one from the server or an undo), only on a plan that runs
// automations, and never for a change an automation made.
import {
  requestSync,
  selectPlanLimits,
  type AppState,
  type AppStore,
  type Dispatch,
} from "../../state/index.ts";
import {
  selectAutomationRuns,
  selectSlackText,
  selectWebhook,
  type AutomationRun,
} from "./automation-runs.selectors.ts";
import { runAutomation } from "./automation.commands.ts";

// A change made here, recorded for undo: one more step, or the last one
// grown by typing on.
function isLocalChange(before: AppState, after: AppState): boolean {
  if (before.workspace === after.workspace) return false;
  const { undo } = after.history;
  const { undo: earlier } = before.history;
  if (undo.length < earlier.length) return false;
  return undo.at(-1) !== earlier.at(-1);
}

// Send webhook and Send Slack notification go through the open
// workspace's server; the browser's
// own workspace has none to send it.
function sendWebhook(
  state: AppState,
  run: AutomationRun,
  dispatch: Dispatch,
): void {
  if (state.persistence.sync.workspaceId === null) return;
  const webhook = selectWebhook(state, run);
  if (webhook !== undefined)
    dispatch(
      requestSync.create({
        request: { kind: "automation-webhook", ...webhook },
      }),
    );
  const text = selectSlackText(state, run);
  if (text !== undefined)
    dispatch(
      requestSync.create({ request: { kind: "automation-slack", text } }),
    );
}

export function installAutomations(store: AppStore, dispatch: Dispatch): void {
  let before = store.getState();
  let isRunning = false;
  store.subscribe(() => {
    const after = store.getState();
    const prior = before;
    before = after;
    if (isRunning || !isLocalChange(prior, after)) return;
    if (selectPlanLimits(after)?.automations === false) return;
    const runs = selectAutomationRuns(prior, after);
    if (runs.length === 0) return;
    // Subscribers never dispatch while notified: the runs wait a turn.
    queueMicrotask(() => {
      isRunning = true;
      try {
        for (const run of runs) {
          dispatch(runAutomation.create(run));
          sendWebhook(store.getState(), run, dispatch);
        }
      } finally {
        isRunning = false;
      }
    });
  });
}
