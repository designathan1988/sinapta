// Text about the open page: when it was edited and how long it is.
export const PAGE_TEXT = {
  pageInfo: {
    edited: "Edited",
    justNow: "just now",
    minutesAgo: "m ago",
    hoursAgo: "h ago",
    words: { one: "word", other: "words" },
    characters: { one: "character", other: "characters" },
    favorite: "Favorite",
  },
  peek: {
    label: "Page peek",
    close: "Close",
    expand: "Open as full page",
    mode: "Peek mode",
    previous: "Previous page",
    next: "Next page",
    modes: { side: "Side peek", center: "Center peek", full: "Full page" },
  },
  home: {
    title: "Home",
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    recent: "Recently visited",
    noRecent: "No pages visited yet. Open a page and it shows here.",
    upcoming: "Upcoming",
    noUpcoming: "Nothing dated in the next 7 days.",
  },
} as const;
