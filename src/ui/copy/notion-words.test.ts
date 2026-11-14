import { describe, expect, it } from "vitest";
import { COPY } from "../copy.ts";

// Each word as Notion's own English i18n holds it: the defaultMessage of
// the message id named beside it, read from Notion's code on 2026-11-13
// (study item 39).
describe("the copy of the new controls", () => {
  it("names the view tab's choices as Notion's", () => {
    // database.viewSettings.viewActionMenu.editDisplay(.personalDisplayCaption)
    expect(COPY.database.displayAs).toBe("Display as");
    expect(COPY.database.onlyForYou).toBe("Only applies to you");
  });

  it("names conditional color's parts as Notion's", () => {
    // database.viewSettings.createConditionalColorTab.description
    expect(COPY.database.conditionalColorNote).toBe(
      "Customize page colors to easily distinguish categories, highlight overdue events, and bring clarity to your work.",
    );
    // CollectionSettingsViewConditionalColorRule.cardBackground
    expect(COPY.database.cardBackground).toBe("Card background");
    // collectionConditionalColor.filterDropdown.placeholder
    expect(COPY.database.colorValuePlaceholder).toBe("Select...");
  });

  it("names a relative date's units in lower case", () => {
    // collectionFilterMenuHelpers.relativeDates.day … .year
    expect(COPY.database.relativeUnits).toEqual({
      day: "day",
      week: "week",
      month: "month",
      year: "year",
    });
  });

  it("names the date formats and a relative day as Notion's", () => {
    // dateHelpers.dateFormat.fullDate, .shortDate, .monthDayYear,
    // .dayMonthYear, .yearMonthDay, .relative
    expect(COPY.database.dateFormats).toEqual({
      full: "Full date",
      short: "Short date",
      "month-day-year": "Month/Day/Year",
      "day-month-year": "Day/Month/Year",
      "year-month-day": "Year/Month/Day",
      relative: "Relative",
    });
    // dateHelpers.hiddenTimeFormat, .12hourTimeFormat, .24hourTimeFormat
    expect(COPY.database.timeFormats).toEqual({
      hidden: "Hidden",
      "12-hour": "12 hour",
      "24-hour": "24 hour",
    });
    // dateFormatHelpers.text.today, .tomorrow, .yesterday,
    // .nextDayOfTheWeek, .lastDayOfTheWeek
    const days = COPY.database.relativeDays;
    expect([days.today, days.tomorrow, days.yesterday]).toEqual([
      "Today",
      "Tomorrow",
      "Yesterday",
    ]);
    expect([days.next("Monday"), days.last("Friday")]).toEqual([
      "Next Monday",
      "Last Friday",
    ]);
  });

  it("names the cadence's rows and presets as Notion's", () => {
    const { cadence } = COPY;
    // automations.RecurrenceEditor.startTimeLabel, .timezone
    expect(cadence.start).toBe("Starting");
    expect(cadence.timeZone).toBe("Timezone");
    // automations.RecurTimeMenu.aroundMidnightCaption
    expect(cadence.midnightHours).toBe("12–3AM");
    // automations.RecurrencePresetMenu.twoWeeks, .threeMonths, .sixMonths
    expect(cadence.presets.twoWeeks).toBe("2 Weeks");
    expect(cadence.presets.threeMonths).toBe("3 Months");
    expect(cadence.presets.sixMonths).toBe("6 Months");
    // pageViewBlock.templatePageBanner.duplicateEveryLabel,
    // database.templatePickerItem.actionMenu.repeat
    expect(COPY.database.templateRepeatButton).toBe("Duplicate every…");
    expect(COPY.database.templateRepeat).toBe("Duplicate every…");
  });

  it("names Manage in Calendar as Notion's", () => {
    // manageInNotionCalendarButton.label
    expect(COPY.sidebarTabs.manageInCalendar).toBe("Manage in Calendar");
  });

  it("names the skin tone button and suggesting as Notion's", () => {
    // emojiPickerSkinTonePicker.selectSkinTone
    expect(COPY.emoji.skinTone).toBe("Select skin tone");
    // topbarStopSuggestModeButton.tooltip, inlineSuggestButton.tooltipDisable
    expect(COPY.suggestions.youreSuggesting).toBe("You’re suggesting");
    expect(COPY.suggestions.stop).toBe("Turn off suggesting");
  });

  it("names the button's trigger and the filters' words as Notion's", () => {
    // automations.trigger.button.clicked: "<b>Button</b> is clicked"
    expect(COPY.automation.clicked).toBe("Button is clicked");
    expect(COPY.automation.clickedBold).toBe("Button");
    // collectionFilterMenu.dateFilter.relativeDateFilter.description
    expect(COPY.database.relativeNote).toBe(
      "Filter will update with the current date",
    );
    // database.filterMenu.dateFilterModeMenu.label
    expect(COPY.database.dateEndChoice).toBe("Date Options");
  });

  it("names the view's menu, its link and a file cell as Notion's", () => {
    // database.viewSettings.viewActionMenu.title
    expect(COPY.database.tabMenu).toBe("View options");
    // database.viewSettings.copyLinkSnackBarItem.title
    expect(COPY.database.viewLinkCopied).toBe(
      "Link to view copied to clipboard",
    );
    // database.fileProperty.focusedLabel, mediaPicker.embedPlaceholder.text
    expect(COPY.database.addFileOrImage).toBe("Add a file or image");
    expect(COPY.database.pasteLink).toBe("Paste in https://…");
  });

  it("names the sidebar's empty Calendar tab and menus as Notion's", () => {
    // sidebar.simplification.upcomingEvents.noEvents
    expect(COPY.sidebarTabs.empty).toBe("No upcoming events");
    // sidebar.simplification.databaseView.openMenu.ariaLabel,
    // sidebar.simplification.shortcut.openMenu.ariaLabel
    expect(COPY.sidebarViews.menu).toBe("Open menu");
    expect(COPY.sidebarCustomize.shortcutMenu).toBe("Open shortcut menu");
  });

  it("names the controls without words of their own after Notion's", () => {
    // automations.RecurrenceEditor.frequencyLabel, .endConditionMenu.numberOfRuns
    expect(COPY.cadence.interval).toBe("Every");
    expect(COPY.cadence.runs).toBe("Number of runs");
    // automations.actionContextMenu.deleteMenuItemLabel
    expect(COPY.automation.remove).toBe("Delete");
    // database.filterMenu.comparatorMenuDropdownButton.label,
    // database.filterMenu.filterOperatorMenu.title (Any, None, Every are
    // collectionFilterMenuHelpers.operator.*)
    expect(COPY.database.filterOperator).toBe("Comparator");
    expect(COPY.database.quantifierChoice).toBe("Operator");
  });

  it("names Move to Trash, Plain Text, an option search and Reading List", () => {
    // action.moveToTrash.name, action.languageMode.plaintext
    expect(COPY.pageMenu.trash).toBe("Move to Trash");
    expect(COPY.codeBlock.languages.plain).toBe("Plain Text");
    // database.selectPropertyEditMenu.searchPlaceholder
    expect(COPY.database.optionSearch).toBe("Search for an option...");
    // templateHelpers.templates.readingList
    expect(COPY.templates.readingList.name).toBe("Reading List");
  });

  it("names a template's banner and its saved cadence as Notion's", () => {
    // pageViewBlock.templatePageBanner.editTemplateLabel
    expect(COPY.database.templateBannerLead).toBe(
      "You’re editing a template in",
    );
    // database.templatePickerItem.duplicateMenuLabel.duplicateEvery with
    // its unit, as Notion's banner reads once saved ("Duplicar a cada
    // semana", n58-banner)
    expect(COPY.cadence.repeating("week")).toBe("Duplicate every week");
  });

  it("names the selection toolbar's buttons as Notion's tooltips", () => {
    const { formatToolbar } = COPY;
    // richTextMenu.italicsButton, .strikeThroughButton, .markAsCodeButton,
    // .clearFormatButton, .equationButton; selectionLinkButton.addLink;
    // highlightSelectionButton.backgroundSection
    expect(formatToolbar.italic).toBe("Italicize");
    expect(formatToolbar.strikethrough).toBe("Strike-through");
    expect(formatToolbar.code).toBe("Mark as code");
    expect(formatToolbar.clearFormat).toBe("Clear format");
    expect(formatToolbar.equation).toBe("Mark as equation");
    expect(formatToolbar.link).toBe("Add link");
    expect(formatToolbar.highlight).toBe("Background color");
  });

  it("names property types and filter conditions as Notion's", () => {
    // database.propertyTypeName.multi_select, .file, .auto_increment_id
    expect(COPY.propertyTypes.multiSelect).toBe("Multi-select");
    expect(COPY.propertyTypes.files).toBe("Files & media");
    expect(COPY.propertyTypes.uniqueId).toBe("ID");
    // collectionFilterMenuHelpers.operator.dateIsOnOrBefore, .stringEndsWith,
    // .numberGreaterThanOrEqualTo
    expect(COPY.operators.onOrBefore).toBe("Is on or before");
    expect(COPY.operators.endsWith).toBe("Ends with");
    expect(COPY.operators.atLeast).toBe("≥");
  });
});

describe("counts on a view's pills", () => {
  it("say one rule and one sort in the singular, as Notion's", () => {
    expect(COPY.database.ruleCount(1)).toBe("1 rule");
    expect(COPY.database.ruleCount(2)).toBe("2 rules");
    expect(COPY.database.sortCount(1)).toBe("1 sort");
    expect(COPY.database.sortCount(3)).toBe("3 sorts");
  });
});
