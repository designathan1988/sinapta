// What runs beside the app once it has started, each a subscription of its
// own (ADR-0013): the AI's answers, web bookmarks' previews, desktop
// notifications, meeting notes heard and summed up.
import {
  browserNotifier,
  startDesktopNotices,
} from "../features/inbox/index.ts";
import {
  browserListener,
  startTranscriber,
} from "../features/meeting-notes/index.ts";
import {
  startAi,
  startLinkPreviews,
  startMeetingSummaries,
} from "../persistence/index.ts";
import type { AppStore, Dispatch } from "../state/index.ts";

export function startServices(store: AppStore, dispatch: Dispatch): void {
  startAi({ store, dispatch });
  startLinkPreviews({ store, dispatch });
  startDesktopNotices(store, browserNotifier());
  startMeetingSummaries({ store, dispatch });
  startTranscriber(store, dispatch, browserListener());
}
