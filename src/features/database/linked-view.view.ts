// A linked view in a page: a choice of database until one is shown, then
// that database's rows through the linked view's own views, under the
// database's name, which opens it.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  DATABASE_TYPE,
  isPageLike,
  selectIsInTrash,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { renderDatabaseSection } from "./database.view.ts";
import { setLinkedViewSource } from "./linked-view.commands.ts";
import {
  selectLinkedProps,
  selectViewHolder,
} from "./view-holder.selectors.ts";

const TEXT = COPY.database;

function renderChoice(
  state: AppState,
  dispatch: Dispatch,
  blockId: BlockId,
): TemplateResult {
  const databases = Object.values(state.workspace.blocks).filter(
    (block) =>
      block.type === DATABASE_TYPE &&
      isPageLike(block) &&
      !selectIsInTrash(state, block),
  );
  const choose = (value: string): void => {
    const databaseId = parseBlockId(value);
    if (databaseId !== undefined) {
      dispatch(setLinkedViewSource.create({ blockId, databaseId }));
    }
  };
  return html`<div class="database__linked-choice">
    <span>${TEXT.linkedChoose}</span>
    ${renderSelect(
      {
        id: `linked-${blockId}`,
        label: TEXT.linkedChoose,
        value: undefined,
        placeholder: TEXT.chooseDatabase,
        searchPlaceholder: TEXT.chooseDatabase,
        options: databases.map((block) => {
          const title = isPageLike(block) ? selectPageTitle(block) : "";
          return {
            value: block.id,
            label: title === "" ? TEXT.untitled : title,
            icon: "database" as const,
          };
        }),
        onChoose: choose,
      },
      { overlay: state.ui.overlay, dispatch },
    )}
  </div>`;
}

export function renderLinkedView(
  state: AppState,
  dispatch: Dispatch,
  blockId: BlockId,
): TemplateResult | typeof nothing {
  const props = selectLinkedProps(state, blockId);
  if (props === undefined) return nothing;
  if (props.databaseId === undefined) {
    return renderChoice(state, dispatch, blockId);
  }
  const holder = selectViewHolder(state, blockId);
  if (holder === undefined) {
    return html`<p class="database__missing">${TEXT.notFound}</p>`;
  }
  const { database } = holder;
  const title = selectPageTitle(database);
  const header = html`<header class="database__inline-header">
    ${renderButton({
      label: title === "" ? TEXT.untitled : title,
      icon: "relation",
      onClick: () => dispatch(setActivePage.create({ pageId: database.id })),
    })}
  </header>`;
  return renderDatabaseSection(state, dispatch, {
    holderId: blockId,
    header,
    isInline: true,
  });
}
