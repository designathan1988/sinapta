// Notion's AI Meeting Notes block: its title, Start or Stop transcribing,
// the words heard as they come, then the AI's summary and action items.
// Where the browser cannot listen, the transcript is typed or pasted.
import "./meeting-notes.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import {
  setMeetingTitle,
  setTranscript,
  startTranscribing,
  stopTranscribing,
} from "./meeting-notes.commands.ts";
import type { MeetingNotesBlock } from "./meeting-notes.schema.ts";

const TEXT = COPY.meeting;

// Start, Resume or Stop transcribing; "Summarizing…" while the AI works.
function renderAction(block: MeetingNotesBlock, dispatch: Dispatch) {
  const { status, transcript } = block.props;
  const blockId = block.id;
  const isRecording = status === "recording";
  const startWords = transcript === "" ? TEXT.start : TEXT.resume;
  return html`${
    status === "summarizing"
      ? html`<span class="meeting-notes__state" role="status"
          >${TEXT.summarizing}</span
        >`
      : html`<button
          type="button"
          class="meeting-notes__button"
          ?data-recording=${isRecording}
          @click=${() =>
            dispatch(
              isRecording
                ? stopTranscribing.create({ blockId })
                : startTranscribing.create({ blockId }),
            )}
        >
          ${isRecording ? TEXT.stop : startWords}
        </button>`
  }`;
}

function renderHead(block: MeetingNotesBlock, dispatch: Dispatch) {
  const blockId = block.id;
  return html`<div class="meeting-notes__head">
    <span class="meeting-notes__mark" aria-hidden="true"
      >${renderIcon("sparkles")}</span
    >
    <input
      class="meeting-notes__title"
      aria-label=${TEXT.titleLabel}
      placeholder=${TEXT.untitled}
      .value=${block.props.title}
      @change=${(event: Event) => {
        if (!(event.currentTarget instanceof HTMLInputElement)) return;
        const title = event.currentTarget.value;
        dispatch(setMeetingTitle.create({ blockId, title }));
      }}
    />
    ${renderAction(block, dispatch)}
  </div>`;
}

// Where the browser cannot listen: the transcript typed or pasted, and
// Summarize.
function renderTyped(block: MeetingNotesBlock, dispatch: Dispatch) {
  const { transcript } = block.props;
  const blockId = block.id;
  return html`<p class="meeting-notes__hint">${TEXT.transcriptHint}</p>
    <textarea
      class="meeting-notes__field"
      aria-label=${TEXT.transcript}
      rows="4"
      .value=${transcript}
      @change=${(event: Event) => {
        if (!(event.currentTarget instanceof HTMLTextAreaElement)) return;
        const text = event.currentTarget.value;
        dispatch(setTranscript.create({ blockId, text }));
      }}
    ></textarea>
    <button
      type="button"
      class="meeting-notes__button"
      @click=${() => dispatch(stopTranscribing.create({ blockId }))}
    >
      ${TEXT.summarize}
    </button>`;
}

// The words heard; typed instead where the browser cannot listen.
function renderTranscript(
  block: MeetingNotesBlock,
  dispatch: Dispatch,
  canListen: boolean,
) {
  const { transcript, status } = block.props;
  const words = transcript === "" ? TEXT.noSpeech : transcript;
  return html`<section class="meeting-notes__part">
    <h4 class="meeting-notes__label">
      ${TEXT.transcript}
      ${
        status === "recording"
          ? html`<span class="meeting-notes__live">${TEXT.listening}</span>`
          : nothing
      }
    </h4>
    ${
      canListen
        ? html`<p class="meeting-notes__text">${words}</p>`
        : renderTyped(block, dispatch)
    }
  </section>`;
}

function renderSummary(block: MeetingNotesBlock) {
  const { summary, actionItems } = block.props;
  if (summary === "" && actionItems === "") return nothing;
  return html`<section class="meeting-notes__part">
      <h4 class="meeting-notes__label">${TEXT.summary}</h4>
      <p class="meeting-notes__text">${summary}</p>
    </section>
    <section class="meeting-notes__part">
      <h4 class="meeting-notes__label">${TEXT.actionItems}</h4>
      <p class="meeting-notes__text">${actionItems}</p>
    </section>`;
}

export function renderMeetingNotes(
  block: MeetingNotesBlock,
  dispatch: Dispatch,
  canListen: boolean,
): TemplateResult {
  return html`<div class="meeting-notes" contenteditable="false">
    ${renderHead(block, dispatch)} ${renderSummary(block)}
    ${renderTranscript(block, dispatch, canListen)}
  </div>`;
}
