// Asks the server's AI for a meeting's summary and action items once its
// recording stops (ADR-0013), and keeps them on the block.
import {
  setMeetingSummary,
  type AppStore,
  type Dispatch,
} from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import { parseReply, readAiReply } from "./account.schema.ts";

async function ask(send: Fetch, action: string, text: string) {
  const response = await send("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action, text }),
  });
  return readAiReply(parseReply(await response.text())) ?? "";
}

export function startMeetingSummaries(options: {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly send?: Fetch;
}): void {
  const { store, dispatch } = options;
  const send = options.send ?? ((input, init) => fetch(input, init));
  const asked = new Set<string>();
  const look = (): void => {
    for (const block of Object.values(store.getState().workspace.blocks)) {
      const { status, transcript } = block.props;
      if (block.type !== "meeting-notes" || status !== "summarizing") continue;
      if (typeof transcript !== "string" || asked.has(block.id)) continue;
      asked.add(block.id);
      void Promise.all([
        ask(send, "summarize", transcript),
        ask(send, "action-items", transcript),
      ]).then(
        ([summary, actionItems]) => {
          asked.delete(block.id);
          dispatch(
            setMeetingSummary.create({
              blockId: block.id,
              summary,
              actionItems,
            }),
          );
        },
        () => asked.delete(block.id),
      );
    }
  };
  store.subscribe(() => {
    queueMicrotask(look);
  });
  look();
}

// Sends a piece of the meeting's audio to the open workspace's speech
// model and gives back its words; nothing while no workspace is open.
export function serverTranscriber(
  store: AppStore,
  send: Fetch = (input, init) => fetch(input, init),
): (audio: string) => Promise<string> {
  return async (audio) => {
    const { workspaceId } = store.getState().persistence.sync;
    if (workspaceId === null) return "";
    const response = await send(`/api/workspaces/${workspaceId}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ audio }),
    });
    if (!response.ok) return "";
    return readAiReply(parseReply(await response.text())) ?? "";
  };
}
