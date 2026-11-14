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
import { setDesktopNotices, toggleNotices } from "../inbox/index.ts";
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
    })}
    <h4 class="settings__subtitle">${TEXT.desktop}</h4>
    ${renderRow(TEXT.desktopName, desktopHint(), renderDesktop(state, dispatch))}`;
}

// The browser's word on notifications from this site.
function desktopHint(): string {
  if (typeof Notification === "undefined") return TEXT.desktopMissing;
  return Notification.permission === "denied"
    ? TEXT.desktopBlocked
    : TEXT.desktopHint;
}

// Turning them on asks the browser first, as Notion's desktop app asks
// the system.
function renderDesktop(state: AppState, dispatch: Dispatch): TemplateResult {
  const isOn = state.ui.desktopNotices;
  return html`<button
    type="button"
    class="settings__switch"
    role="switch"
    aria-checked=${String(isOn)}
    aria-label=${TEXT.desktopName}
    ?disabled=${typeof Notification === "undefined"}
    @click=${() => {
      if (isOn) {
        dispatch(setDesktopNotices.create({ isOn: false }));
        return;
      }
      void Notification.requestPermission().then((answer) => {
        dispatch(setDesktopNotices.create({ isOn: answer === "granted" }));
      });
    }}
  >
    ${renderSwitchMark(isOn)}
  </button>`;
}
