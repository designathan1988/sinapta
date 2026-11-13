// The parts of Notion's emoji picker for a reaction: "Filter…" with its
// magnifier and the skin tone hand above the grid, the tones to choose
// from, and the bar of categories under it that jumps to each group.
import { html, nothing, type TemplateResult } from "lit-html";
import { SKIN_TONES, type SkinTone } from "../../model/index.ts";
import { COPY } from "../copy.ts";
import { renderIcon, type IconName } from "../icon/index.ts";
import { withSkinTone } from "./emoji-tone.ts";

export interface ReactionParts {
  readonly query: string;
  readonly onQuery: (query: string) => void;
  readonly tone: SkinTone;
  readonly isChoosingTone: boolean;
  readonly onToggleTones: () => void;
  readonly onTone: (tone: SkinTone) => void;
}

const HAND = "✋";

const GROUP_ICONS: Readonly<Record<string, IconName>> = {
  People: "smile",
  "Animals & Nature": "leaf",
  "Food & Drink": "food",
  Activity: "ball",
  "Travel & Places": "plane",
  Objects: "bulb",
  Symbols: "symbols",
  Flags: "flag",
};

export function renderReactionBar(parts: ReactionParts): TemplateResult {
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      parts.onQuery(event.target.value);
    }
  };
  return html`<div class="emoji__bar">
    <label class="emoji__filter">
      ${renderIcon("search")}
      <input
        type="text"
        aria-label=${COPY.emoji.filter}
        placeholder=${COPY.emoji.filter}
        autocomplete="off"
        .value=${parts.query}
        data-autofocus
        @input=${onInput}
      />
    </label>
    <button
      type="button"
      class="emoji__tone"
      aria-label=${COPY.emoji.skinTone}
      title=${COPY.emoji.skinTone}
      aria-expanded=${String(parts.isChoosingTone)}
      @click=${parts.onToggleTones}
    >
      ${withSkinTone(HAND, parts.tone)}
    </button>
  </div>`;
}

// The six hands, the chosen one pressed, while the hand is open.
export function renderTones(
  parts: ReactionParts,
): TemplateResult | typeof nothing {
  if (!parts.isChoosingTone) return nothing;
  return html`<div
    class="emoji__tones"
    role="group"
    aria-label=${COPY.emoji.skinTone}
  >
    ${SKIN_TONES.map(
      (tone) =>
        html`<button
          type="button"
          class="emoji__choice"
          aria-pressed=${String(tone === parts.tone)}
          @click=${() => {
            parts.onTone(tone);
          }}
        >
          ${withSkinTone(HAND, tone)}
        </button>`,
    )}
  </div>`;
}

// Brings a group's heading to the top of the grid it scrolls in.
function jumpTo(event: Event, group: string): void {
  if (!(event.currentTarget instanceof Element)) return;
  const picker = event.currentTarget.closest(".emoji");
  const heading = [...(picker?.querySelectorAll("[data-group]") ?? [])].find(
    (element) => element.getAttribute("data-group") === group,
  );
  heading?.scrollIntoView({ block: "start" });
}

function renderCategory(group: string, icon: IconName): TemplateResult {
  const label = COPY.emoji.jumpTo(group);
  return html`<button
    type="button"
    class="emoji__category"
    aria-label=${label}
    title=${group}
    @click=${(event: Event) => {
      jumpTo(event, group);
    }}
  >
    ${renderIcon(icon)}
  </button>`;
}

// Recent first, empty until something is chosen, then each group.
export function renderCategories(groups: readonly string[]): TemplateResult {
  return html`<div class="emoji__categories">
    <button
      type="button"
      class="emoji__category"
      aria-label=${COPY.emoji.jumpTo(COPY.emoji.recent)}
      title=${COPY.emoji.recent}
      disabled
    >
      ${renderIcon("clock")}
    </button>
    ${groups.map((group) => renderCategory(group, GROUP_ICONS[group] ?? "smile"))}
  </div>`;
}
