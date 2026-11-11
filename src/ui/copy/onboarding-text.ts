// The pages a first visit starts with: a short tour, and a database to try
// the views on. Voice rules: docs/design-system.md.
export const ONBOARDING_TEXT = {
  onboarding: {
    title: "Getting started",
    welcome: "Welcome to Pagecraft",
    intro:
      "Your notes, plans and lists live in this browser. Nothing is sent anywhere, and this page is yours to change.",
    tip: "Press Ctrl+K to find a page or run a command, and Ctrl+Shift+/ to see every shortcut.",
    writeHeading: "Write",
    slash: "Type / in an empty line to add any kind of block",
    format: "Select text to make it bold, italic, or a color",
    markdown: "Type # and a space for a heading, - for a list, [] for a to-do",
    paste: "Paste Markdown and it turns into blocks",
    move: "Drag the handle beside a block to move it, or press Alt with Up or Down",
    organizeHeading: "Organize",
    nest: "Pages can hold pages: press + beside a page in the sidebar",
    favorite: "Add a page to Favorites from its menu to keep it at the top",
    views: "Open Tasks to see the same rows as a table, a board or a calendar",
    dataQuestion: "Where is my data kept?",
    dataAnswer:
      "In this browser, saved as you type. Export a copy from Settings at any time, and import it in another browser.",
    closing: "Start by changing this page.",
    tasks: "Tasks",
    status: "Status",
    due: "Due",
    notStarted: "Not started",
    inProgress: "In progress",
    done: "Done",
    taskBoard: "Move this card on the board",
    taskPage: "Add a page of your own",
    taskShortcuts: "Look through the keyboard shortcuts",
  },
} as const;
