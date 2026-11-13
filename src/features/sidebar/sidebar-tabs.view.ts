// The sidebar's tabs, as Notion's: a row under the search field, the tab
// shown with its icon and name, the others with their icon; and the
// Calendar tab's "Upcoming" list of dated pages.
import "./sidebar-tabs.css";
import { html, type TemplateResult } from "lit-html";
import {
  openHome,
  setActivePage,
  setSidebarTab,
  type AppState,
  type Dispatch,
  type SidebarTab,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { selectSidebarTab, selectUpcoming } from "./sidebar-tabs.selectors.ts";

const TEXT = COPY.sidebarTabs;

const TABS: readonly (readonly [SidebarTab, IconName])[] = [
  ["home", "home-solid"],
  ["calendar", "calendar-solid"],
];

export function renderSidebarTabs(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const shown = selectSidebarTab(state);
  return html`<div
    class="sidebar__tabs"
    role="tablist"
    aria-label=${TEXT.label}
  >
    ${TABS.map(
      ([tab, icon]) =>
        html`<button
          type="button"
          class="sidebar__tab"
          role="tab"
          aria-selected=${String(tab === shown)}
          aria-label=${TEXT[tab]}
          title=${TEXT[tab]}
          @click=${() => {
            dispatch(setSidebarTab.create({ tab }));
            // Home is a page too, as Notion's "Home" tab opens it.
            if (tab === "home") dispatch(openHome.create({}));
          }}
        >
          ${renderIcon(icon)}${tab === shown ? html`<span>${TEXT[tab]}</span>` : ""}
        </button>`,
    )}
  </div>`;
}

const DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

// "Upcoming": the managed views' pages from today on.
export function renderUpcoming(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const today = new Date().toLocaleDateString("en-CA");
  const items = selectUpcoming(state, today);
  return html`<section class="sidebar__section">
    <h2 class="sidebar__heading">${TEXT.upcoming}</h2>
    ${
      items.length === 0
        ? html`<p class="sidebar__empty">${TEXT.empty}</p>`
        : items.map(
            (item) =>
              html`<button
                type="button"
                class="sidebar__item"
                @click=${() =>
                  dispatch(setActivePage.create({ pageId: item.pageId }))}
              >
                <span class="sidebar__icon" aria-hidden="true"
                  >${item.icon ?? renderIcon("page")}</span
                >
                <span class="sidebar__title"
                  >${item.title === "" ? COPY.sidebar.untitled : item.title}</span
                >
                <span class="sidebar__date"
                  >${DAY.format(new Date(`${item.day}T00:00:00Z`))}</span
                >
              </button>`,
          )
    }
  </section>`;
}
