// A template's own actions behind its "…" in the templates menu, as
// Notion's: Repeat, Set as default, Edit, Duplicate, and Delete, which
// asks first.
import { nothing, type TemplateResult } from "lit-html";
import {
  selectPage,
  REPEAT_PERIODS,
  type RepeatPeriod,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  closeChildOverlay,
  openChildOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderConfirm } from "../../ui/confirm/index.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";
import { childIndexOf } from "../../ui/overlay/index.ts";
import type { TableContext } from "./table-cell.view.ts";
import {
  deleteTemplate,
  duplicateTemplate,
  editTemplate,
  selectRowTemplate,
} from "./template.commands.ts";
import { setDefaultTemplate } from "./template-default.commands.ts";
import { setTemplateRepeat } from "./template-repeat.commands.ts";

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
export function defaultItem(
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

// How often a template repeats: off, or every day, week, month or year,
// from the next one; also the strip's Repeat… list.
export function repeatChoices(
  state: AppState,
  dispatch: Dispatch,
  templateId: BlockId,
): MenuEntry[] {
  const every = selectPage(state, templateId)?.props.repeat?.every;
  const choose = (period: RepeatPeriod | null) => (): void => {
    const today = new Date().toLocaleDateString("en-CA");
    dispatch(setTemplateRepeat.create({ templateId, every: period, today }));
  };
  return [null, ...REPEAT_PERIODS].map((period) => ({
    label: TEXT.repeatPeriods[period ?? "off"],
    check: "radio",
    isChecked: (every ?? null) === period,
    onSelect: choose(period),
  }));
}

// "Repeat", with how often beside it.
function repeatItem(context: TableContext, templateId: BlockId): MenuItem {
  const { state, dispatch } = context;
  const every = selectPage(state, templateId)?.props.repeat?.every;
  return {
    label: TEXT.templateRepeat,
    icon: "clock",
    value: TEXT.repeatPeriods[every ?? "off"],
    submenu: {
      id: `template-repeat:${templateId}`,
      menu: () => ({
        label: TEXT.templateRepeat,
        items: repeatChoices(state, dispatch, templateId),
      }),
    },
  };
}

export function templateActions(
  context: TableContext,
  templateId: BlockId,
): MenuEntry[] {
  const { state, dispatch } = context;
  const copy = selectRowTemplate(state, templateId);
  return [
    repeatItem(context, templateId),
    defaultItem(context, templateId),
    {
      label: TEXT.templateEdit,
      icon: "compose",
      onSelect: () => {
        const viewId = context.model.view.id;
        dispatch(editTemplate.create({ templateId, viewId }));
      },
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
    deleteItem(context, templateId),
  ];
}

// Delete, which asks first beside the template's "…".
function deleteItem(context: TableContext, templateId: BlockId): MenuItem {
  return {
    label: TEXT.templateDelete,
    icon: "trash",
    isDanger: true,
    keepsOpen: true,
    onSelect: () => {
      const anchorId = deleteAnchor(templateId);
      context.dispatch(openChildOverlay.create({ anchorId, depth: 1 }));
    },
  };
}

function deleteAnchor(templateId: BlockId): string {
  return `template-delete:${templateId}`;
}

// "Delete this template?", asked inside the template's "…" while open.
export function renderDeleteQuestion(
  context: TableContext,
  templateId: BlockId,
): TemplateResult | typeof nothing {
  const { state, dispatch } = context;
  const anchorId = deleteAnchor(templateId);
  if (childIndexOf(state.ui.overlay, anchorId) === -1) return nothing;
  return renderConfirm({
    question: TEXT.templateDeleteQuestion,
    answer: TEXT.templateDelete,
    cancel: TEXT.templateCancel,
    isChild: true,
    onAnswer: () => dispatch(deleteTemplate.create({ templateId })),
    onCancel: () => dispatch(closeChildOverlay.create({ depth: 1 })),
  });
}
