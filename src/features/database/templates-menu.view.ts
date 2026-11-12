// The list under the New button's arrow, as Notion's: the database's
// templates, each making a new row from it, with its actions behind a
// "…" (Set as default, Edit, Duplicate, Delete); an empty page; and New
// template.
import type { TemplateResult } from "lit-html";
import {
  selectPage,
  selectPageTitle,
  REPEAT_PERIODS,
  type RepeatPeriod,
} from "../../blocks/page/index.ts";
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
} from "./template.commands.ts";
import {
  selectDefaultTemplateId,
  setDefaultTemplate,
} from "./template-default.commands.ts";
import { setTemplateRepeat } from "./template-repeat.commands.ts";

export const TEMPLATES_OVERLAY = "templates";

const TEXT = COPY.database;

// "For all views" and "For this view", ticked where the template is the
// default.
function defaultChoices(
  context: TableContext,
  templateId: BlockId | null,
): MenuEntry[] {
  const { database, view } = context.model;
  const own = view.defaultTemplateId;
  const isAll =
    own === undefined && database.props.defaultTemplateId === templateId;
  const choose = (forView: boolean) => (): void => {
    context.dispatch(
      setDefaultTemplate.create({
        databaseId: database.id,
        templateId,
        ...(forView && { viewId: view.id }),
      }),
    );
  };
  return [
    {
      label: TEXT.templateForAllViews,
      check: "box",
      isChecked: isAll,
      onSelect: choose(false),
    },
    {
      label: TEXT.templateForThisView,
      value: view.name,
      check: "box",
      isChecked: own === templateId,
      onSelect: choose(true),
    },
  ];
}

// "Set as default", with its choices beside it, as Notion's; the empty
// page is a default too.
function defaultItem(
  context: TableContext,
  templateId: BlockId | null,
): MenuItem {
  return {
    label: TEXT.templateSetDefault,
    submenu: {
      id: `template-default:${templateId ?? context.model.database.id}`,
      menu: () => ({
        label: TEXT.templateSetDefault,
        items: defaultChoices(context, templateId),
      }),
    },
  };
}

// "Repeat", with how often beside it: off, or every day, week, month or
// year, from the next one.
function repeatItem(context: TableContext, templateId: BlockId): MenuItem {
  const every = selectPage(context.state, templateId)?.props.repeat?.every;
  const choose = (period: RepeatPeriod | null) => (): void => {
    const today = new Date().toLocaleDateString("en-CA");
    context.dispatch(
      setTemplateRepeat.create({ templateId, every: period, today }),
    );
  };
  const choices: MenuEntry[] = [null, ...REPEAT_PERIODS].map((period) => ({
    label: TEXT.repeatPeriods[period ?? "off"],
    check: "radio",
    isChecked: (every ?? null) === period,
    onSelect: choose(period),
  }));
  return {
    label: TEXT.templateRepeat,
    icon: "clock",
    value: TEXT.repeatPeriods[every ?? "off"],
    submenu: {
      id: `template-repeat:${templateId}`,
      menu: () => ({ label: TEXT.templateRepeat, items: choices }),
    },
  };
}

// Whether the template is the default of the view on screen.
function isDefaultHere(context: TableContext, templateId: BlockId | null) {
  const { state, model } = context;
  return selectDefaultTemplateId(state, model.database.id) === templateId;
}

function templateActions(
  context: TableContext,
  templateId: BlockId,
): MenuEntry[] {
  const { state, dispatch } = context;
  const copy = selectRowTemplate(state, templateId);
  return [
    defaultItem(context, templateId),
    repeatItem(context, templateId),
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
  const isDefault = isDefaultHere(context, templateId);
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
