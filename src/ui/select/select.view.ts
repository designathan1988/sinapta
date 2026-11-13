// A control that shows the current choice and opens the list of choices,
// in place of a browser select: Notion's menu, icons and chips, a check
// on the chosen option and, when asked, a search field. Opened inside
// another overlay, its list is that overlay's child; otherwise the list
// is the overlay.
import "./select.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeChildOverlay,
  closeOverlay,
  openChildOverlay,
  openOverlay,
  setOverlayQuery,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import { renderChip } from "../chip/index.ts";
import { renderIcon, type IconName } from "../icon/index.ts";
import { renderMenu, type MenuEntry, type MenuItem } from "../menu/index.ts";
import { childDepthOf, childIndexOf } from "../overlay/index.ts";

export const SELECT_OVERLAY = "select";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly color?: string;
  readonly description?: string;
}

export interface SelectProps {
  // Names the control on the page; two selects never share it.
  readonly id: string;
  // What is chosen, read with the value by assistive tools.
  readonly label: string;
  readonly value: string | undefined;
  readonly options: readonly SelectOption[];
  readonly onChoose: (value: string) => void;
  // Shown while nothing is chosen.
  readonly placeholder?: string;
  // Gives the list a search field with this placeholder.
  readonly searchPlaceholder?: string;
  // "field" is boxed, for forms; "quiet" is text with a chevron, for
  // rows such as a filter's; "row" is a menu row, its label then its
  // value, whose list opens beside the menu as Notion's settings do.
  // "icon" shows only what `display` gives, as a toolbar button.
  readonly variant?: "field" | "quiet" | "row" | "icon";
  // A menu to open in place of the option list: entries such as groups
  // that open submenus, as Notion's Calculate, and fields above them, as
  // a date's; the options then only name the current choice.
  readonly menu?: SelectMenu;
  // What the control shows in place of the chosen option, such as the
  // chips of several options or a date.
  readonly display?: TemplateResult;
  // A long list kept short and scrolled, as Notion's list of times.
  readonly isShort?: boolean;
}

export interface SelectMenu {
  readonly lead?: TemplateResult;
  readonly items: readonly MenuEntry[];
}

export interface SelectContext {
  readonly overlay: OpenOverlay | null;
  readonly dispatch: Dispatch;
}

interface OpenState {
  readonly isOpen: boolean;
  readonly isChild: boolean;
  // Where its list is among the overlay's open lists, when it is one.
  readonly index: number;
  readonly query: string;
}

function openState(id: string, overlay: OpenOverlay | null): OpenState {
  const index = childIndexOf(overlay, id);
  if (overlay === null)
    return { isOpen: false, isChild: false, index, query: "" };
  if (index !== -1) {
    const query = overlay.children?.[index]?.query ?? "";
    return { isOpen: true, isChild: true, index, query };
  }
  const isOwn = overlay.kind === SELECT_OVERLAY;
  const isOpen = isOwn && overlay.anchorId === id;
  const query = isOpen ? (overlay.query ?? "") : "";
  return { isOpen, isChild: !isOwn, index, query };
}

function closeList(state: OpenState, dispatch: Dispatch): void {
  dispatch(
    state.isChild
      ? closeChildOverlay.create({ depth: state.index })
      : closeOverlay.create({}),
  );
}

// Inside an overlay the list opens beside the lists the control sits in.
function toggle(
  props: SelectProps,
  context: SelectContext,
  control: Element,
): void {
  const { dispatch, overlay } = context;
  const state = openState(props.id, overlay);
  if (state.isOpen) closeList(state, dispatch);
  else if (state.isChild) {
    const depth = childDepthOf(control);
    dispatch(openChildOverlay.create({ anchorId: props.id, depth }));
  } else {
    const next = { kind: SELECT_OVERLAY, anchorId: props.id };
    dispatch(openOverlay.create({ overlay: next }));
  }
}

interface Opened {
  readonly props: SelectProps;
  readonly context: SelectContext;
  readonly state: OpenState;
}

// A menu in place of the options, its submenus beside it.
function renderEntries(
  menu: SelectMenu,
  { props, context, state }: Opened,
): TemplateResult {
  return renderMenu({
    label: props.label,
    isChild: state.isChild,
    items: menu.items,
    ...(menu.lead !== undefined && { lead: menu.lead }),
    context,
    onClose: () => {
      closeList(state, context.dispatch);
    },
  });
}

function renderList(
  props: SelectProps,
  context: SelectContext,
  state: OpenState,
): TemplateResult {
  const { dispatch } = context;
  if (props.menu !== undefined) {
    return renderEntries(props.menu, { props, context, state });
  }
  // An option's value is what is chosen, never shown: the row shows its
  // label, icon, chip and description.
  const items = props.options.map(({ value, ...shown }): MenuItem => ({
    ...shown,
    check: "radio",
    isChecked: value === props.value,
    onSelect: () => {
      props.onChoose(value);
    },
  }));
  const placeholder = props.searchPlaceholder;
  return renderMenu({
    label: props.label,
    role: "listbox",
    isChild: state.isChild,
    ...(props.variant === "row" && { placement: "beside" as const }),
    ...(props.isShort === true && { isShort: true }),
    items,
    ...(placeholder !== undefined && {
      search: {
        placeholder,
        query: state.query,
        onQuery: (query) => dispatch(setOverlayQuery.create({ query })),
      },
    }),
    onClose: () => {
      closeList(state, dispatch);
    },
  });
}

function renderCurrent(props: SelectProps): TemplateResult {
  if (props.display !== undefined) {
    return html`<span class="select__value">${props.display}</span>`;
  }
  const current = props.options.find((option) => option.value === props.value);
  if (current === undefined) {
    return html`<span class="select__value" data-placeholder
      >${props.placeholder ?? ""}</span
    >`;
  }
  return html`${current.icon === undefined ? nothing : renderIcon(current.icon)}
    <span class="select__value"
      >${current.color === undefined ? current.label : renderChip(current.label, current.color)}</span
    >`;
}

export function renderSelect(
  props: SelectProps,
  context: SelectContext,
): TemplateResult {
  const state = openState(props.id, context.overlay);
  return html`<button
      type="button"
      class="select"
      data-variant=${props.variant ?? "field"}
      ?data-overlay-anchor=${!state.isChild}
      ?data-overlay-child-anchor=${state.isChild}
      id=${`select-${props.id}`}
      aria-haspopup="listbox"
      aria-expanded=${String(state.isOpen)}
      aria-labelledby=${`select-${props.id}-name select-${props.id}`}
      @click=${(event: Event) => {
        if (event.currentTarget instanceof Element)
          toggle(props, context, event.currentTarget);
      }}
    >
      ${
        props.variant === "row"
          ? html`<span class="select__label" id=${`select-${props.id}-name`}
              >${props.label}</span
            >`
          : html`<span
              class="select__name"
              id=${`select-${props.id}-name`}
              hidden
              >${props.label}</span
            >`
      }
      ${renderCurrent(props)}
      ${props.variant === "icon" ? nothing : renderIcon("chevron")}
    </button>
    ${state.isOpen ? renderList(props, context, state) : nothing}`;
}
