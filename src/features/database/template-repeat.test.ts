import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { addRow } from "./row.commands.ts";
import { addTemplate, selectRowTemplate } from "./template.commands.ts";
import {
  advanceRepeat,
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
    selectPage(app.store.getState(), templateId)?.props.repeat;
  return { app, templateId, repeatOf };
}

describe("a repeating template", () => {
  it("repeats from the next day of its period, and stops", () => {
    const { app, templateId, repeatOf } = withTemplate();

    app.dispatch(
      setTemplateRepeat.create({
        templateId,
        cadence: { every: "week" },
        today: TODAY,
      }),
    );
    expect(repeatOf()).toEqual({ every: "week", next: "2026-11-18" });

    app.dispatch(
      setTemplateRepeat.create({ templateId, cadence: null, today: TODAY }),
    );
    expect(repeatOf()).toBeUndefined();
  });

  it("falls due on its day, and moves on past today once used", () => {
    const { app, templateId, repeatOf } = withTemplate();
    app.dispatch(
      setTemplateRepeat.create({
        templateId,
        cadence: { every: "day" },
        today: TODAY,
      }),
    );
    const due = (today: string) =>
      selectDueRepeats(app.store.getState(), today).map(
        (item) => item.templateId,
      );

    expect(due(TODAY)).toEqual([]);
    expect(due("2026-11-14")).toEqual([templateId]);

    app.dispatch(advanceRepeat.create({ templateId, today: "2026-11-14" }));
    expect(repeatOf()).toEqual({ every: "day", next: "2026-11-15", made: 1 });
    expect(due("2026-11-14")).toEqual([]);
  });

  it("names the database and the row it starts", () => {
    const { app, templateId } = withTemplate();
    app.dispatch(
      setTemplateRepeat.create({
        templateId,
        cadence: { every: "day" },
        today: TODAY,
      }),
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

describe("a template's cadence", () => {
  it("starts on its start day, the first of its weekdays from it", () => {
    const { app, templateId, repeatOf } = withTemplate();
    const cadence = {
      every: "week",
      weekdays: [0],
      start: "2026-11-14",
    } as const;

    app.dispatch(
      setTemplateRepeat.create({
        templateId,
        cadence: { ...cadence, weekdays: [...cadence.weekdays] },
        today: TODAY,
      }),
    );

    expect(repeatOf()?.next).toBe("2026-11-16");
  });

  it("stops after its number of runs", () => {
    const { app, templateId, repeatOf } = withTemplate();
    app.dispatch(
      setTemplateRepeat.create({
        templateId,
        cadence: { every: "day", endsAfter: 2 },
        today: TODAY,
      }),
    );

    app.dispatch(advanceRepeat.create({ templateId, today: "2026-11-12" }));
    expect(repeatOf()?.made).toBe(1);
    app.dispatch(advanceRepeat.create({ templateId, today: "2026-11-13" }));

    expect(repeatOf()).toBeUndefined();
  });

  it("stops after its last day", () => {
    const { app, templateId, repeatOf } = withTemplate();
    app.dispatch(
      setTemplateRepeat.create({
        templateId,
        cadence: { every: "week", endsOn: "2026-11-20" },
        today: TODAY,
      }),
    );

    app.dispatch(advanceRepeat.create({ templateId, today: "2026-11-18" }));

    expect(repeatOf()).toBeUndefined();
  });

  it("falls due on its day only from its time", () => {
    const { app, templateId } = withTemplate();
    app.dispatch(
      setTemplateRepeat.create({
        templateId,
        cadence: { every: "day", time: "09:15" },
        today: TODAY,
      }),
    );
    const due = (time: string) =>
      selectDueRepeats(app.store.getState(), "2026-11-12", time).length;

    expect(due("09:00")).toBe(0);
    expect(due("09:15")).toBe(1);
  });
});
