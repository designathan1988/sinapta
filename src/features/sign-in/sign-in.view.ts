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
  const named = TEXT.providers.find(
    (provider) => provider.toLowerCase() === account.provider?.toLowerCase(),
  );
  const text =
    account.error === "not-connected" || account.error === "provider-failed"
      ? `${named ?? account.provider ?? ""} ${message}`
      : message;
  return html`<p class="sign-in__error" role="alert">${text}</p>`;
}

// A passkey signs in on this server; another company's sign-in goes to
// it when this server is set up with it, and otherwise the screen says so.
function chooseSignIn(
  provider: string,
  account: AccountState,
  dispatch: Dispatch,
): void {
  const id = provider.toLowerCase();
  if (provider === PASSKEY) {
    dispatch(requestAccount.create({ request: { kind: "passkey-sign-in" } }));
  } else if (account.providers?.includes(id) === true) {
    const request = { kind: "provider-sign-in" as const, provider: id };
    dispatch(requestAccount.create({ request }));
  } else dispatch(chooseProvider.create({ provider }));
}

function renderProviders(
  account: AccountState,
  dispatch: Dispatch,
): TemplateResult {
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
              chooseSignIn(provider, account, dispatch);
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
      ${renderError(account)}
      ${isEmail ? renderProviders(account, dispatch) : nothing}
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
