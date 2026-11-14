// The "Paste as" menu Notion opens under a pasted web address: Mention,
// URL (the link as pasted), Create bookmark and Embed.
import { nothing, type TemplateResult } from "lit-html";
import { parseBlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuEntry } from "../../ui/menu/index.ts";
import { pasteAs, type PasteAsKind } from "./editor-paste-as.commands.ts";
import type { Typed } from "./editor-place.ts";

export const PASTE_AS_OVERLAY = "paste-as";

const TEXT = COPY.pasteAs;

// Opened once a lone web address is pasted as a link at these offsets.
export function openPasteAs(
  typed: Typed & { href: string },
  dispatch: Dispatch,
): void {
  const overlay = {
    kind: PASTE_AS_OVERLAY,
    anchorId: typed.blockId,
    start: typed.start,
    end: typed.end,
    values: { href: [typed.href] },
  };
  dispatch(openOverlay.create({ overlay }));
}

function entries(
  typed: Typed & { href: string },
  dispatch: Dispatch,
): MenuEntry[] {
  const choose = (kind: PasteAsKind) => (): void => {
    dispatch(pasteAs(typed, kind));
  };
  const close = (): void => {
    dispatch(closeOverlay.create({}));
  };
  return [
    { kind: "section", label: TEXT.title },
    { label: TEXT.mention, onSelect: choose("mention") },
    { label: TEXT.url, onSelect: close },
    { label: TEXT.bookmark, onSelect: choose("bookmark") },
    { label: TEXT.embed, onSelect: choose("embed") },
  ];
}

export function renderPasteAs(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  if (overlay?.kind !== PASTE_AS_OVERLAY) return nothing;
  const blockId = parseBlockId(overlay.anchorId ?? "");
  const href = overlay.values?.href?.[0];
  const { start, end } = overlay;
  if (blockId === undefined || href === undefined) return nothing;
  if (start === undefined || end === undefined) return nothing;
  return renderMenu({
    label: TEXT.title,
    items: entries({ blockId, start, end, href }, dispatch),
    onClose: () => dispatch(closeOverlay.create({})),
    isNarrow: true,
  });
}
