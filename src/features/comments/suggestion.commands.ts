// Suggested edits, as Notion's Suggesting: while a page suggests, text
// typed in it is kept as a suggested insertion and text deleted as a
// suggested deletion, each held by a discussion ("Add: …", "Delete: …");
// typing on, or deleting on, extends the same one. Accept keeps the edit,
// Reject undoes it; either way its discussion goes.
import { isTextBlock } from "../../blocks/index.ts";
import type { Discussion, PageBlock } from "../../blocks/page/index.ts";
import {
  acceptSuggestion,
  rejectSuggestion,
  suggestDelete,
  suggestInsert,
  suggestedText,
  type BlockId,
  type Operation,
  type RichText,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type UiState,
} from "../../state/index.ts";
import { discussionsUpdate } from "./comment.commands.ts";
import { selectPageOf } from "./comments.selectors.ts";

export interface SuggestedEdit {
  readonly blockId: BlockId;
  readonly start: number;
  readonly end: number;
  readonly text: string;
  // The id a new discussion takes.
  readonly newId: BlockId;
  readonly now: string;
}

// The suggestion discussion of the span next to an offset, to extend.
function nextTo(
  rich: RichText,
  offset: number,
  kind: "insert" | "delete",
): BlockId | undefined {
  let position = 0;
  for (const span of rich) {
    const end = position + span.text.length;
    const touches = kind === "insert" ? end === offset : position === offset;
    if (touches && span.suggestion === kind) return span.comments?.at(-1);
    position = end;
  }
  return undefined;
}

function textOf(state: AppState, blockId: BlockId): RichText | undefined {
  const block = state.workspace.blocks[blockId];
  return isTextBlock(block) ? block.props.text : undefined;
}

function blockUpdate(
  state: AppState,
  blockId: BlockId,
  update: { readonly text: RichText; readonly now: string },
): Operation[] {
  const block = state.workspace.blocks[blockId];
  if (block === undefined) return [];
  const props = { ...block.props, text: update.text };
  const patch = { props, updatedAt: update.now };
  return [{ type: "record.update", kind: "block", id: blockId, patch }];
}

// The page's discussions with this one added, or brought up to date: its
// quote is the text it suggests now.
function withDiscussion(
  page: PageBlock,
  discussion: Discussion,
  text: RichText,
): Discussion[] {
  const all = page.props.discussions ?? [];
  const quote = suggestedText(text, discussion.id);
  const current = all.find((each) => each.id === discussion.id) ?? discussion;
  const updated = { ...current, quote };
  return all.some((each) => each.id === discussion.id)
    ? all.map((each) => (each.id === discussion.id ? updated : each))
    : [...all, updated];
}

// The text with the edit kept as a suggestion, and where the caret goes:
// before deleted text, after inserted text.
function editedText(rich: RichText, edit: SuggestedEdit, id: BlockId) {
  const struck =
    edit.start === edit.end
      ? rich
      : suggestDelete(rich, { start: edit.start, end: edit.end }, id);
  if (edit.text === "") return { text: struck, caret: edit.start };
  const at = edit.end - (textLength(rich) - textLength(struck));
  const text = suggestInsert(struck, at, { text: edit.text, discussionId: id });
  return { text, caret: at + edit.text.normalize("NFC").length };
}

// What a replace does while the block's page suggests.
export function suggestReplace(
  state: AppState,
  edit: SuggestedEdit,
): { operations: Operation[]; ui: UiState } | undefined {
  const rich = textOf(state, edit.blockId);
  const page = selectPageOf(state, edit.blockId);
  if (rich === undefined || page === undefined) return undefined;
  if (page.id !== state.ui.suggestingPageId) return undefined;
  const isDelete = edit.text === "";
  const kind = isDelete ? "delete" : "insert";
  const id = nextTo(rich, isDelete ? edit.end : edit.start, kind) ?? edit.newId;
  const { text, caret } = editedText(rich, edit, id);
  const discussion: Discussion = {
    id,
    blockId: edit.blockId,
    isResolved: false,
    comments: [],
    suggestion: kind,
  };
  return {
    operations: [
      ...blockUpdate(state, edit.blockId, { text, now: edit.now }),
      discussionsUpdate(
        page,
        standing(withDiscussion(page, discussion, text), text),
      ),
    ],
    ui: {
      ...state.ui,
      selection: {
        blockId: edit.blockId,
        anchorOffset: caret,
        focusOffset: caret,
      },
    },
  };
}

// The discussions left once the block's text no longer holds a
// suggestion of theirs, as when a suggested insertion is deleted.
function standing(discussions: Discussion[], text: RichText): Discussion[] {
  return discussions.filter(
    (each) =>
      each.suggestion === undefined ||
      text.some((span) => span.comments?.includes(each.id) === true),
  );
}

function textLength(rich: RichText): number {
  return rich.reduce((sum, span) => sum + span.text.length, 0);
}

interface Settling {
  readonly pageId: BlockId;
  readonly discussionId: BlockId;
}

function settle(
  state: AppState,
  command: Settling & { readonly meta: { readonly now: string } },
  apply: (rich: RichText, id: BlockId) => RichText,
) {
  const owner = selectPageOf(state, command.pageId);
  const discussion = owner?.props.discussions?.find(
    (each) => each.id === command.discussionId,
  );
  if (owner === undefined || discussion?.blockId == null) return {};
  const rich = textOf(state, discussion.blockId);
  if (rich === undefined) return {};
  const text = apply(rich, discussion.id);
  const rest = (owner.props.discussions ?? []).filter(
    (each) => each.id !== discussion.id,
  );
  return {
    operations: [
      ...blockUpdate(state, discussion.blockId, {
        text,
        now: command.meta.now,
      }),
      discussionsUpdate(owner, rest),
    ],
  };
}

export const acceptSuggestionCommand = defineCommand<Settling>({
  type: "suggestion.accept",
  handle: (state, command) => settle(state, command, acceptSuggestion),
});

export const rejectSuggestionCommand = defineCommand<Settling>({
  type: "suggestion.reject",
  handle: (state, command) => settle(state, command, rejectSuggestion),
});

// Turns Suggesting on for a page, or off.
export const setSuggesting = defineCommand<{ pageId: BlockId | null }>({
  type: "ui.setSuggesting",
  handle(state, command) {
    const { suggestingPageId: _old, ...ui } = state.ui;
    return {
      ui:
        command.pageId === null
          ? ui
          : { ...ui, suggestingPageId: command.pageId },
    };
  },
});

export const suggestionCommands = [
  acceptSuggestionCommand,
  rejectSuggestionCommand,
  setSuggesting,
];
