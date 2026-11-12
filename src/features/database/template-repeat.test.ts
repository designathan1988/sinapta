import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { addRow } from "./row.commands.ts";
import { addTemplate, selectRowTemplate } from "./template.commands.ts";
import {
  advanceRepeat,
  nextOccurrence,
  selectDueRepeats,
  setTemplateRepeat,
} from "./template-repeat.commands.ts";

const TODAY = "2026-11-11";

function withTemplate() {
  const app = createDatabaseApp([{ name: "Done", type: "checkbox" }], []);
  app.dispatch(addTemplate.create({ databaseId: app.databaseId }));
  const templateId = app.database().props.templateIds[0];
  if (templateId === undefined) throw new Error("setup");
  const repeatOf = () =>
    app.store.getState().workspace.blocks[templateId]?.props.repeat;
  return { app, templateId, repeatOf };
}

describe("nextOccurrence", () => {
  it.each([
    ["2026-11-11", "day", "2026-11-12"],
    ["2026-11-11", "week", "2026-11-18"],
    ["2026-01-31", "month", "2026-02-28"],
    ["2026-12-15", "month", "2027-01-15"],
    ["2028-02-29", "year", "2029-02-28"],
  ] as const)("goes from %s a %s on to %s", (day, every, next) => {
    expect(nextOccurrence(day, every)).toBe(next);
  });
});

describe("a repeating template", () => {
  it("repeats from the next day of its period, and stops", () => {
    const { app, templateId, repeatOf } = withTemplate();

    app.dispatch(
      setTemplateRepeat.create({ templateId, every: "week", today: TODAY }),
    );
    expect(repeatOf()).toEqual({ every: "week", next: "2026-11-18" });

    app.dispatch(
      setTemplateRepeat.create({ templateId, every: null, today: TODAY }),
    );
    expect(repeatOf()).toBeUndefined();
  });

  it("falls due on its day, and moves on past today once used", () => {
    const { app, templateId, repeatOf } = withTemplate();
    app.dispatch(
      setTemplateRepeat.create({ templateId, every: "day", today: TODAY }),
    );
    const due = (today: string) =>
      selectDueRepeats(app.store.getState(), today).map(
        (item) => item.templateId,
      );

    expect(due(TODAY)).toEqual([]);
    expect(due("2026-11-14")).toEqual([templateId]);

    app.dispatch(advanceRepeat.create({ templateId, today: "2026-11-14" }));
    expect(repeatOf()).toEqual({ every: "day", next: "2026-11-15" });
    expect(due("2026-11-14")).toEqual([]);
  });

  it("names the database and the row it starts", () => {
    const { app, templateId } = withTemplate();
    app.dispatch(
      setTemplateRepeat.create({ templateId, every: "day", today: TODAY }),
    );
    const [item] = selectDueRepeats(app.store.getState(), "2026-11-12");
    const template = selectRowTemplate(app.store.getState(), templateId);

    expect(item).toEqual({ templateId, databaseId: app.databaseId, template });
    if (item?.template !== undefined) {
      app.dispatch(
        addRow.create({
          databaseId: item.databaseId,
          template: item.template,
          staysPut: true,
        }),
      );
    }
    expect(app.database().childIds).toHaveLength(2);
  });
});
