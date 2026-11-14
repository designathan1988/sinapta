import "./code.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { plainText } from "../../model/index.ts";
import {
  type AppState,
  type Dispatch,
  type OpenOverlay,
  selectIsEditable,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { afterRender } from "../../ui/focus/index.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import { renderSelect } from "../../ui/select/index.ts";
import {
  setCodeCaption,
  setCodeLanguage,
  toggleCodeWrap,
} from "./code.commands.ts";
import { paintCode } from "./code-highlight.ts";
import { CODE_LANGUAGES, type CodeBlock } from "./code.schema.ts";

const TEXT = COPY.codeBlock;

function languageOf(value: string) {
  return CODE_LANGUAGES.find((language) => language === value);
}

interface Coding {
  readonly dispatch: Dispatch;
  readonly overlay: OpenOverlay | null;
}

// The language, chosen from a searchable list, as in Notion.
function renderLanguage(block: CodeBlock, coding: Coding): TemplateResult {
  return renderSelect(
    {
      id: `code-${block.id}`,
      label: TEXT.language,
      value: block.props.language ?? "plain",
      options: CODE_LANGUAGES.map((language) => ({
        value: language,
        label: TEXT.languages[language],
      })),
      searchPlaceholder: TEXT.language,
      variant: "quiet",
      onChoose: (value) => {
        const language = languageOf(value);
        if (language === undefined) return;
        coding.dispatch(
          setCodeLanguage.create({ blockId: block.id, language }),
        );
      },
    },
    coding,
  );
}

function copyCode(block: CodeBlock): void {
  if (typeof navigator === "undefined" || !("clipboard" in navigator)) return;
  const text = plainText(block.props.text);
  navigator.clipboard.writeText(text).then(
    () => {
      announce(TEXT.copied);
    },
    () => undefined,
  );
}

// Shown over the code: its language, and buttons to wrap, copy and add a
// caption.
function renderBar(block: CodeBlock, coding: Coding): TemplateResult {
  const { dispatch } = coding;
  const blockId = block.id;
  const isWrapped = block.props.isWrapped === true;
  const hasCaption = block.props.caption !== undefined;
  return html`<div class="code__bar">
    ${renderLanguage(block, coding)}
    <span class="code__actions">
      <button
        type="button"
        class="code__action"
        aria-pressed=${String(isWrapped)}
        title=${TEXT.wrapLabel}
        @click=${() => dispatch(toggleCodeWrap.create({ blockId }))}
      >
        ${TEXT.wrap}
      </button>
      <button
        type="button"
        class="code__action"
        ?hidden=${hasCaption}
        @click=${() => dispatch(setCodeCaption.create({ blockId, caption: "" }))}
      >
        ${TEXT.caption}
      </button>
      <button
        type="button"
        class="code__action"
        title=${TEXT.copyLabel}
        @click=${() => {
          copyCode(block);
        }}
      >
        ${TEXT.copy}
      </button>
    </span>
  </div>`;
}

// A cleared caption goes away.
function renderCaption(block: CodeBlock, dispatch: Dispatch) {
  const { caption } = block.props;
  if (caption === undefined) return nothing;
  const onChange = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const value = event.target.value;
    const next = value === "" ? null : value;
    dispatch(setCodeCaption.create({ blockId: block.id, caption: next }));
  };
  return html`<input
    class="code__caption"
    type="text"
    aria-label=${TEXT.caption}
    placeholder=${TEXT.captionPlaceholder}
    .value=${plainText(caption)}
    @change=${onChange}
  />`;
}

export function renderCode(
  block: CodeBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  const { text, language = "plain", isWrapped = false } = block.props;
  // Painting waits for the text to be in the document.
  const paint = ref((element) => {
    if (element === undefined) return;
    afterRender(() => {
      paintCode(element, { language, text });
    });
  });
  return html`<div class="code" ?data-wrapped=${isWrapped}>
    <div class="code__frame">
      ${renderBar(block, { dispatch, overlay: state.ui.overlay })}
      <div class="code__body" spellcheck="false" ${paint}>
        ${renderRichText({
          isEditable: selectIsEditable(state, block.id),
          text,
          tag: "div",
          placeholder: COPY.blocks.code,
        })}
      </div>
    </div>
    ${renderCaption(block, dispatch)}
  </div>`;
}
