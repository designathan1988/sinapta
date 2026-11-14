// Notion's login page (n82-login): its mark, headline, the step's form,
// the other ways in, and the terms, in one 360 px column.
import "./sign-in.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  chooseProvider,
  requestAccount,
  type AccountState,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY, PRODUCT_NAME } from "../../ui/copy.ts";
import { renderStepForm } from "./sign-in-forms.view.ts";

const PASSKEY = "Passkey";

const TEXT = COPY.account;

function renderError(account: AccountState): TemplateResult | typeof nothing {
  if (account.error === null) return nothing;
  const message = TEXT.errors[account.error];
  const text =
    account.error === "not-connected"
      ? `${account.provider ?? ""} ${message}`
      : message;
  return html`<p class="sign-in__error" role="alert">${text}</p>`;
}

// A passkey signs in on this server; the others need a third party's
// registration, and the screen says so.
function chooseSignIn(provider: string, dispatch: Dispatch): void {
  if (provider === PASSKEY) {
    dispatch(requestAccount.create({ request: { kind: "passkey-sign-in" } }));
  } else dispatch(chooseProvider.create({ provider }));
}

function renderProviders(dispatch: Dispatch): TemplateResult {
  return html`<div class="sign-in__or" role="separator">
      <span>${TEXT.orContinueWith}</span>
    </div>
    <div class="sign-in__providers">
      ${TEXT.providers.map(
        (provider) =>
          html`<button
            class="sign-in__provider"
            type="button"
            @click=${() => {
              chooseSignIn(provider, dispatch);
            }}
          >
            <span class="sign-in__provider-mark" aria-hidden="true"
              >${provider.slice(0, 1)}</span
            >${provider}
          </button>`,
      )}
    </div>`;
}

function renderHeadline(account: AccountState): TemplateResult {
  const isProfile = account.step === "profile";
  return html`<h1 class="sign-in__headline">
      ${isProfile ? TEXT.profileHeadline : TEXT.headline}
    </h1>
    <p class="sign-in__subhead">
      ${isProfile ? TEXT.profileSubhead : TEXT.subhead}
    </p>`;
}

function renderFooter(): TemplateResult {
  return html`<p class="sign-in__terms">
    ${TEXT.termsBefore} <a href="#terms">${TEXT.terms}</a> ${TEXT.and}
    <a href="#privacy">${TEXT.privacy}</a>.
  </p>`;
}

export function renderSignIn(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const { account } = state.persistence;
  const isEmail = account.step === "email";
  return html`<main class="sign-in">
    <div class="sign-in__column">
      <img class="sign-in__logo" src="/icon.svg" alt=${PRODUCT_NAME} />
      ${renderHeadline(account)} ${renderStepForm(account, dispatch)}
      ${renderError(account)} ${isEmail ? renderProviders(dispatch) : nothing}
      ${
        isEmail
          ? html`<p class="sign-in__new">${TEXT.newUser} ${TEXT.signUp}</p>`
          : nothing
      }
      ${renderFooter()}
    </div>
    <p class="sign-in__language">${TEXT.language}</p>
  </main>`;
}
