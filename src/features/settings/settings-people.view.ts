// Settings › My account, General and People, as Notion's (ADR-0013): the
// account's name, the workspace's name, then its members and invitations
// with a field to invite by email.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  requestAccount,
  requestSync,
  type AppState,
  type Dispatch,
  type SyncRequest,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDangerZone } from "./settings-general.view.ts";
import { renderRow } from "./settings-row.view.ts";

const TEXT = COPY.settings;

const ask = (dispatch: Dispatch, request: SyncRequest) =>
  dispatch(requestSync.create({ request }));

// A text field that asks the server when its value is changed.
function renderNameField(
  id: string,
  value: string,
  onName: (name: string) => void,
): TemplateResult {
  return html`<input
    class="settings__field"
    id=${id}
    aria-label=${TEXT.nameLabel}
    .value=${value}
    @change=${(event: Event) => {
      if (!(event.currentTarget instanceof HTMLInputElement)) return;
      const name = event.currentTarget.value.trim();
      if (name !== "" && name !== value) onName(name);
    }}
  />`;
}

// Passkeys: "Add a passkey", which asks this device's authenticator to
// make one, then each passkey with the day it was added and Remove.
function renderPasskeys(state: AppState, dispatch: Dispatch) {
  const { passkeys = [], error } = state.persistence.account;
  const hint =
    error === "passkey-refused"
      ? COPY.account.errors["passkey-refused"]
      : TEXT.passkeysHint;
  const add = renderButton({
    label: TEXT.addPasskey,
    onClick: () =>
      dispatch(requestAccount.create({ request: { kind: "passkey-add" } })),
  });
  return html`${renderRow(TEXT.passkeys, hint, add)}
  ${passkeys.map((passkey, index) =>
    renderRow(
      TEXT.passkeyName(index + 1),
      TEXT.passkeyAdded(DAY.format(passkey.createdAt)),
      renderButton({
        label: TEXT.removePasskey,
        onClick: () =>
          dispatch(
            requestAccount.create({
              request: { kind: "remove-passkey", id: passkey.id },
            }),
          ),
      }),
    ),
  )}`;
}

const DAY = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function renderAccount(state: AppState, dispatch: Dispatch) {
  const { user } = state.persistence.account;
  if (user === null)
    return html`<p class="settings__hint">${TEXT.signedOut}</p>`;
  const name = renderNameField("settings-account-name", user.name, (next) =>
    ask(dispatch, { kind: "profile", name: next }),
  );
  return html`${renderRow(TEXT.preferredName, TEXT.preferredNameHint, name)}
  ${renderRow(TEXT.email, user.email, html`<span></span>`)}
  ${renderPasskeys(state, dispatch)}`;
}

export function renderGeneral(state: AppState, dispatch: Dispatch) {
  const { workspaces, workspaceId } = state.persistence.sync;
  const open = workspaces.find((workspace) => workspace.id === workspaceId);
  if (open === undefined)
    return html`<p class="settings__hint">${TEXT.signedOut}</p>`;
  const name = renderNameField("settings-workspace-name", open.name, (next) =>
    ask(dispatch, { kind: "rename", name: next }),
  );
  return html`${renderRow(TEXT.workspaceName, TEXT.workspaceNameHint, name)}
  ${renderDangerZone(state, dispatch, open)}`;
}

function renderInvite(dispatch: Dispatch): TemplateResult {
  return html`<form
    class="settings__invite"
    @submit=${(event: SubmitEvent) => {
      event.preventDefault();
      if (!(event.currentTarget instanceof HTMLFormElement)) return;
      const value = new FormData(event.currentTarget).get("email");
      if (typeof value !== "string" || value.trim() === "") return;
      ask(dispatch, { kind: "invite", email: value.trim(), role: "member" });
      event.currentTarget.reset();
    }}
  >
    <input
      class="settings__field"
      name="email"
      type="email"
      required
      aria-label=${TEXT.inviteLabel}
      placeholder=${TEXT.invitePlaceholder}
    />
    <button class="settings__invite-button" type="submit">
      ${TEXT.invite}
    </button>
  </form>`;
}

function roleName(role: string): string {
  return role === "owner" || role === "member" || role === "guest"
    ? TEXT.roles[role]
    : role;
}

interface PersonRow {
  readonly name: string;
  readonly detail: string;
  readonly role: string;
  // Absent for the person looking: they cannot remove themselves.
  readonly request?: SyncRequest;
}

function renderPerson(row: PersonRow, dispatch: Dispatch): TemplateResult {
  const { request } = row;
  return html`<tr>
    <td>
      <span class="settings__name">${row.name}</span>
      <span class="settings__hint">${row.detail}</span>
    </td>
    <td>${roleName(row.role)}</td>
    <td>
      ${
        request === undefined
          ? nothing
          : renderButton({
              label: TEXT.remove,
              onClick: () => ask(dispatch, request),
            })
      }
    </td>
  </tr>`;
}

function peopleRows(state: AppState): PersonRow[] {
  const { members, invites } = state.persistence.sync;
  const userId = state.persistence.account.user?.id;
  return [
    ...members.map((member) => ({
      name: member.name,
      detail: member.email,
      role: member.role,
      ...(member.id === userId
        ? {}
        : { request: { kind: "remove-member", userId: member.id } as const }),
    })),
    ...invites.map((invite) => ({
      name: invite.email,
      detail: TEXT.invited,
      role: invite.role,
      request: { kind: "remove-invite", email: invite.email } as const,
    })),
  ];
}

export function renderPeople(state: AppState, dispatch: Dispatch) {
  if (state.persistence.sync.workspaceId === null) {
    return html`<p class="settings__hint">${TEXT.signedOut}</p>`;
  }
  return html`${renderInvite(dispatch)}
    <table class="settings__people">
      <thead>
        <tr>
          <th>${TEXT.user}</th>
          <th>${TEXT.accessLevel}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${peopleRows(state).map((row) => renderPerson(row, dispatch))}
      </tbody>
    </table>`;
}
