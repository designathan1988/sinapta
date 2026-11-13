// What Open page opens, as Notion's "Open page, form, or URL": this row,
// another page chosen by name, or a web address.
import { html, type TemplateResult } from "lit-html";
import {
  PAGE_TYPE,
  selectIsInTrash,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { changeAction, type Card } from "./button-action-cards.view.ts";
import type { ButtonPropertyAction } from "./properties/button/index.ts";

const TEXT = COPY.automation;

type OpenPage = Extract<ButtonPropertyAction, { kind: "open-page" }>;

const THIS_PAGE = "this";
const URL_CHOICE = "url";

function pages(state: AppState) {
  return Object.values(state.workspace.blocks).flatMap((block) => {
    if (block.type !== PAGE_TYPE) return [];
    const page = selectPage(state, block.id);
    if (page === undefined || selectIsInTrash(state, page)) return [];
    const title = selectPageTitle(page);
    const label = title === "" ? COPY.sidebar.untitled : title;
    return [{ value: page.id, label, icon: "page" as const }];
  });
}

function chosen(action: OpenPage): string {
  if (action.url !== undefined) return URL_CHOICE;
  return action.pageId ?? THIS_PAGE;
}

function next(choice: string): OpenPage {
  if (choice === THIS_PAGE) return { kind: "open-page" };
  if (choice === URL_CHOICE) return { kind: "open-page", url: "" };
  return { kind: "open-page", pageId: choice };
}

export function renderOpenChoice(card: Card, action: OpenPage): TemplateResult {
  const choice = renderSelect(
    {
      id: `automation-${String(card.index)}-open`,
      label: TEXT.open,
      value: chosen(action),
      variant: "field",
      searchPlaceholder: TEXT.open,
      options: [
        { value: THIS_PAGE, label: TEXT.thisPage, icon: "page" },
        { value: URL_CHOICE, label: TEXT.url, icon: "link" },
        ...pages(card.state),
      ],
      onChoose: (value) => {
        changeAction(card, next(value));
      },
    },
    { overlay: card.state.ui.overlay, dispatch: card.dispatch },
  );
  if (action.url === undefined) return choice;
  return html`${choice}<input
      class="database__field automation__field"
      type="url"
      aria-label=${TEXT.url}
      placeholder=${TEXT.urlPlaceholder}
      .value=${action.url}
      @change=${(event: Event) => {
        if (event.target instanceof HTMLInputElement) {
          changeAction(card, { kind: "open-page", url: event.target.value });
        }
      }}
    />`;
}
