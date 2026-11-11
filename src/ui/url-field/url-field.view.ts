// A field for a web address, with an optional button to choose a file
// instead. Blocks that start empty and need an address use it.
import "./url-field.css";
import { html, nothing, type TemplateResult } from "lit-html";

export interface FileChoice {
  readonly label: string;
  // The `accept` attribute of the file input, such as "image/*".
  readonly accept: string;
  readonly onFile: (file: File) => void;
}

export interface UrlFieldOptions {
  readonly label: string;
  readonly placeholder: string;
  readonly submitLabel: string;
  readonly invalidMessage: string;
  readonly isValid: (value: string) => boolean;
  readonly onSubmit: (value: string) => void;
  readonly file?: FileChoice;
}

function submitted(event: SubmitEvent, options: UrlFieldOptions): void {
  event.preventDefault();
  const form = event.currentTarget;
  const input =
    form instanceof HTMLFormElement ? form.elements.namedItem("url") : null;
  if (!(input instanceof HTMLInputElement)) return;
  const isValid = options.isValid(input.value);
  input.setAttribute("aria-invalid", String(!isValid));
  if (isValid) options.onSubmit(input.value.trim());
}

function renderFileChoice(file: FileChoice): TemplateResult {
  const onChange = (event: Event): void => {
    const input = event.currentTarget;
    const chosen = input instanceof HTMLInputElement ? input.files?.[0] : null;
    if (chosen != null) file.onFile(chosen);
  };
  return html`<label class="url-field__file button" data-variant="quiet">
    ${file.label}
    <input
      class="visually-hidden"
      type="file"
      accept=${file.accept}
      @change=${onChange}
    />
  </label>`;
}

export function renderUrlField(options: UrlFieldOptions): TemplateResult {
  return html`<form
    class="url-field"
    @submit=${(event: SubmitEvent) => {
      submitted(event, options);
    }}
  >
    <input
      class="url-field__input"
      type="url"
      name="url"
      inputmode="url"
      aria-label=${options.label}
      placeholder=${options.placeholder}
    />
    <button type="submit" class="button" data-variant="primary">
      ${options.submitLabel}
    </button>
    ${options.file === undefined ? nothing : renderFileChoice(options.file)}
    <p class="url-field__hint">${options.invalidMessage}</p>
  </form>`;
}
