// The forms of each sign-in step, as Notion's login page draws them: the
// address, then a password, a login code, or a new account's profile.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  requestAccount,
  setAccountStep,
  type AccountRequest,
  type AccountState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { focusOnce } from "../../ui/focus/index.ts";

const TEXT = COPY.account;

function field(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value : "";
}

// A form that turns its fields into one question for the server.
function onSubmit(
  dispatch: Dispatch,
  build: (form: HTMLFormElement) => AccountRequest,
): (event: SubmitEvent) => void {
  return (event) => {
    event.preventDefault();
    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    dispatch(requestAccount.create({ request: build(event.currentTarget) }));
  };
}

interface FieldOptions {
  readonly name: string;
  readonly label: string;
  readonly type: string;
  readonly placeholder: string;
  readonly autocomplete: string;
  readonly takesFocus?: boolean;
}

function renderField(options: FieldOptions): TemplateResult {
  return html`<label class="sign-in__label" for=${`sign-in-${options.name}`}
      >${options.label}</label
    ><input
      class="sign-in__input"
      id=${`sign-in-${options.name}`}
      name=${options.name}
      type=${options.type}
      placeholder=${options.placeholder}
      autocomplete=${options.autocomplete}
      required
      ${options.takesFocus === true ? ref(focusOnce) : nothing}
    />`;
}

function renderEmailShown(account: AccountState): TemplateResult {
  return html`<label class="sign-in__label" for="sign-in-shown-email"
      >${TEXT.emailLabel}</label
    ><input
      class="sign-in__input"
      id="sign-in-shown-email"
      type="email"
      .value=${account.email}
      readonly
    />`;
}

function renderSubmit(account: AccountState, label: string): TemplateResult {
  return html`<button
    class="sign-in__continue"
    type="submit"
    ?disabled=${account.request !== null}
    aria-busy=${account.request === null ? "false" : "true"}
  >
    ${label}
  </button>`;
}

function renderLink(label: string, onClick: () => void): TemplateResult {
  return html`<button class="sign-in__link" type="button" @click=${onClick}>
    ${label}
  </button>`;
}

function renderEmailStep(account: AccountState, dispatch: Dispatch) {
  return html`<form
    class="sign-in__form"
    @submit=${onSubmit(dispatch, (form) => ({
      kind: "lookup",
      email: field(form, "email"),
    }))}
  >
    ${renderField({
      name: "email",
      label: TEXT.emailLabel,
      type: "email",
      placeholder: TEXT.emailPlaceholder,
      autocomplete: "email",
      takesFocus: true,
    })}
    <p class="sign-in__hint">${TEXT.emailHint}</p>
    ${renderSubmit(account, TEXT.continue)}
  </form>`;
}

function renderPasswordStep(account: AccountState, dispatch: Dispatch) {
  const { email } = account;
  return html`<form
      class="sign-in__form"
      @submit=${onSubmit(dispatch, (form) => ({
        kind: "sign-in",
        email,
        password: field(form, "password"),
      }))}
    >
      ${renderEmailShown(account)}
      ${renderField({
        name: "password",
        label: TEXT.passwordLabel,
        type: "password",
        placeholder: TEXT.passwordPlaceholder,
        autocomplete: "current-password",
        takesFocus: true,
      })}
      ${renderSubmit(account, TEXT.continueWithPassword)}
    </form>
    ${renderLink(TEXT.sendCode, () =>
      dispatch(
        requestAccount.create({ request: { kind: "send-code", email } }),
      ),
    )}`;
}

function renderCodeStep(account: AccountState, dispatch: Dispatch) {
  const { email } = account;
  return html`<form
    class="sign-in__form"
    @submit=${onSubmit(dispatch, (form) => ({
      kind: "verify-code",
      email,
      code: field(form, "code").trim(),
    }))}
  >
    ${renderEmailShown(account)}
    <p class="sign-in__hint">${TEXT.codeSent} ${TEXT.codeLocal}</p>
    ${renderField({
      name: "code",
      label: TEXT.codeLabel,
      type: "text",
      placeholder: TEXT.codePlaceholder,
      autocomplete: "one-time-code",
      takesFocus: true,
    })}
    ${renderSubmit(account, TEXT.continueWithCode)}
  </form>`;
}

function renderProfileStep(account: AccountState, dispatch: Dispatch) {
  const { email } = account;
  return html`<form
    class="sign-in__form"
    @submit=${onSubmit(dispatch, (form) => ({
      kind: "sign-up",
      email,
      name: field(form, "name"),
      password: field(form, "password"),
    }))}
  >
    ${renderEmailShown(account)}
    ${renderField({
      name: "name",
      label: TEXT.nameLabel,
      type: "text",
      placeholder: TEXT.namePlaceholder,
      autocomplete: "name",
      takesFocus: true,
    })}
    ${renderField({
      name: "password",
      label: TEXT.passwordLabel,
      type: "password",
      placeholder: TEXT.newPasswordPlaceholder,
      autocomplete: "new-password",
    })}
    ${renderSubmit(account, TEXT.continue)}
  </form>`;
}

const STEPS = {
  email: renderEmailStep,
  password: renderPasswordStep,
  code: renderCodeStep,
  profile: renderProfileStep,
};

export function renderStepForm(
  account: AccountState,
  dispatch: Dispatch,
): TemplateResult {
  const back =
    account.step === "email"
      ? nothing
      : renderLink(TEXT.differentEmail, () =>
          dispatch(setAccountStep.create({ step: "email" })),
        );
  return html`${STEPS[account.step](account, dispatch)}${back}`;
}
