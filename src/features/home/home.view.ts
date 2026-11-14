// Home: a greeting, the pages visited lately, the favorites, and the
// dates coming up.
import "./home.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  COVER_PRESETS,
  selectFavoritePages,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import {
  setActivePage,
  type AppState,
  type CalendarEventSummary,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { selectEditedLabel } from "../page-info/index.ts";
import {
  selectRecentPages,
  selectUpcoming,
  type UpcomingDate,
} from "./home.selectors.ts";

const TEXT = COPY.home;
const RECENT_SHOWN = 8;
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function greeting(hour: number): string {
  if (hour < 12) return TEXT.morning;
  return hour < 18 ? TEXT.afternoon : TEXT.evening;
}

// A color cover shows on the card's band; an image cover or none leaves
// the band plain.
function coverOf(page: PageBlock): string | undefined {
  const { cover } = page.props;
  return COVER_PRESETS.find((preset) => preset === cover);
}

// A card as Notion's: the page's cover as a band, its icon over the
// band's edge, its title and when it was edited.
function renderCard(
  page: PageBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const title = selectPageTitle(page) || COPY.sidebar.untitled;
  const edited = selectEditedLabel(state, page.id, new Date().toISOString());
  return html`<li>
    <button
      type="button"
      class="home__card"
      @click=${() => dispatch(setActivePage.create({ pageId: page.id }))}
    >
      <span
        class="home__card-cover"
        data-cover=${coverOf(page) ?? nothing}
      ></span>
      <span class="home__card-icon" aria-hidden="true"
        >${page.props.icon ?? renderIcon("page")}</span
      >
      <span class="home__card-title">${title}</span>
      <span class="home__card-time">${edited}</span>
    </button>
  </li>`;
}

function renderDate(item: UpcomingDate, dispatch: Dispatch): TemplateResult {
  const day = DAY_FORMAT.format(new Date(`${item.date}T00:00:00Z`));
  return html`<li>
    <button
      type="button"
      class="home__date"
      @click=${() => dispatch(setActivePage.create({ pageId: item.pageId }))}
    >
      <span class="home__date-day">${day}</span>
      <span class="home__card-title"
        >${item.title || COPY.sidebar.untitled}</span
      >
      <span class="home__date-property">${item.propertyName}</span>
    </button>
  </li>`;
}

// A coming event of a connected calendar (Settings › Connections), with
// its day and time; it opens nothing, as it lives in that calendar.
function renderEvent(event: CalendarEventSummary): TemplateResult {
  const day = DAY_FORMAT.format(new Date(`${event.date}T00:00:00Z`));
  return html`<li class="home__date" data-event>
    <span class="home__date-day">${day}</span>
    <span class="home__card-title">${event.title}</span>
    <span class="home__date-property">${event.time ?? TEXT.allDay}</span>
  </li>`;
}

function renderUpcoming(
  upcoming: readonly UpcomingDate[],
  events: readonly CalendarEventSummary[],
  dispatch: Dispatch,
) {
  if (upcoming.length === 0 && events.length === 0) {
    return html`<p class="home__empty">${TEXT.noUpcoming}</p>`;
  }
  return html`<ul class="home__dates">
    ${upcoming.map((item) => renderDate(item, dispatch))}
    ${events.map(renderEvent)}
  </ul>`;
}

// The favorites, as cards; nothing while there are none.
function renderFavorites(state: AppState, dispatch: Dispatch) {
  const favorites = selectFavoritePages(state).slice(0, RECENT_SHOWN);
  if (favorites.length === 0) return nothing;
  return html`<section class="home__section" aria-labelledby="home-favorites">
    <h2 class="home__heading" id="home-favorites">${TEXT.favorites}</h2>
    <ul class="home__cards">
      ${favorites.map((page) => renderCard(page, state, dispatch))}
    </ul>
  </section>`;
}

export function renderHome(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA");
  const recent = selectRecentPages(state).slice(0, RECENT_SHOWN);
  const upcoming = selectUpcoming(state, today);
  return html`<article class="home">
    <h1 class="home__greeting">${greeting(now.getHours())}</h1>
    <section class="home__section" aria-labelledby="home-recent">
      <h2 class="home__heading" id="home-recent">${TEXT.recent}</h2>
      ${
        recent.length === 0
          ? html`<p class="home__empty">${TEXT.noRecent}</p>`
          : html`<ul class="home__cards">
              ${recent.map((page) => renderCard(page, state, dispatch))}
            </ul>`
      }
    </section>
    ${renderFavorites(state, dispatch)}
    <section class="home__section" aria-labelledby="home-upcoming">
      <h2 class="home__heading" id="home-upcoming">${TEXT.upcoming}</h2>
      ${renderUpcoming(upcoming, state.persistence.sync.calendarEvents, dispatch)}
    </section>
  </article>`;
}
