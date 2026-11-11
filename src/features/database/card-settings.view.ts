// How a board or a gallery shows its cards: their size, the picture above
// the title and, for a board, whether its columns take their group's
// color. One listener reads every control by its field.
import { html, nothing, type TemplateResult } from "lit-html";
import type { View } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import { setCardOptions, type CardOptions } from "./card.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

const SIZES: readonly View["cardSize"][] = ["small", "medium", "large"];
const PREVIEWS: readonly View["cardPreview"][] = ["none", "cover", "content"];

function cardOptions(
  control: HTMLSelectElement | HTMLInputElement,
): CardOptions | undefined {
  const { field } = control.dataset;
  if (field === "colorColumns" && control instanceof HTMLInputElement) {
    return { colorColumns: control.checked };
  }
  const cardSize = SIZES.find((item) => item === control.value);
  if (field === "cardSize" && cardSize !== undefined) return { cardSize };
  const cardPreview = PREVIEWS.find((item) => item === control.value);
  if (field === "cardPreview" && cardPreview !== undefined) {
    return { cardPreview };
  }
  return undefined;
}

function renderChoice<TValue extends string>(
  field: string,
  values: readonly TValue[],
  current: { readonly value: TValue; readonly labels: Record<TValue, string> },
): TemplateResult {
  return html`<select class="database__field" data-field=${field}>
    ${values.map(
      (value) =>
        html`<option value=${value} ?selected=${value === current.value}>
          ${current.labels[value]}
        </option>`,
    )}
  </select>`;
}

export function renderCardSettings(context: TableContext): TemplateResult {
  const { view } = context.model;
  const { cardSizes, cardPreviews } = COPY.database;
  const onChange = (event: Event): void => {
    const control = event.target;
    const isControl =
      control instanceof HTMLSelectElement ||
      control instanceof HTMLInputElement;
    const options = isControl ? cardOptions(control) : undefined;
    if (options === undefined) return;
    context.dispatch(setCardOptions.create({ viewId: view.id, options }));
  };
  return html`<div class="database__group-settings" @change=${onChange}>
    <label class="database__view-name">
      ${COPY.database.cardPreview}
      ${renderChoice("cardPreview", PREVIEWS, { value: view.cardPreview, labels: cardPreviews })}
    </label>
    <label class="database__view-name">
      ${COPY.database.cardSize}
      ${renderChoice("cardSize", SIZES, { value: view.cardSize, labels: cardSizes })}
    </label>
    ${
      view.type === "board"
        ? html`<label class="database__check">
            <input
              type="checkbox"
              data-field="colorColumns"
              .checked=${view.colorColumns}
            />
            ${COPY.database.colorColumns}
          </label>`
        : nothing
    }
  </div>`;
}
