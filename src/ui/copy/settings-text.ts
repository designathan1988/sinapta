// Text of the settings, as Notion's: sections listed on the left, rows
// of a name, a line that says what it does, and a control at the end.
export const SETTINGS_TEXT = {
  settings: {
    title: "Settings",
    close: "Close settings",
    sectionsLabel: "Settings sections",
    groupLabel: "Workspace",
    sections: {
      preferences: "Preferences",
      data: "Import and export",
    },
    appearance: "Appearance",
    appearanceHint: "Choose how Pagecraft looks on this device.",
    themeSystem: "Use system setting",
    themeLight: "Light",
    themeDark: "Dark",
    viewTabs: "View tabs",
    viewTabsHint: "Show a database's view tabs with their icon, name or both.",
    export: "Export workspace",
    exportHint: "Save everything in this browser as one file.",
    exportButton: "Export",
    import: "Import workspace",
    importButton: "Import",
    importHint:
      "Importing replaces everything in this browser with the file's content.",
    skipped: "items could not be read and were skipped.",
    importErrors: {
      "not-a-workspace":
        "This file could not be imported. It is not a Pagecraft workspace file.",
      "newer-version":
        "This file was made by a newer version of Pagecraft. Update the app, then import it again.",
      unreadable:
        "This file could not be read. Choose a workspace file exported from Pagecraft.",
    },
  },
} as const;
