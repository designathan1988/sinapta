// The list under the New button's arrow, as Notion's: the database's
// templates, each making a new row from it, with its actions behind a
// "…" (template-actions.view.ts); an empty page beside them; and New
// template, under a line that says what templates are while there is
// none.
import type { TemplateResult } from "lit-html";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  renderMenu,
  type MenuEntry,
  type MenuItem,
} from "../../ui/menu/index.ts";
import { addRow } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import {
  defaultItem,
  renderDeleteQuestion,
  templateActions,
} from "./template-actions.view.ts";
import { addTemplate, selectRowTemplate } from "./template.commands.ts";
import { selectDefaultTemplateId } from "./template-default.commands.ts";

export const TEMPLATES_OVERLAY = "templates";

const TEXT = COPY.database;

// Whether the template is the default of the view on screen.
function isDefaultHere(context: TableContext, templateId: BlockId | null) {
  const { state, model } = context;
  return selectDefaultTemplateId(state, model.database.id) === templateId;
}

// A new row, from the template or empty, opened as the view opens rows.
function addFrom(context: TableContext, templateId: BlockId | null) {
  return (): void => {
    const { model, state, dispatch } = context;
    const template =
      templateId === null ? undefined : selectRowTemplate(state, templateId);
    const payload = {
      databaseId: model.database.id,
      opensPage: true,
      viewId: model.view.id,
    };
    dispatch(
      addRow.create(
        template === undefined ? payload : { ...payload, template },
      ),
    );
  };
}

function templateItem(context: TableContext, templateId: BlockId): MenuItem[] {
  const page = selectPage(context.state, templateId);
  if (page === undefined) return [];
  const title = selectPageTitle(page);
  const label = title === "" ? COPY.sidebar.untitled : title;
  const isDefault = isDefaultHere(context, templateId);
  return [
    {
      label,
      icon: "page",
      ...(isDefault && { value: TEXT.templateDefault }),
      onSelect: addFrom(context, templateId),
      more: {
        id: `template-more:${templateId}`,
        menu: () => ({
          label,
          items: templateActions(context, templateId),
          tail: renderDeleteQuestion(context, templateId),
        }),
      },
    },
  ];
}

// The empty page, which can be the default too.
function emptyItem(context: TableContext): MenuItem {
  const { database } = context.model;
  const isDefault = isDefaultHere(context, null);
  return {
    label: TEXT.templateEmpty,
    icon: "page",
    ...(isDefault && { value: TEXT.templateDefault }),
    onSelect: addFrom(context, null),
    more: {
      id: `template-more:${database.id}`,
      menu: () => ({
        label: TEXT.templateEmpty,
        items: [defaultItem(context, null)],
      }),
    },
  };
}

export function renderTemplatesMenu(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const { database } = model;
  const name = selectPageTitle(database);
  const templates = database.props.templateIds.flatMap((id) =>
    templateItem(context, id),
  );
  const items: MenuEntry[] = [
    {
      kind: "section",
      label: TEXT.templatesFor(name === "" ? COPY.sidebar.untitled : name),
    },
    ...(templates.length === 0
      ? [{ kind: "note" as const, label: TEXT.templatesNone }]
      : [...templates, emptyItem(context)]),
    { kind: "divider" },
    {
      label: TEXT.templateNew,
      icon: "plus",
      onSelect: () => {
        const viewId = model.view.id;
        dispatch(addTemplate.create({ databaseId: database.id, viewId }));
      },
    },
  ];
  return renderMenu({
    label: TEXT.templates,
    items,
    context: { overlay: state.ui.overlay, dispatch },
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
