// The options of a select, multi-select or status property, each with its
// name, color, moves up and down and delete, and a field to add one.
import { renderChip } from "../../ui/chip/index.ts";
import { html, type TemplateResult } from "lit-html";
import type {
  PropertyDefinition,
  SelectOption,
} from "../../blocks/database/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  deleteOption,
  moveOption,
  recolorOption,
  renameOption,
  type OptionTarget,
} from "./option.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { addOption, OPTION_COLORS } from "./table.commands.ts";

const TEXT = COPY.database;

function colorLabel(color: string): string {
  const tones: Readonly<Record<string, string>> = COPY.tones;
  return tones[color] ?? color;
}

interface OptionRow {
  readonly option: SelectOption;
  readonly target: OptionTarget;
  readonly dispatch: Dispatch;
}

function renderColorSelect(row: OptionRow): TemplateResult {
  const { option, target, dispatch } = row;
  const onColor = (event: Event): void => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    dispatch(recolorOption.create({ ...target, color: event.target.value }));
  };
  return html`<select
    class="database__field"
    aria-label=${TEXT.optionColor}
    @change=${onColor}
  >
    ${OPTION_COLORS.map(
      (color) =>
        html`<option value=${color} ?selected=${color === option.color}>
          ${colorLabel(color)}
        </option>`,
    )}
  </select>`;
}

function renderOptionButtons(row: OptionRow): TemplateResult {
  const { option, target, dispatch } = row;
  const move = (offset: number) => () =>
    dispatch(moveOption.create({ ...target, offset }));
  const quiet = { isIconOnly: true } as const;
  return html`${renderButton({
    ...quiet,
    label: TEXT.moveOptionUp,
    icon: "up",
    onClick: move(-1),
  })}
  ${renderButton({
    ...quiet,
    label: TEXT.moveOptionDown,
    icon: "down",
    onClick: move(1),
  })}
  ${renderButton({
    ...quiet,
    label: `${TEXT.deleteOption}: ${option.name}`,
    icon: "trash",
    variant: "danger",
    onClick: () => dispatch(deleteOption.create(target)),
  })}`;
}

function renderOption(
  option: SelectOption,
  property: PropertyDefinition,
  context: TableContext,
): TemplateResult {
  const target = {
    databaseId: context.model.database.id,
    propertyId: property.id,
    optionId: option.id,
  };
  const row = { option, target, dispatch: context.dispatch };
  const onName = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const name = event.target.value;
    context.dispatch(renameOption.create({ ...target, name }));
  };
  return html`<li class="database__filter" data-option-id=${option.id}>
    <span aria-hidden="true">${renderChip(option.name, option.color)}</span>
    <input
      class="database__field"
      type="text"
      aria-label=${TEXT.optionName}
      .value=${option.name}
      @change=${onName}
    />
    ${renderColorSelect(row)} ${renderOptionButtons(row)}
  </li>`;
}

export function renderOptionList(
  property: PropertyDefinition,
  context: TableContext,
): TemplateResult {
  const databaseId = context.model.database.id;
  const onAdd = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) {
      return;
    }
    const name = event.target.value;
    event.target.value = "";
    context.dispatch(
      addOption.create({ databaseId, propertyId: property.id, name }),
    );
  };
  return html`<fieldset class="database__options">
    <legend>${TEXT.options}</legend>
    <ul class="database__filters">
      ${(property.options ?? []).map((option) =>
        renderOption(option, property, context),
      )}
    </ul>
    <input
      class="database__field"
      type="text"
      aria-label=${TEXT.addOption}
      placeholder=${TEXT.addOption}
      @keydown=${onAdd}
    />
  </fieldset>`;
}
