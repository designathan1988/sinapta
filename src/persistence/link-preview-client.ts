// Asks the server to read each web bookmark's page once, while signed in,
// and records what it found (ADR-0013); and the title of each web page a
// mention points to, which the mention then shows, as Notion's.
import {
  setLinkMentionTitle,
  setLinkPreview,
  type AppStore,
  type Dispatch,
} from "../state/index.ts";
import type { BlockId } from "../model/index.ts";
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

// The addresses of a block's web page mentions still showing their address.
function untitledLinks(text: unknown): string[] {
  if (!Array.isArray(text)) return [];
  return text.flatMap((span: unknown): string[] => {
    if (typeof span !== "object" || span === null) return [];
    const mention: unknown = Reflect.get(span, "mention");
    if (typeof mention !== "object" || mention === null) return [];
    const href: unknown = Reflect.get(mention, "href");
    const isLink = Reflect.get(mention, "kind") === "link";
    const isTitled = Reflect.get(mention, "isTitled") === true;
    return isLink && !isTitled && typeof href === "string" ? [href] : [];
  });
}

function titleLinks(
  state: ReturnType<AppStore["getState"]>,
  asked: Set<string>,
  answer: Answer,
): void {
  for (const block of Object.values(state.workspace.blocks)) {
    for (const href of untitledLinks(block.props.text)) {
      const key = `${block.id} mention ${href}`;
      if (asked.has(key)) continue;
      asked.add(key);
      answer(block.id, href);
    }
  }
}

type Answer = (blockId: BlockId, address: string) => void;

// The web bookmarks not read yet.
function previewBookmarks(
  state: ReturnType<AppStore["getState"]>,
  asked: Set<string>,
  answer: Answer,
): void {
  for (const block of Object.values(state.workspace.blocks)) {
    const { url } = block.props;
    if (block.type !== "bookmark" || typeof url !== "string" || url === "")
      continue;
    const key = `${block.id} ${url}`;
    if (block.props.preview !== undefined || asked.has(key)) continue;
    asked.add(key);
    answer(block.id, url);
  }
}

function answers(send: Fetch, dispatch: Dispatch) {
  const read = (address: string, use: (reply: unknown) => void) => {
    void ask(send, address).then(use, () => undefined);
  };
  const bookmark: Answer = (blockId, url) => {
    read(url, (reply) => {
      const preview = readLinkPreview(reply);
      if (preview === undefined) return;
      dispatch(setLinkPreview.create({ blockId, url, preview }));
    });
  };
  const mention: Answer = (blockId, href) => {
    read(href, (reply) => {
      const title = readLinkPreview(reply)?.title ?? "";
      if (title === "") return;
      dispatch(setLinkMentionTitle.create({ blockId, href, title }));
    });
  };
  return { bookmark, mention };
}

export function startLinkPreviews(options: {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly send?: Fetch;
}): void {
  const { store, dispatch } = options;
  const send = options.send ?? ((input, init) => fetch(input, init));
  const asked = new Set<string>();
  const answer = answers(send, dispatch);
  const look = (): void => {
    const state = store.getState();
    if (state.persistence.account.user === null) return;
    previewBookmarks(state, asked, answer.bookmark);
    titleLinks(state, asked, answer.mention);
  };
  store.subscribe(() => {
    queueMicrotask(look);
  });
  look();
}
