// The view settings' "Linked events", as Notion's: with no calendar
// connected, a card that says why to connect one and "Connect calendar"
// (Settings › Connections); with one, its coming meetings, each of which
// files its notes here as a new page on that day, opened at once; and
// "Workspace filing settings".
import { html, type TemplateResult } from "lit-html";
import { appSpec } from "../../../model/index.ts";
import {
  openOverlay,
  type CalendarEventSummary,
} from "../../../state/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderIcon } from "../../../ui/icon/index.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { SETTINGS_OVERLAY_KIND } from "../../../ui/shortcuts/index.ts";
import { addRow } from "../row.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { panelRow, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;
const CONNECTIONS = { kind: SETTINGS_OVERLAY_KIND, anchorId: "connections" };

function renderConnect(context: TableContext): TemplateResult {
  return html`<div class="view-settings__upsell">
    <span class="view-settings__upsell-icon">${renderIcon("calendar")}</span>
    <p class="view-settings__upsell-title">${TEXT.connectCalendarTitle}</p>
    <p class="view-settings__note">${TEXT.connectCalendarNote}</p>
    <button
      type="button"
      class="button"
      data-variant="primary"
      data-autofocus
      @click=${() =>
        context.dispatch(openOverlay.create({ overlay: CONNECTIONS }))}
    >
      ${TEXT.connectCalendar}
    </button>
  </div>`;
}

function whenOf(event: CalendarEventSummary): string {
  return event.time === null ? event.date : `${event.date} ${event.time}`;
}

// A meeting's notes filed here: a page named after it, dated its day in
// the database's first date property, opened.
function meetingItem(
  context: TableContext,
  event: CalendarEventSummary,
): MenuEntry {
  const { model, dispatch } = context;
  const date = model.database.props.properties.find(
    (property) => property.type === "date",
  );
  return {
    label: event.title,
    icon: "calendar",
    value: whenOf(event),
    onSelect: () =>
      dispatch(
        addRow.create({
          databaseId: model.database.id,
          title: event.title,
          opensPage: true,
          ...(date !== undefined && {
            values: { [date.id]: { start: event.date } },
          }),
        }),
      ),
  };
}

export function linkedEventsPanel(context: TableContext): SettingsPanel {
  const { apps, calendarEvents } = context.state.persistence.sync;
  const hasCalendar = apps.some((app) => appSpec(app.app)?.kind === "calendar");
  if (!hasCalendar)
    return {
      title: TEXT.linkedEvents,
      back: null,
      items: [],
      lead: renderConnect(context),
    };
  const settings: MenuEntry = {
    label: TEXT.filingSettings,
    icon: "sliders",
    onSelect: () =>
      context.dispatch(openOverlay.create({ overlay: CONNECTIONS })),
  };
  const meetings = calendarEvents.map((event) => meetingItem(context, event));
  return {
    title: TEXT.linkedEvents,
    back: null,
    lead: html`<p class="view-settings__note" data-lead>
      ${meetings.length === 0 ? TEXT.noMeetings : TEXT.chooseMeeting}
    </p>`,
    items: [...meetings, { kind: "divider" }, settings],
  };
}

export function linkedEventsRow(context: TableContext): MenuEntry {
  return panelRow(
    context,
    { label: TEXT.linkedEvents, icon: "calendar" },
    "linked-events",
  );
}
