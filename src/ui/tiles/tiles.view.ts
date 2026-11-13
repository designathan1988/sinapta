// Pictured tiles: a choice drawn as tiles, each a picture over its name,
// three to a row, the chosen one ringed in blue, as Notion's layout and
// number "Show as" choices. Inside a menu each tile is a stop of the
// arrows, as its rows are.
import "./tiles.css";
import { html, type TemplateResult } from "lit-html";

export interface Tile<T extends string> {
  readonly value: T;
  readonly picture: TemplateResult | string;
  readonly label: string;
}

export interface TilesProps<T extends string> {
  readonly label: string;
  readonly tiles: readonly Tile<T>[];
  readonly current: T;
  readonly onPick: (value: T) => void;
}

export function renderTiles<T extends string>(
  props: TilesProps<T>,
): TemplateResult {
  return html`<div class="tiles" role="group" aria-label=${props.label}>
    ${props.tiles.map(
      (tile) =>
        html`<button
          type="button"
          class="tiles__tile"
          data-arrow-stop
          aria-pressed=${String(tile.value === props.current)}
          @click=${() => {
            props.onPick(tile.value);
          }}
        >
          <span class="tiles__picture">${tile.picture}</span>
          <span class="tiles__label">${tile.label}</span>
        </button>`,
    )}
  </div>`;
}
