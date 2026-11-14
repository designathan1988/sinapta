// The controls a person can act on, read from the lit-html templates of
// the views: every tag that listens to an event, is a control by nature
// (button, link, field), has an interactive role, can be edited, dragged,
// focused, or carries a data-action that a container listener handles.
export interface Control {
  readonly tag: string;
  readonly kind: string;
  readonly attrs: string[];
  // A COPY path ("COPY.sidebar.addSubpage") or literal text, if any.
  readonly label: string | undefined;
  readonly events: string[];
  readonly file: string;
}

const CONTROL_TAGS = new Set([
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "summary",
]);
const ROLES =
  /role="(button|menuitem\w*|option|tab|treeitem|slider|separator|checkbox|switch|radio|link|combobox|textbox|gridcell|row)"/;

// The attribute text of the tag that starts at `start` ("<button"), up to
// the ">" that closes it, skipping any ">" inside ${…} expressions.
function attributesFrom(text: string, start: number): string {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (char === "$" && text[index + 1] === "{") {
      depth += 1;
      index += 1;
    } else if (char === "{" && depth > 0) depth += 1;
    else if (char === "}" && depth > 0) depth -= 1;
    else if (char === ">" && depth === 0) return text.slice(start, index);
  }
  return text.slice(start);
}

function labelOf(attrs: string): string | undefined {
  // The first COPY path of the expression, also of a conditional one.
  const copied = /aria-label=\$\{[^}]*?(COPY(?:\.\w+)+)/.exec(attrs);
  if (copied?.[1] !== undefined) return copied[1];
  const literal = /aria-label="([^"$]+)"/.exec(attrs);
  return literal?.[1];
}

function notable(attrs: string): string[] {
  const found: string[] = [];
  for (const match of attrs.matchAll(/\b(data-[a-z-]+)(?:="([^"$]*)")?/g)) {
    found.push(
      match[2] === undefined || match[2] === ""
        ? (match[1] ?? "")
        : `${match[1] ?? ""}=${match[2]}`,
    );
  }
  const role = /role="([a-z]+)"/.exec(attrs)?.[1];
  if (role !== undefined) found.push(`role=${role}`);
  for (const flag of ["draggable", "contenteditable", "popover", "tabindex"]) {
    if (attrs.includes(flag)) found.push(flag);
  }
  return found;
}

function isControl(tag: string, attrs: string, events: string[]): boolean {
  return (
    events.length > 0 ||
    CONTROL_TAGS.has(tag) ||
    ROLES.test(attrs) ||
    /contenteditable|draggable|data-action/.test(attrs)
  );
}

export function controlsIn(text: string, file: string): Control[] {
  if (!text.includes("html`")) return [];
  const controls: Control[] = [];
  for (const match of text.matchAll(/<([a-z][a-z0-9-]*)(?=[\s>])/g)) {
    const tag = match[1] ?? "";
    const attrs = attributesFrom(text, match.index + tag.length + 1);
    const events = [...attrs.matchAll(/@([a-z]+)=/g)].map((m) => m[1] ?? "");
    if (!isControl(tag, attrs, events)) continue;
    const kind = /class="([a-z0-9_-]+)/.exec(attrs)?.[1] ?? "";
    controls.push({
      tag,
      kind,
      attrs: notable(attrs),
      label: labelOf(attrs),
      events,
      file,
    });
  }
  return controls;
}
