// A person's initial in a circle, as Notion's panel marks who edited or
// viewed a page.
import { html, type TemplateResult } from "lit-html";

export function renderPersonMark(name: string): TemplateResult {
  return html`<span class="page-updates__avatar" aria-hidden="true"
    >${name.slice(0, 1).toUpperCase()}</span
  >`;
}
