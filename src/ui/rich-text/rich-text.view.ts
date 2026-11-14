import "./rich-text.css";
import { html, type TemplateResult } from "lit-html";
import type { DirectiveResult } from "lit-html/directive.js";
import { ref } from "lit-html/directives/ref.js";
import type { RichText } from "../../model/index.ts";
import { projectRichText } from "./rich-text-projection.ts";

export type RichTextTag = "p" | "h2" | "h3" | "h4" | "h5" | "div";

export interface RichTextOptions {
  readonly text: RichText;
  readonly tag: RichTextTag;
  // Shown while the text is empty and focused.
  readonly placeholder: string;
  // False on a page this person may only view or comment on.
  readonly isEditable?: boolean;
}

type Project = DirectiveResult;

// lit-html templates cannot take the tag name as a value, so there is one
// template per tag.
const TEMPLATES: Record<
  RichTextTag,
  (
    placeholder: string,
    project: Project,
    editable: "true" | "false",
  ) => TemplateResult
> = {
  p: (placeholder, project, editable) =>
    html`<p
      class="rich-text"
      contenteditable=${editable}
      data-text
      data-placeholder=${placeholder}
      ${project}
    ></p>`,
  h2: (placeholder, project, editable) =>
    html`<h2
      class="rich-text"
      contenteditable=${editable}
      data-text
      data-placeholder=${placeholder}
      ${project}
    ></h2>`,
  h3: (placeholder, project, editable) =>
    html`<h3
      class="rich-text"
      contenteditable=${editable}
      data-text
      data-placeholder=${placeholder}
      ${project}
    ></h3>`,
  h4: (placeholder, project, editable) =>
    html`<h4
      class="rich-text"
      contenteditable=${editable}
      data-text
      data-placeholder=${placeholder}
      ${project}
    ></h4>`,
  h5: (placeholder, project, editable) =>
    html`<h5
      class="rich-text"
      contenteditable=${editable}
      data-text
      data-placeholder=${placeholder}
      ${project}
    ></h5>`,
  div: (placeholder, project, editable) =>
    html`<div
      class="rich-text"
      contenteditable=${editable}
      data-text
      data-placeholder=${placeholder}
      ${project}
    ></div>`,
};

// One editable text element. Its content is projected, not bound.
export function renderRichText(options: RichTextOptions): TemplateResult {
  const project = ref((element) => {
    projectRichText(element, options.text);
  });
  const editable = options.isEditable === false ? "false" : "true";
  return TEMPLATES[options.tag](options.placeholder, project, editable);
}
