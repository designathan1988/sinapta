// Asks the server to read each web bookmark's page once, while signed in,
// and records what it found (ADR-0013).
import {
  setLinkPreview,
  type AppStore,
  type Dispatch,
} from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import { parseReply } from "./account.schema.ts";
import { readLinkPreview } from "./link-preview.schema.ts";

async function ask(send: Fetch, url: string): Promise<unknown> {
  const response = await send("/api/link-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ url }),
  });
  if (!response.ok) return undefined;
  return parseReply(await response.text());
}

export function startLinkPreviews(options: {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly send?: Fetch;
}): void {
  const {
    store,
    dispatch,
    send = (input, init) => fetch(input, init),
  } = options;
  const asked = new Set<string>();
  const look = (): void => {
    const state = store.getState();
    if (state.persistence.account.user === null) return;
    for (const block of Object.values(state.workspace.blocks)) {
      const { url } = block.props;
      if (block.type !== "bookmark" || typeof url !== "string" || url === "")
        continue;
      const key = `${block.id} ${url}`;
      if (block.props.preview !== undefined || asked.has(key)) continue;
      asked.add(key);
      void ask(send, url).then(
        (reply) => {
          const preview = readLinkPreview(reply);
          if (preview !== undefined) {
            dispatch(
              setLinkPreview.create({ blockId: block.id, url, preview }),
            );
          }
        },
        () => undefined,
      );
    }
  };
  store.subscribe(() => {
    queueMicrotask(look);
  });
  look();
}
