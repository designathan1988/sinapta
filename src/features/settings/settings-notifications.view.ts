// Settings › Notifications, as Notion's (n91-notifications): which
// notices this person's inbox shows, each kind with its switch. Pagecraft
// sends no email and joins no chat service, so it has those rows alone.
import { html, type TemplateResult } from "lit-html";
import {
  NOTICE_KINDS,
  type AppState,
  type Dispatch,
  type NoticeKind,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSwitchMark } from "../../ui/switch/index.ts";
import { toggleNotices } from "../inbox/index.ts";
import { renderRow } from "./settings-row.view.ts";

const TEXT = COPY.settings;

function renderSwitch(
  kind: NoticeKind,
  isOn: boolean,
  dispatch: Dispatch,
): TemplateResult {
  return html`<button
    type="button"
    class="settings__switch"
    role="switch"
    aria-checked=${String(isOn)}
    aria-label=${TEXT.notices[kind][0]}
    @click=${() => dispatch(toggleNotices.create({ kind }))}
  >
    ${renderSwitchMark(isOn)}
  </button>`;
}

export function renderNotifications(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const muted = new Set(state.ui.mutedNotices);
  return html`<p class="settings__hint">${TEXT.notificationsLead}</p>
    <h4 class="settings__subtitle">${TEXT.inApp}</h4>
    ${NOTICE_KINDS.map((kind) => {
      const [name, hint] = TEXT.notices[kind];
      return renderRow(
        name,
        hint,
        renderSwitch(kind, !muted.has(kind), dispatch),
      );
    })}`;
}
