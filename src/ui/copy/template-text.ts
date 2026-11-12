// Text of the template gallery and of the pages its templates make.
export const TEMPLATE_TEXT = {
  templates: {
    open: "Templates",
    title: "Templates",
    close: "Close templates",
    use: "Use this template",
    list: "Templates",
    preview: "Preview",
    categories: { work: "Work", personal: "Personal" },
    used: "A new page was made from the template.",
    meetingNotes: {
      name: "Meeting notes",
      description: "Attendees, agenda, notes and action items.",
      attendees: "Attendees",
      agenda: "Agenda",
      notes: "Notes",
      actions: "Action items",
    },
    toDoList: {
      name: "To-do list",
      description: "What to do today, and later.",
      today: "Today",
      later: "Later",
    },
    journal: {
      name: "Journal",
      description: "A daily entry: how you feel and what stood out.",
      prompt: "How are you feeling today?",
      grateful: "Grateful for",
      highlights: "Highlights",
    },
    doc: {
      name: "Doc",
      description: "An overview, the details and the next steps.",
      overview: "Overview",
      details: "Details",
      next: "Next steps",
    },
    weeklyPlan: {
      name: "Weekly plan",
      description: "A heading and a to-do for each weekday.",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    readingList: {
      name: "Reading list",
      description: "What you read now, next and have finished.",
      tip: "Add a book or an article as a to-do; tick it once read.",
      now: "Reading now",
      next: "Up next",
      done: "Finished",
    },
  },
} as const;
