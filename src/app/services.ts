// What runs beside the app once it has started, each a subscription of its
// own (ADR-0013): the AI's answers, web bookmarks' previews, desktop
// notifications, meeting notes heard and summed up.
import {
  browserNotifier,
  startDesktopNotices,
} from "../features/inbox/index.ts";
import {
  browserListener,
  recorderListener,
  startTranscriber,
  type Listener,
} from "../features/meeting-notes/index.ts";
import {
  startAi,
  startLinkPreviews,
  serverTranscriber,
  startMeetingSummaries,
} from "../persistence/index.ts";
import type { AppStore, Dispatch } from "../state/index.ts";

// Signed in to a server, the meeting is heard by the server's speech
// model; otherwise by the browser's own speech recognition, if it has one.
function meetingListener(store: AppStore): Listener | undefined {
  const server = recorderListener(serverTranscriber(store));
  const browser = browserListener();
  if (server === undefined) return browser;
  return {
    start: (onText, onEnd) => {
      const { workspaceId } = store.getState().persistence.sync;
      const listener = workspaceId === null ? (browser ?? server) : server;
      return listener.start(onText, onEnd);
    },
  };
}

export function startServices(store: AppStore, dispatch: Dispatch): void {
  startAi({ store, dispatch });
  startLinkPreviews({ store, dispatch });
  startDesktopNotices(store, browserNotifier());
  startMeetingSummaries({ store, dispatch });
  startTranscriber(store, dispatch, meetingListener(store));
}
