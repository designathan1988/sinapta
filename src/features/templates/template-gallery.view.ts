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
import { PAGE_TEMPLATES, type PageTemplate } from "./template-gallery.ts";
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
    <div class="template-gallery__page">
      <p class="template-gallery__icon" aria-hidden="true">${chosen.icon}</p>
      <h3 class="template-gallery__title">${chosen.name}</h3>
      ${(chosen.seed.children ?? []).map(renderSeed)}
    </div>
    <div class="template-gallery__actions">
      ${renderButton({
        label: TEXT.use,
        variant: "primary",
        onClick: () => dispatch(useTemplate.create({ templateId: chosen.id })),
      })}
    </div>
  </section>`;
}

function renderList(activeIndex: number, dispatch: Dispatch) {
  const choose = (index: number) => (): void => {
    const overlay = { kind: TEMPLATE_GALLERY_OVERLAY, activeIndex: index };
    dispatch(openOverlay.create({ overlay }));
  };
  return html`<ul class="template-gallery__list" aria-label=${TEXT.list}>
    ${PAGE_TEMPLATES.map(
      (item, index) =>
        html`<li>
          <button
            type="button"
            class="template-gallery__item"
            aria-pressed=${String(index === activeIndex)}
            @click=${choose(index)}
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
        </li>`,
    )}
  </ul>`;
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
