// Every string the user can see or hear. Voice rules: docs/design-system.md.
export const PRODUCT_NAME = "Pagecraft";

export const COPY = {
  shell: {
    skipToContent: "Skip to content",
    pagesLabel: "Pages",
    hideSidebar: "Hide sidebar",
    showSidebar: "Show sidebar",
    resizeSidebar: "Resize sidebar",
    emptyWorkspace: "No pages yet. Create a page to start writing.",
    openSettings: "Settings",
  },
  saveStatus: {
    idle: "",
    saving: "Saving",
    saved: "Saved",
    failed: "Not saved",
  },
  settings: {
    title: "Settings",
    close: "Close settings",
    themeLegend: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
  },
} as const;
