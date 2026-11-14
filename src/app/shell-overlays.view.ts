// The view of each overlay kind. At most one overlay is open at a time.
import { renderSharePanel, SHARE_OVERLAY } from "../features/share/index.ts";
import {
  renderTeamspaceCreate,
  TEAMSPACE_CREATE_OVERLAY,
} from "../features/teamspaces/index.ts";
import {
  AI_CHAT_OVERLAY,
  AI_PROMPT_OVERLAY,
  renderAiChat,
  renderAiPrompt,
} from "../features/ai/index.ts";
import { type nothing, type TemplateResult } from "lit-html";
import {
  PALETTE_OVERLAY,
  renderCommandPalette,
} from "../features/command-palette/index.ts";
import { renderEditorOverlay } from "../features/editor/index.ts";
import {
  EMOJI_MENU_OVERLAY,
  renderEmojiMenu,
} from "../features/emoji-menu/index.ts";
import {
  renderTonePicker,
  TONE_OVERLAY,
} from "../features/format-toolbar/index.ts";
import {
  MENTION_MENU_OVERLAY,
  PAGE_LINK_MENU_OVERLAY,
  renderMentionMenu,
} from "../features/mention-menu/index.ts";
import { MOVE_TO_OVERLAY, renderMoveTo } from "../features/move-to/index.ts";
import {
  PAGE_RENAME_OVERLAY,
  renderPageRename,
} from "../features/page-menu/index.ts";
import {
  PAGE_MENU_OVERLAY,
  renderPageMenu,
} from "../features/page-menu/index.ts";
import {
  renderSettings,
  SETTINGS_OVERLAY,
} from "../features/settings/index.ts";
import { renderShortcutHelp } from "../features/shortcut-help/index.ts";
import {
  renderSlashMenu,
  SLASH_MENU_OVERLAY,
} from "../features/slash-menu/index.ts";
import { renderTrash, TRASH_OVERLAY } from "../features/trash/index.ts";
import { renderPageHistory } from "../features/page-history/index.ts";
import { INBOX_OVERLAY, renderInbox } from "../features/inbox/index.ts";
import {
  COMMENT_COMPOSER_OVERLAY,
  DISCUSSIONS_OVERLAY,
  renderComposerPopover,
  renderDiscussionsPopover,
  RESOLVED_COMMENTS_OVERLAY,
  renderResolvedComments,
  REACTION_OVERLAY,
  renderReactionPicker,
} from "../features/comments/index.ts";
import {
  renderTemplateGallery,
  TEMPLATE_GALLERY_OVERLAY,
} from "../features/templates/index.ts";
import {
  renderSidebarMenu,
  SIDEBAR_APPS_OVERLAY,
  SIDEBAR_VIEW_OVERLAY,
  renderSidebarViewMenu,
  SIDEBAR_WORKSPACE_OVERLAY,
} from "../features/sidebar/index.ts";
import {
  PAGE_HISTORY_OVERLAY,
  type AppState,
  type Dispatch,
} from "../state/index.ts";
import { SHORTCUT_HELP_OVERLAY_KIND } from "../ui/shortcuts/index.ts";

type OverlayView = (
  state: AppState,
  dispatch: Dispatch,
) => TemplateResult | typeof nothing;

// The view of each overlay kind; the editor shows the rest.
const OVERLAYS: Readonly<Record<string, OverlayView>> = {
  [AI_PROMPT_OVERLAY]: renderAiPrompt,
  [AI_CHAT_OVERLAY]: renderAiChat,
  [SHARE_OVERLAY]: renderSharePanel,
  [TEAMSPACE_CREATE_OVERLAY]: renderTeamspaceCreate,
  [SETTINGS_OVERLAY]: renderSettings,
  [TRASH_OVERLAY]: renderTrash,
  [PAGE_HISTORY_OVERLAY]: renderPageHistory,
  [INBOX_OVERLAY]: renderInbox,
  [COMMENT_COMPOSER_OVERLAY]: renderComposerPopover,
  [REACTION_OVERLAY]: renderReactionPicker,
  [DISCUSSIONS_OVERLAY]: renderDiscussionsPopover,
  [RESOLVED_COMMENTS_OVERLAY]: renderResolvedComments,
  [TEMPLATE_GALLERY_OVERLAY]: renderTemplateGallery,
  [PALETTE_OVERLAY]: renderCommandPalette,
  [MOVE_TO_OVERLAY]: renderMoveTo,
  [PAGE_RENAME_OVERLAY]: renderPageRename,
  [SLASH_MENU_OVERLAY]: renderSlashMenu,
  [MENTION_MENU_OVERLAY]: renderMentionMenu,
  [PAGE_LINK_MENU_OVERLAY]: renderMentionMenu,
  [EMOJI_MENU_OVERLAY]: renderEmojiMenu,
  [PAGE_MENU_OVERLAY]: renderPageMenu,
  [TONE_OVERLAY]: renderTonePicker,
  [SIDEBAR_WORKSPACE_OVERLAY]: renderSidebarMenu,
  [SIDEBAR_APPS_OVERLAY]: renderSidebarMenu,
  [SIDEBAR_VIEW_OVERLAY]: renderSidebarViewMenu,
  [SHORTCUT_HELP_OVERLAY_KIND]: (_state, dispatch) =>
    renderShortcutHelp(dispatch),
};

// At most one overlay is open at a time.
export function renderOverlay(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const view = OVERLAYS[state.ui.overlay?.kind ?? ""] ?? renderEditorOverlay;
  return view(state, dispatch);
}
