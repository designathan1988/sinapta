// The list under the New button's arrow, as Notion's: the database's
// templates, each making a new row from it, with its actions behind a
// "…" (Set as default, Edit, Duplicate, Delete); an empty page; and New
// template.
import type { TemplateResult } from "lit-html";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import { closeOverlay, setActivePage } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  renderMenu,
  type MenuEntry,
  type MenuItem,
} from "../../ui/menu/index.ts";
import { addRow } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import {
  addTemplate,
  deleteTemplate,
  duplicateTemplate,
  selectRowTemplate,
  setDefaultTemplate,
} from "./template.commands.ts";

export const TEMPLATES_OVERLAY = "templates";

const TEXT = COPY.database;

function setDefault(context: TableContext, templateId: BlockId | null) {
  return (): void => {
    const databaseId = context.model.database.id;
    context.dispatch(setDefaultTemplate.create({ databaseId, templateId }));
  };
}

function templateActions(
  context: TableContext,
  templateId: BlockId,
): MenuEntry[] {
  const { model, state, dispatch } = context;
  const isDefault = model.database.props.defaultTemplateId === templateId;
  const copy = selectRowTemplate(state, templateId);
  return [
    {
      label: TEXT.templateSetDefault,
      check: "box",
      isChecked: isDefault,
      onSelect: setDefault(context, isDefault ? null : templateId),
    },
    {
      label: TEXT.templateEdit,
      icon: "compose",
      onSelect: () => dispatch(setActivePage.create({ pageId: templateId })),
    },
    {
      label: TEXT.templateDuplicate,
      icon: "duplicate",
      isDisabled: copy === undefined,
      onSelect: () => {
        if (copy === undefined) return;
        const { blockCount } = copy;
        dispatch(duplicateTemplate.create({ templateId, blockCount }));
      },
    },
    {
      label: TEXT.templateDelete,
      icon: "trash",
      isDanger: true,
      onSelect: () => dispatch(deleteTemplate.create({ templateId })),
    },
  ];
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
  const isDefault =
    context.model.database.props.defaultTemplateId === templateId;
  return [
    {
      label,
      icon: "page",
      ...(isDefault && { value: TEXT.templateDefault }),
      onSelect: addFrom(context, templateId),
      more: {
        id: `template-more:${templateId}`,
        menu: () => ({ label, items: templateActions(context, templateId) }),
      },
    },
  ];
}

// The empty page, which can be the default too.
function emptyItem(context: TableContext): MenuItem {
  const { database } = context.model;
  const isDefault = database.props.defaultTemplateId === null;
  return {
    label: TEXT.templateEmpty,
    icon: "page",
    ...(isDefault && { value: TEXT.templateDefault }),
    onSelect: addFrom(context, null),
    more: {
      id: `template-more:${database.id}`,
      menu: () => ({
        label: TEXT.templateEmpty,
        items: [
          {
            label: TEXT.templateSetDefault,
            check: "box",
            isChecked: isDefault,
            onSelect: setDefault(context, null),
          },
        ],
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
    ...templates,
    emptyItem(context),
    { kind: "divider" },
    {
      label: TEXT.templateNew,
      icon: "plus",
      onSelect: () => dispatch(addTemplate.create({ databaseId: database.id })),
    },
  ];
  return renderMenu({
    label: TEXT.templates,
    items,
    context: { overlay: state.ui.overlay, dispatch },
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
