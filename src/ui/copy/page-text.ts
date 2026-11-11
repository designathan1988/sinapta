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
