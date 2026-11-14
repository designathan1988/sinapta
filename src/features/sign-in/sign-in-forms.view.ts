// The forms of each sign-in step, as Notion's login page draws them: the
// address, then a password, a login code, or a new account's profile.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  answerAccount,
  requestAccount,
  setAccountStep,
  type AccountRequest,
  type AccountState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { focusOnce } from "../../ui/focus/index.ts";

const TEXT = COPY.account;

type Shown = TemplateResult | typeof nothing;

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

// The address is checked here, so that what is wrong is said on the
// page, in its own words, not in the browser's bubble.
function onEmailSubmit(dispatch: Dispatch) {
  const lookup = onSubmit(dispatch, (form) => ({
    kind: "lookup",
    email: field(form, "email"),
  }));
  return (event: SubmitEvent): void => {
    const form = event.currentTarget;
    if (form instanceof HTMLFormElement && !form.checkValidity()) {
      event.preventDefault();
      const answer = { kind: "error", error: "invalid-email" } as const;
      dispatch(answerAccount.create({ answer }));
      return;
    }
    lookup(event);
  };
}

function renderEmailStep(
  account: AccountState,
  dispatch: Dispatch,
  error: Shown,
) {
  return html`<form
    class="sign-in__form"
    novalidate
    @submit=${onEmailSubmit(dispatch)}
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
    ${renderSubmit(account, TEXT.continue)} ${error}
  </form>`;
}

function renderPasswordStep(
  account: AccountState,
  dispatch: Dispatch,
  error: Shown,
) {
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
      ${renderSubmit(account, TEXT.continueWithPassword)} ${error}
    </form>
    ${renderLink(TEXT.sendCode, () =>
      dispatch(
        requestAccount.create({ request: { kind: "send-code", email } }),
      ),
    )}`;
}

function renderCodeStep(
  account: AccountState,
  dispatch: Dispatch,
  error: Shown,
) {
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
    ${renderSubmit(account, TEXT.continueWithCode)} ${error}
  </form>`;
}

function renderProfileStep(
  account: AccountState,
  dispatch: Dispatch,
  error: Shown,
) {
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
    ${renderSubmit(account, TEXT.continue)} ${error}
  </form>`;
}

const STEPS = {
  email: renderEmailStep,
  password: renderPasswordStep,
  code: renderCodeStep,
  profile: renderProfileStep,
};

// The step's form, with what went wrong right under its button.
export function renderStepForm(
  account: AccountState,
  dispatch: Dispatch,
  error: Shown,
): TemplateResult {
  const back =
    account.step === "email"
      ? nothing
      : renderLink(TEXT.differentEmail, () =>
          dispatch(setAccountStep.create({ step: "email" })),
        );
  return html`${STEPS[account.step](account, dispatch, error)}${back}`;
}
