// Editing the files of a cell, as Notion's: each file with a button that
// removes it, then the tabs Upload (a button that chooses a file, or
// Ctrl+V to paste an image) and Link (a field and its Link button).
// Uploaded files go to the asset store; only their ids enter commands.
import "./files-editor.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { safeWebAddress } from "../../../../model/index.ts";
import { addAssetUrls, type Dispatch } from "../../../../state/index.ts";
import { announce } from "../../../../ui/announcer/index.ts";
import { saveAssetFile } from "../../../../ui/asset/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
import { focusOnce } from "../../../../ui/focus/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderFilesCell } from "./files-cell.view.ts";
import { nameOfLink, type FileEntry } from "./files-value.ts";

const TEXT = COPY.database;

export interface FilesEditor {
  readonly entries: readonly FileEntry[];
  readonly assetUrls: Readonly<Record<string, string>>;
  // Undefined when the last file is removed.
  readonly onChange: (entries: readonly FileEntry[] | undefined) => void;
  readonly dispatch: Dispatch;
  // The tab shown, and how another is chosen; without one, as on a row's
  // page, both show.
  readonly tab?: FilesTab;
  readonly onTab?: (tab: FilesTab) => void;
}

export type FilesTab = "upload" | "link";

function without(editor: FilesEditor, index: number): void {
  const rest = editor.entries.filter((_, at) => at !== index);
  editor.onChange(rest.length === 0 ? undefined : rest);
}

// The link typed, added on Enter or Link. Changes inside the editor are
// its own: they must not reach a form that reads every field it holds,
// as a row's page does.
function onLink(event: SubmitEvent, editor: FilesEditor): void {
  event.preventDefault();
  event.stopPropagation();
  const form = event.currentTarget;
  const field =
    form instanceof HTMLFormElement ? form.elements.namedItem("link") : null;
  if (!(field instanceof HTMLInputElement)) return;
  const url = safeWebAddress(field.value);
  field.setAttribute("aria-invalid", String(url === undefined));
  if (url === undefined) {
    announce(TEXT.invalidLink);
    return;
  }
  field.value = "";
  editor.onChange([...editor.entries, { name: nameOfLink(url), url }]);
}

async function keep(file: File, editor: FilesEditor): Promise<void> {
  const result = await saveAssetFile(file, file.name);
  if (!result.ok) {
    announce(COPY.blocks.assetErrors[result.error]);
    return;
  }
  editor.dispatch(addAssetUrls.create({ urls: { [result.id]: result.url } }));
  editor.onChange([...editor.entries, { name: file.name, assetId: result.id }]);
}

// An image pasted with Ctrl+V is uploaded as a file.
function onPaste(event: ClipboardEvent, editor: FilesEditor): void {
  const [file] = event.clipboardData?.files ?? [];
  if (file === undefined) return;
  event.preventDefault();
  void keep(file, editor);
}

function onUpload(event: Event, editor: FilesEditor): void {
  event.stopPropagation();
  if (!(event.target instanceof HTMLInputElement)) return;
  const [file] = event.target.files ?? [];
  if (file !== undefined) void keep(file, editor);
}

function renderEntry(
  file: FileEntry,
  index: number,
  editor: FilesEditor,
): TemplateResult {
  return html`<li class="database__filter">
    ${renderFilesCell([file], { assetUrls: editor.assetUrls })}
    <span data-file-index=${String(index)}>
      ${renderButton({
        label: `${TEXT.removeFile}: ${file.name}`,
        icon: "close",
        isIconOnly: true,
        onClick: () => {
          without(editor, index);
        },
      })}
    </span>
  </li>`;
}

function renderUpload(editor: FilesEditor): TemplateResult {
  return html`<div class="files__panel">
    <label class="button files__upload" data-variant="primary">
      ${TEXT.uploadFile}
      <input
        class="visually-hidden"
        type="file"
        data-part="upload"
        @change=${(event: Event) => {
          onUpload(event, editor);
        }}
      />
    </label>
    <p class="files__hint">${TEXT.pasteImage}</p>
  </div>`;
}

// Chosen as a tab, its field takes the focus, as Notion's.
function renderLink(editor: FilesEditor): TemplateResult {
  return html`<form
    class="files__panel"
    @submit=${(event: SubmitEvent) => {
      onLink(event, editor);
    }}
  >
    <input
      class="database__field"
      type="url"
      name="link"
      data-part="link"
      aria-label=${TEXT.addLink}
      placeholder=${TEXT.pasteLink}
      ${ref(editor.tab === "link" ? focusOnce : undefined)}
      @change=${(event: Event) => {
        event.stopPropagation();
      }}
    />
    <button type="submit" class="button files__upload" data-variant="primary">
      ${TEXT.linkFile}
    </button>
  </form>`;
}

function renderTabs(editor: FilesEditor, tab: FilesTab): TemplateResult {
  const choose = (next: FilesTab) => (): void => editor.onTab?.(next);
  return html`<div class="files__tabs" role="tablist">
    ${(["upload", "link"] as const).map(
      (each) =>
        html`<button
          type="button"
          class="files__tab"
          role="tab"
          aria-selected=${String(each === tab)}
          ?data-autofocus=${each === tab}
          @click=${choose(each)}
        >
          ${TEXT.filesTabs[each]}
        </button>`,
    )}
  </div>`;
}

export function renderFilesEditor(editor: FilesEditor): TemplateResult {
  const { tab } = editor;
  return html`<div
    class="files__editor"
    @paste=${(event: ClipboardEvent) => {
      onPaste(event, editor);
    }}
  >
    ${
      editor.entries.length === 0
        ? nothing
        : html`<ul class="database__filters">
            ${editor.entries.map((file, index) => renderEntry(file, index, editor))}
          </ul>`
    }
    ${
      tab === undefined
        ? html`${renderUpload(editor)}${renderLink(editor)}`
        : html`${renderTabs(editor, tab)}
          ${tab === "upload" ? renderUpload(editor) : renderLink(editor)}`
    }
  </div>`;
}
