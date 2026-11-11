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
import { renderMenu } from "../menu/index.ts";

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
  // rows such as a filter's.
  readonly variant?: "field" | "quiet";
}

export interface SelectContext {
  readonly overlay: OpenOverlay | null;
  readonly dispatch: Dispatch;
}

interface OpenState {
  readonly isOpen: boolean;
  readonly isChild: boolean;
  readonly query: string;
}

function openState(id: string, overlay: OpenOverlay | null): OpenState {
  if (overlay?.child?.anchorId === id) {
    return { isOpen: true, isChild: true, query: overlay.child.query ?? "" };
  }
  if (overlay?.kind === SELECT_OVERLAY && overlay.anchorId === id) {
    return { isOpen: true, isChild: false, query: overlay.query ?? "" };
  }
  const isChild = overlay !== null && overlay.kind !== SELECT_OVERLAY;
  return { isOpen: false, isChild, query: "" };
}

function toggle(props: SelectProps, context: SelectContext): void {
  const { dispatch, overlay } = context;
  const state = openState(props.id, overlay);
  if (state.isOpen) {
    dispatch(
      state.isChild ? closeChildOverlay.create({}) : closeOverlay.create({}),
    );
  } else if (state.isChild) {
    dispatch(openChildOverlay.create({ anchorId: props.id }));
  } else {
    const next = { kind: SELECT_OVERLAY, anchorId: props.id };
    dispatch(openOverlay.create({ overlay: next }));
  }
}

function renderList(
  props: SelectProps,
  context: SelectContext,
  state: OpenState,
): TemplateResult {
  const { dispatch } = context;
  const items = props.options.map((option) => ({
    ...option,
    check: "radio" as const,
    isChecked: option.value === props.value,
    onSelect: () => {
      props.onChoose(option.value);
    },
  }));
  const placeholder = props.searchPlaceholder;
  return renderMenu({
    label: props.label,
    role: "listbox",
    isChild: state.isChild,
    items,
    ...(placeholder !== undefined && {
      search: {
        placeholder,
        query: state.query,
        onQuery: (query) => dispatch(setOverlayQuery.create({ query })),
      },
    }),
    onClose: () =>
      dispatch(
        state.isChild ? closeChildOverlay.create({}) : closeOverlay.create({}),
      ),
  });
}

function renderCurrent(props: SelectProps): TemplateResult {
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
      aria-haspopup="listbox"
      aria-expanded=${String(state.isOpen)}
      aria-label=${props.label}
      @click=${() => {
        toggle(props, context);
      }}
    >
      ${renderCurrent(props)} ${renderIcon("chevron")}
    </button>
    ${state.isOpen ? renderList(props, context, state) : nothing}`;
}
