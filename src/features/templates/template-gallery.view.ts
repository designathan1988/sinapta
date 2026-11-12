// The template gallery, as Notion's: the templates down the side, the one
// chosen previewed beside them, and the button that makes a page of it.
import "./template-gallery.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import type { SeedBlock } from "../onboarding/index.ts";
import {
  PAGE_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PageTemplate,
} from "./template-gallery.ts";
import { useTemplate } from "./template.commands.ts";

export const TEMPLATE_GALLERY_OVERLAY = "template-gallery";

const TEXT = COPY.templates;

function spanText(span: unknown): string {
  const isSpan = typeof span === "object" && span !== null && "text" in span;
  return isSpan && typeof span.text === "string" ? span.text : "";
}

function textOfSeed(seed: SeedBlock): string {
  const { text } = seed.props;
  return Array.isArray(text) ? text.map(spanText).join("") : "";
}

// A block of the template as the preview shows it: its type drawn by the
// stylesheet, its text or a line where text goes.
function renderSeed(seed: SeedBlock): TemplateResult {
  const text = textOfSeed(seed);
  return html`<p
    class="template-gallery__block"
    data-type=${seed.type}
    ?data-checked=${seed.props.isChecked === true}
  >
    ${text === "" ? html`<span class="template-gallery__blank"></span>` : text}
  </p>`;
}

function renderPreview(chosen: PageTemplate, dispatch: Dispatch) {
  return html`<section
    class="template-gallery__preview"
    aria-label=${TEXT.preview}
  >
    <div class="template-gallery__actions">
      ${renderButton({
        label: TEXT.use,
        variant: "primary",
        onClick: () => dispatch(useTemplate.create({ templateId: chosen.id })),
      })}
    </div>
    <div class="template-gallery__page">
      <p class="template-gallery__icon" aria-hidden="true">${chosen.icon}</p>
      <h3 class="template-gallery__title">${chosen.name}</h3>
      ${(chosen.seed.children ?? []).map(renderSeed)}
    </div>
  </section>`;
}

function renderItem(item: PageTemplate, place: ItemPlace): TemplateResult {
  return html`<li>
    <button
      type="button"
      class="template-gallery__item"
      data-index=${place.index}
      aria-pressed=${String(place.index === place.activeIndex)}
      @click=${() => {
        place.choose(place.index);
      }}
    >
      <span class="template-gallery__item-icon" aria-hidden="true"
        >${item.icon}</span
      >
      <span class="template-gallery__item-text">
        <span class="template-gallery__item-name">${item.name}</span>
        <span class="template-gallery__item-description"
          >${item.description}</span
        >
      </span>
    </button>
  </li>`;
}

interface ItemPlace {
  readonly index: number;
  readonly activeIndex: number;
  readonly choose: (index: number) => void;
}

// The arrow keys, Home and End move through the list, as Notion's.
function nextIndex(key: string, activeIndex: number): number | undefined {
  const last = PAGE_TEMPLATES.length - 1;
  const moves: Record<string, number> = {
    ArrowDown: Math.min(activeIndex + 1, last),
    ArrowUp: Math.max(activeIndex - 1, 0),
    Home: 0,
    End: last,
  };
  return moves[key];
}

function renderList(activeIndex: number, dispatch: Dispatch) {
  const choose = (index: number): void => {
    const overlay = { kind: TEMPLATE_GALLERY_OVERLAY, activeIndex: index };
    dispatch(openOverlay.create({ overlay }));
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    const next = nextIndex(event.key, activeIndex);
    if (next === undefined) return;
    event.preventDefault();
    choose(next);
    const list = event.currentTarget;
    if (list instanceof HTMLElement)
      list
        .querySelector<HTMLElement>(`[data-index="${String(next)}"]`)
        ?.focus();
  };
  return html`<div
    class="template-gallery__list"
    role="group"
    aria-label=${TEXT.list}
    @keydown=${onKeyDown}
  >
    ${TEMPLATE_CATEGORIES.map(
      (category) =>
        html`<section class="template-gallery__group">
          <h3 class="template-gallery__group-name">
            ${TEXT.categories[category]}
          </h3>
          <ul class="template-gallery__items">
            ${PAGE_TEMPLATES.map((item, index) =>
              item.category === category
                ? renderItem(item, { index, activeIndex, choose })
                : nothing,
            )}
          </ul>
        </section>`,
    )}
  </div>`;
}

export function renderTemplateGallery(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const activeIndex = Math.min(
    state.ui.overlay?.activeIndex ?? 0,
    PAGE_TEMPLATES.length - 1,
  );
  const chosen = PAGE_TEMPLATES[activeIndex];
  return renderDialog({
    title: TEXT.title,
    closeLabel: TEXT.close,
    variant: "search",
    content: html`<div class="template-gallery">
      <h2 class="template-gallery__heading">${TEXT.title}</h2>
      ${renderList(activeIndex, dispatch)}
      ${chosen === undefined ? nothing : renderPreview(chosen, dispatch)}
    </div>`,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
