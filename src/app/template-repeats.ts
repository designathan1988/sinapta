// Repeating templates while the app is open: at the start and every
// minute after, each template whose day has come adds its row to its
// database, out of the way, and moves on to its next day.
import {
  addRow,
  advanceRepeat,
  selectDueRepeats,
} from "../features/database/index.ts";
import type { AppState, AppStore, Dispatch } from "../state/index.ts";

const CHECK_EVERY_MS = 60_000;

export function runTemplateRepeats(
  state: AppState,
  now: { readonly today: string; readonly time?: string },
  dispatch: Dispatch,
): void {
  const { today } = now;
  for (const due of selectDueRepeats(state, today, now.time)) {
    if (due.template !== undefined) {
      const { databaseId, template } = due;
      dispatch(addRow.create({ databaseId, template, staysPut: true }));
    }
    dispatch(advanceRepeat.create({ templateId: due.templateId, today }));
  }
}

export function startTemplateRepeats(
  store: AppStore,
  dispatch: Dispatch,
): void {
  const check = (): void => {
    // Today and the time in the reader's own time zone.
    const date = new Date();
    const today = date.toLocaleDateString("en-CA");
    const time = date.toTimeString().slice(0, 5);
    runTemplateRepeats(store.getState(), { today, time }, dispatch);
  };
  check();
  setInterval(check, CHECK_EVERY_MS);
}
