// Notion's "Create a teamspace" (n90-new-teamspace): over Settings ›
// Teamspaces, an icon and a name, a description, and the button that
// makes it, quiet until the teamspace has a name.
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { createTeamspace } from "../../blocks/teamspace/index.ts";
import { openOverlay, type Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { focusOnce } from "../../ui/focus/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { SETTINGS_OVERLAY_KIND } from "../../ui/shortcuts/index.ts";

export const TEAMSPACE_CREATE_OVERLAY = "teamspace-create";

const TEXT = COPY.teamspace;

// Back to Settings › Teamspaces, which the dialog stood over.
function backToSettings(dispatch: Dispatch): void {
  dispatch(
    openOverlay.create({
      overlay: { kind: SETTINGS_OVERLAY_KIND, anchorId: "teamspaces" },
    }),
  );
}

function onSubmit(event: SubmitEvent, dispatch: Dispatch): void {
  event.preventDefault();
  if (!(event.currentTarget instanceof HTMLFormElement)) return;
  const data = new FormData(event.currentTarget);
  const name = data.get("name");
  const description = data.get("description");
  if (typeof name !== "string" || typeof description !== "string") return;
  dispatch(createTeamspace.create({ name, description }));
  backToSettings(dispatch);
}

// The dialog's head: the mark, the title, and Notion's note.
function renderIntro(): TemplateResult {
  return html`<span class="teamspaces__mark" aria-hidden="true"
      >${renderIcon("building")}</span
    >
    <h2 class="teamspaces__create-title">${TEXT.createTitle}</h2>
    <p class="teamspaces__lead">${TEXT.createLead}</p>
    <div class="teamspaces__note">
      <p class="teamspaces__note-title">${TEXT.createFirst}</p>
      <p class="teamspaces__note-text">${TEXT.createEveryone}</p>
    </div>`;
}

function renderForm(dispatch: Dispatch): TemplateResult {
  return html`<form
    class="teamspaces__form"
    @submit=${(event: SubmitEvent) => {
      onSubmit(event, dispatch);
    }}
  >
    ${renderIntro()}
    <label class="teamspaces__label" for="teamspace-name"
      >${TEXT.iconAndName}</label
    >
    <div class="teamspaces__name">
      <span class="teamspaces__letter" aria-hidden="true">T</span>
      <input
        class="teamspaces__field"
        id="teamspace-name"
        name="name"
        required
        autocomplete="off"
        placeholder=${TEXT.namePlaceholder}
        ${ref(focusOnce)}
      />
    </div>
    <label class="teamspaces__label" for="teamspace-description"
      >${TEXT.description}</label
    >
    <textarea
      class="teamspaces__field teamspaces__description"
      id="teamspace-description"
      name="description"
      rows="3"
      placeholder=${TEXT.descriptionPlaceholder}
    ></textarea>
    <button class="button teamspaces__create" data-variant="primary">
      ${TEXT.create}
    </button>
  </form>`;
}

export function renderTeamspaceCreate(
  _state: unknown,
  dispatch: Dispatch,
): TemplateResult {
  return renderDialog({
    title: TEXT.createTitle,
    closeLabel: TEXT.close,
    variant: "card",
    content: renderForm(dispatch),
    onClose: () => {
      backToSettings(dispatch);
    },
  });
}
