// "Add reaction", as Notion's: the emoji picker by the control that opened
// it. On selected text a reaction starts a discussion of its own; on a
// comment it is added to the comment.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { parseBlockId, type SkinTone } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setEmojiSkinTone,
  setOverlayValues,
  type AppState,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderEmojiPicker } from "../../ui/emoji/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { startDiscussion } from "./comment.commands.ts";
import { closeOnEscape } from "./comment-popovers.view.ts";
import { toggleReaction } from "./reaction.commands.ts";
import { selectPageOf } from "./comments.selectors.ts";
import { selectPageReactions } from "./page-reactions.view.ts";

export const REACTION_OVERLAY = "reaction-picker";

function valueId(overlay: OpenOverlay, name: string) {
  return parseBlockId(overlay.values?.[name]?.[0] ?? "");
}

// The text selected when the overlay opened, when there is some.
function selectedRange(overlay: OpenOverlay | null) {
  const start = overlay?.start;
  const end = overlay?.end;
  return start === undefined || end === undefined || start === end
    ? undefined
    : { start, end };
}

// A comment the overlay names in its values: the reaction goes to it.
function reactToComment(
  overlay: OpenOverlay,
  dispatch: Dispatch,
  emoji: string,
): boolean {
  const pageId = valueId(overlay, "page");
  const discussionId = valueId(overlay, "discussion");
  const commentId = parseBlockId(overlay.anchorId ?? "");
  if (pageId === undefined || discussionId === undefined) return false;
  if (commentId === undefined) return false;
  dispatch(toggleReaction.create({ pageId, discussionId, commentId, emoji }));
  return true;
}

// Else the selected text of the block the overlay is anchored to: the
// reaction starts a discussion there.
function reactToText(state: AppState, dispatch: Dispatch, emoji: string): void {
  const { overlay } = state.ui;
  const blockId = parseBlockId(overlay?.anchorId ?? "");
  const page = blockId === undefined ? undefined : selectPageOf(state, blockId);
  const range = selectedRange(overlay);
  if (page === undefined || blockId === undefined || range === undefined)
    return;
  dispatch(
    startDiscussion.create({
      pageId: page.id,
      blockId,
      range,
      text: "",
      reaction: emoji,
    }),
  );
}

// A page itself, as from a feed card: its reactions discussion, or a new
// one.
function reactToPage(state: AppState, dispatch: Dispatch, emoji: string): void {
  const pageId = parseBlockId(state.ui.overlay?.anchorId ?? "");
  if (pageId === undefined) return;
  const found = selectPageReactions(state, pageId);
  if (found === undefined) {
    dispatch(
      startDiscussion.create({
        pageId,
        blockId: null,
        text: "",
        reaction: emoji,
      }),
    );
    return;
  }
  const { discussion, comment } = found;
  if (comment.reactions?.includes(emoji) === true) return;
  dispatch(
    toggleReaction.create({
      pageId,
      discussionId: discussion.id,
      commentId: comment.id,
      emoji,
    }),
  );
}

function react(state: AppState, dispatch: Dispatch, emoji: string): void {
  const { overlay } = state.ui;
  if (overlay === null || reactToComment(overlay, dispatch, emoji)) return;
  if (overlay.values?.target?.[0] === "page") {
    reactToPage(state, dispatch, emoji);
    return;
  }
  reactToText(state, dispatch, emoji);
}

const TONES = "tones";

// The skin tone, kept for the owner, and the hand's six tones while open.
function reactionParts(state: AppState, dispatch: Dispatch) {
  const isChoosingTone = state.ui.overlay?.values?.[TONES] !== undefined;
  const closeTones = setOverlayValues.create({ name: TONES, values: null });
  return {
    tone: state.workspace.settings.emojiSkinTone ?? "default",
    isChoosingTone,
    onToggleTones: () =>
      dispatch(
        isChoosingTone
          ? closeTones
          : setOverlayValues.create({ name: TONES, values: ["open"] }),
      ),
    onTone: (tone: SkinTone) => {
      dispatch(setEmojiSkinTone.create({ tone }));
      dispatch(closeTones);
    },
  };
}

export function renderReactionPicker(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  if (overlay?.kind !== REACTION_OVERLAY) return nothing;
  return html`<div
    class="comments__reaction-picker"
    popover="manual"
    data-overlay
    aria-label=${COPY.comments.addReaction}
    ${ref(showPopoverWhenConnected)}
    @keydown=${closeOnEscape(dispatch)}
  >
    ${renderEmojiPicker({
      query: overlay.query ?? "",
      onQuery: (query) =>
        dispatch(openOverlay.create({ overlay: { ...overlay, query } })),
      onChoose: (emoji) => {
        react(state, dispatch, emoji);
        dispatch(closeOverlay.create({}));
      },
      reaction: reactionParts(state, dispatch),
    })}
  </div>`;
}
