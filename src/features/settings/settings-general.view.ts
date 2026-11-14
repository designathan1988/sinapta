// Settings › General after the name, as Notion's: the workspace's icon,
// picked from the emoji picker, then the danger zone: "Delete entire
// workspace" for its owner, asked again with the name typed, or "Leave
// workspace" for a member.
import "./settings-general.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  openOverlay,
  requestSync,
  type AppState,
  type Dispatch,
  type SyncRequest,
  type WorkspaceSummary,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderEmojiPicker } from "../../ui/emoji/index.ts";
import { renderRow } from "./settings-row.view.ts";

const TEXT = COPY.settings;
const PICKING = "workspace-icon";
const CONFIRMING = "workspace-danger";

const ask = (dispatch: Dispatch, request: SyncRequest) =>
  dispatch(requestSync.create({ request }));

// Turns one of the panel's own switches on or off, keeping the others.
function toggle(state: AppState, dispatch: Dispatch, flag: string): void {
  const { overlay } = state.ui;
  if (overlay === null) return;
  const flags = overlay.flags ?? [];
  const next = flags.includes(flag)
    ? flags.filter((each) => each !== flag)
    : [...flags, flag];
  dispatch(openOverlay.create({ overlay: { ...overlay, flags: next } }));
}

function isOn(state: AppState, flag: string): boolean {
  return state.ui.overlay?.flags?.includes(flag) === true;
}

function renderIconRow(
  state: AppState,
  dispatch: Dispatch,
  open: WorkspaceSummary,
): TemplateResult {
  const letter = open.name.trim().charAt(0).toUpperCase();
  const choose = (icon: string | null): void => {
    ask(dispatch, { kind: "workspace-icon", icon });
    toggle(state, dispatch, PICKING);
  };
  const button = html`<button
    type="button"
    class="settings__icon"
    aria-label=${TEXT.workspaceIconLabel}
    aria-expanded=${String(isOn(state, PICKING))}
    @click=${() => {
      toggle(state, dispatch, PICKING);
    }}
  >
    ${open.icon ?? letter}
  </button>`;
  return html`${renderRow(TEXT.workspaceIcon, TEXT.workspaceIconHint, button)}
  ${
    isOn(state, PICKING)
      ? html`<div class="settings__picker">
          ${renderEmojiPicker({
            query: "",
            onQuery: () => undefined,
            onChoose: choose,
            ...(open.icon !== null && {
              onRemove: () => {
                choose(null);
              },
            }),
          })}
        </div>`
      : nothing
  }`;
}

function escapePattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The owner types the workspace's name before it goes, as Notion asks.
function renderDeleteForm(dispatch: Dispatch, name: string): TemplateResult {
  return html`<form
    class="settings__confirm"
    @submit=${(event: SubmitEvent) => {
      event.preventDefault();
      ask(dispatch, { kind: "delete-workspace", name });
    }}
  >
    <input
      class="settings__field"
      required
      pattern=${escapePattern(name)}
      aria-label=${TEXT.deleteConfirm(name)}
      placeholder=${TEXT.deleteConfirm(name)}
    />
    <button type="submit" class="button" data-variant="danger">
      ${TEXT.deletePermanently}
    </button>
  </form>`;
}

export function renderDangerZone(
  state: AppState,
  dispatch: Dispatch,
  open: WorkspaceSummary,
): TemplateResult {
  const isOwner = open.role === "owner";
  const label = isOwner ? TEXT.deleteWorkspace : TEXT.leaveWorkspace;
  const hint = isOwner ? TEXT.deleteWorkspaceHint : TEXT.leaveWorkspaceHint;
  const isAsking = isOn(state, CONFIRMING);
  const start = html`<button
    type="button"
    class="button"
    data-variant="danger"
    @click=${() => {
      if (isOwner) toggle(state, dispatch, CONFIRMING);
      else ask(dispatch, { kind: "leave-workspace" });
    }}
  >
    ${isAsking ? TEXT.cancel : label}
  </button>`;
  return html`${renderIconRow(state, dispatch, open)}
    <h4 class="settings__subtitle">${TEXT.dangerZone}</h4>
    ${renderRow(label, hint, start)}
    ${isAsking && isOwner ? renderDeleteForm(dispatch, open.name) : nothing}`;
}
