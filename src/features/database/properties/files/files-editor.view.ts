// Editing the files of a cell: each file with a button that removes it, a
// field for a link and a button that uploads files to keep. Uploaded
// files go to the asset store; only their ids enter commands.
import { html, type TemplateResult } from "lit-html";
import { safeWebAddress } from "../../../../model/index.ts";
import { addAssetUrls, type Dispatch } from "../../../../state/index.ts";
import { announce } from "../../../../ui/announcer/index.ts";
import { saveAssetFile } from "../../../../ui/asset/index.ts";
import { renderButton } from "../../../../ui/button/index.ts";
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
}

function without(editor: FilesEditor, index: number): void {
  const rest = editor.entries.filter((_, at) => at !== index);
  editor.onChange(rest.length === 0 ? undefined : rest);
}

// Changes inside the editor are its own: they must not reach a form that
// reads every field it holds, as a row's page does.
function onLink(event: Event, editor: FilesEditor): void {
  event.stopPropagation();
  if (!(event.target instanceof HTMLInputElement)) return;
  const field = event.target;
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

export function renderFilesEditor(editor: FilesEditor): TemplateResult {
  return html`<div class="database__options">
    <ul class="database__filters">
      ${editor.entries.map((file, index) => renderEntry(file, index, editor))}
    </ul>
    <input
      class="database__field"
      type="url"
      data-part="link"
      aria-label=${TEXT.addLink}
      placeholder=${TEXT.addLink}
      @change=${(event: Event) => {
        onLink(event, editor);
      }}
    />
    <label class="database__check">
      ${TEXT.uploadFile}
      <input
        type="file"
        data-part="upload"
        @change=${(event: Event) => {
          onUpload(event, editor);
        }}
      />
    </label>
  </div>`;
}
