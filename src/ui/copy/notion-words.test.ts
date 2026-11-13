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
    // The template strip's button, as Notion's English draws it (its
    // pt-BR text, pageViewBlock.templatePageBanner.duplicateEveryLabel,
    // ends in three dots: "Duplicar a cada...").
    expect(COPY.database.templateRepeatButton).toBe("Duplicate every...");
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
});
