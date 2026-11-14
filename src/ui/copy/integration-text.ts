// Notion's Connections and its integrations, in its English words.
export const INTEGRATION_TEXT = {
  integration: {
    section: "Connections",
    lead: "Integrations reach the pages you connect to them, through Pagecraft's API at /v1.",
    nameLabel: "Integration name",
    namePlaceholder: "e.g. Weekly report",
    create: "New integration",
    secretTitle: "Internal integration secret",
    secretHint:
      'Copy it now: it is shown only once. Send it as "Authorization: Bearer <secret>".',
    copy: "Copy",
    copied: "Secret copied",
    columnName: "Integration",
    columnPages: "Connected pages",
    remove: "Remove",
    none: "No integrations yet.",
    signedOut: "Sign in to a Pagecraft server to make integrations.",
    menu: "Connections",
    menuEmpty: "No integrations. Make one in Settings › Connections.",
  },
  thirdParty: {
    title: "Connect apps",
    lead: "Connect apps to use with Pagecraft. Each connects the way it lets anyone in: a channel's webhook, a calendar's private address, or links previewed as they are pasted.",
    connect: "Connect",
    disconnect: "Disconnect",
    connected: "Connected",
    signedOut: "Sign in to a Pagecraft server to connect apps.",
    kinds: {
      webhook: "Post the workspace's notices, such as mentions, to a channel.",
      calendar: "Show the calendar's coming events under Home's Upcoming.",
      mail: "Email a page from its menu, with the mail app on this device.",
      links: "Preview its links when they are pasted into a page.",
    },
    addressLabel: {
      webhook: "The channel's incoming webhook address",
      calendar: "The calendar's private address in iCal format",
    },
    addressPlaceholder: "https://…",
  },

  plans: {
    title: "Plans",
    lead: "Each plan sets how large an uploaded file can be and how far back page history goes. Upgrading charges the workspace's card for each member, every month.",
    current: "Current plan",
    upgrade: "Upgrade",
    downgrade: "Downgrade",
    prices: {
      free: "$0 per member / month",
      plus: "$12 per member / month",
      business: "$24 per member / month",
      enterprise: "Custom pricing",
    },
    ownersOnly: "Only the workspace's owners can change its plan.",
    signedOut: "Sign in to a Pagecraft server to choose a workspace's plan.",
    names: {
      free: "Free",
      plus: "Plus",
      business: "Business",
      enterprise: "Enterprise",
    },
    summaries: {
      free: "For one person's notes and projects.",
      plus: "For small teams working together.",
      business: "For growing teams and companies.",
      enterprise: "For whole organizations.",
    },
    upload: (megabytes: number) => `Files up to ${String(megabytes)} MB`,
    history: (days: number | null) =>
      days === null
        ? "All of page history"
        : `${String(days)} days of page history`,
  },
} as const;
