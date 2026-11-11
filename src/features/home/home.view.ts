// Home: a greeting, the pages visited lately, and the dates coming up.
import "./home.css";
import { html, type TemplateResult } from "lit-html";
import { selectPageTitle, type PageBlock } from "../../blocks/page/index.ts";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
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

function renderCard(page: PageBlock, dispatch: Dispatch): TemplateResult {
  const title = selectPageTitle(page) || COPY.sidebar.untitled;
  return html`<li>
    <button
      type="button"
      class="home__card"
      @click=${() => dispatch(setActivePage.create({ pageId: page.id }))}
    >
      <span class="home__card-icon" aria-hidden="true"
        >${page.props.icon ?? renderIcon("page")}</span
      >
      <span class="home__card-title">${title}</span>
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
              ${recent.map((page) => renderCard(page, dispatch))}
            </ul>`
      }
    </section>
    <section class="home__section" aria-labelledby="home-upcoming">
      <h2 class="home__heading" id="home-upcoming">${TEXT.upcoming}</h2>
      ${
        upcoming.length === 0
          ? html`<p class="home__empty">${TEXT.noUpcoming}</p>`
          : html`<ul class="home__dates">
              ${upcoming.map((item) => renderDate(item, dispatch))}
            </ul>`
      }
    </section>
  </article>`;
}
