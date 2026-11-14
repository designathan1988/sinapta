// The Share tab: invite by email, the people with access and their level,
// who else can open the page, and Copy link.
import { html, type TemplateResult } from "lit-html";
import {
  requestSync,
  type AppState,
  type Dispatch,
  type GeneralAccess,
  type PageAccess,
  type SyncRequest,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { announce } from "../../ui/announcer/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";

const TEXT = COPY.share;
const ACCESS: readonly PageAccess[] = ["full", "edit", "comment", "view"];
const GENERAL: readonly GeneralAccess[] = ["invited", "workspace", "web"];
const REMOVE = "remove";

const ask = (dispatch: Dispatch, request: SyncRequest) =>
  dispatch(requestSync.create({ request }));

function isAccess(value: string): value is PageAccess {
  return ACCESS.some((access) => access === value);
}

function isGeneral(value: string): value is GeneralAccess {
  return GENERAL.some((general) => general === value);
}

function valueOf(event: Event): string {
  return event.currentTarget instanceof HTMLSelectElement
    ? event.currentTarget.value
    : "";
}

function renderInvite(pageId: string, dispatch: Dispatch): TemplateResult {
  return html`<form
    class="share__invite"
    @submit=${(event: SubmitEvent) => {
      event.preventDefault();
      if (!(event.currentTarget instanceof HTMLFormElement)) return;
      const text = new FormData(event.currentTarget).get("emails");
      if (typeof text !== "string") return;
      for (const email of text.split(",").map((part) => part.trim())) {
        if (email !== "")
          ask(dispatch, { kind: "share", pageId, email, access: "edit" });
      }
      event.currentTarget.reset();
    }}
  >
    <input
      class="share__field"
      name="emails"
      aria-label=${TEXT.placeholder}
      placeholder=${TEXT.placeholder}
      autocomplete="off"
    />
    <button class="share__primary" type="submit">${TEXT.invite}</button>
  </form>`;
}

interface Person {
  readonly name: string;
  readonly email: string;
  readonly access: PageAccess;
  readonly isYou: boolean;
}

function renderPerson(person: Person, pageId: string, dispatch: Dispatch) {
  const onChange = (event: Event) => {
    const value = valueOf(event);
    if (value === REMOVE)
      ask(dispatch, { kind: "unshare", pageId, email: person.email });
    else if (isAccess(value)) {
      ask(dispatch, {
        kind: "share",
        pageId,
        email: person.email,
        access: value,
      });
    }
  };
  return html`<li class="share__person">
    <span class="share__avatar" aria-hidden="true"
      >${person.name.slice(0, 1).toUpperCase()}</span
    >
    <span class="share__who">
      <span
        >${person.name}
        ${person.isYou ? html`<span class="share__muted">${TEXT.you}</span>` : ""}</span
      >
      <span class="share__muted">${person.email}</span>
    </span>
    ${
      person.isYou
        ? html`<span class="share__muted">${TEXT.access.full}</span>`
        : html`<select
            class="share__select"
            aria-label=${person.email}
            @change=${onChange}
          >
            ${ACCESS.map((access) => html`<option value=${access} ?selected=${access === person.access}>${TEXT.access[access]}</option>`)}
            <option value=${REMOVE}>${TEXT.remove}</option>
          </select>`
    }
  </li>`;
}

function peopleOf(state: AppState): Person[] {
  const { user } = state.persistence.account;
  const you: Person[] =
    user === null
      ? []
      : [{ name: user.name, email: user.email, access: "full", isYou: true }];
  const shared = state.persistence.sync.sharing?.people ?? [];
  return [
    ...you,
    ...shared.map((person) => ({
      name: person.name ?? person.email,
      email: person.email,
      access: person.access,
      isYou: false,
    })),
  ];
}

function renderGeneral(state: AppState, pageId: string, dispatch: Dispatch) {
  const general = state.persistence.sync.sharing?.general ?? "workspace";
  return html`<p class="share__label">${TEXT.generalAccess}</p>
    <div class="share__general">
      <span class="share__lock" aria-hidden="true"
        >${renderIcon(general === "web" ? "link" : "lock")}</span
      >
      <select
        class="share__select"
        aria-label=${TEXT.generalAccess}
        @change=${(event: Event) => {
          const value = valueOf(event);
          if (isGeneral(value))
            ask(dispatch, { kind: "general", pageId, general: value });
        }}
      >
        ${GENERAL.map((option) => html`<option value=${option} ?selected=${option === general}>${TEXT.general[option]}</option>`)}
      </select>
    </div>`;
}

export function renderShareTab(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const pageId = state.ui.activePageId ?? "";
  return html`<div class="share__body">
      ${renderInvite(pageId, dispatch)}
      <ul class="share__people">
        ${peopleOf(state).map((person) => renderPerson(person, pageId, dispatch))}
      </ul>
      ${renderGeneral(state, pageId, dispatch)}
    </div>
    <div class="share__foot">
      <button
        type="button"
        class="share__secondary"
        @click=${() => {
          void navigator.clipboard.writeText(location.href).then(() => {
            announce(TEXT.linkCopied);
          });
        }}
      >
        ${renderIcon("link")} ${TEXT.copyLink}
      </button>
    </div>`;
}
