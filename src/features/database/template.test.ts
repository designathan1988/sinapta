import { describe, expect, it } from "vitest";
import { createPage, selectPage } from "../../blocks/page/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { addRow, setRowValue } from "./row.commands.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import {
  addTemplate,
  deleteTemplate,
  duplicateTemplate,
  setDefaultTemplate,
  withDefaultTemplate,
} from "./template.commands.ts";

// A database with one row, "One", and one template.
function withTemplate() {
  const app = createDatabaseApp(
    [{ name: "Done", type: "checkbox" }],
    [["One", false]],
  );
  app.dispatch(addTemplate.create({ databaseId: app.databaseId }));
  const templateId = app.database().props.templateIds[0];
  const doneId = app
    .database()
    .props.properties.find((property) => property.name === "Done")?.id;
  if (templateId === undefined || doneId === undefined) {
    throw new Error("setup");
  }
  return { app, templateId, doneId };
}

describe("row templates", () => {
  it("keeps templates out of the view's rows", () => {
    const { app } = withTemplate();

    const model = selectTableModel(app.store.getState(), app.databaseId);

    expect(model?.rows.map((row) => row.title)).toEqual(["One"]);
  });

  it("gives a new row the default template's values and pages", () => {
    const { app, templateId, doneId } = withTemplate();
    const { databaseId } = app;
    app.dispatch(
      setRowValue.create({
        rowId: templateId,
        propertyId: doneId,
        value: true,
      }),
    );
    app.dispatch(createPage.create({ parentId: templateId }));
    app.dispatch(setDefaultTemplate.create({ databaseId, templateId }));

    const payload = withDefaultTemplate(app.store.getState(), { databaseId });
    app.dispatch(addRow.create(payload));

    const row = selectPage(
      app.store.getState(),
      app.database().childIds.at(-1) ?? null,
    );
    expect(row?.id).not.toBe(templateId);
    expect(row?.props.values?.[doneId]).toBe(true);
    expect(row?.childIds).toHaveLength(1);
    expect(app.database().props.templateIds).toEqual([templateId]);
  });

  it("duplicates a template beside it", () => {
    const { app, templateId } = withTemplate();

    app.dispatch(duplicateTemplate.create({ templateId, blockCount: 1 }));

    const { childIds } = app.database();
    const { templateIds } = app.database().props;
    expect(templateIds).toHaveLength(2);
    expect(childIds.indexOf(templateIds[1] ?? templateId)).toBe(
      childIds.indexOf(templateId) + 1,
    );
  });

  it("deletes a template, and it stops being the default", () => {
    const { app, templateId } = withTemplate();
    const { databaseId } = app;
    app.dispatch(setDefaultTemplate.create({ databaseId, templateId }));

    app.dispatch(deleteTemplate.create({ templateId }));

    expect(app.database().props.templateIds).toEqual([]);
    expect(app.database().props.defaultTemplateId).toBeNull();
    expect(app.store.getState().workspace.blocks[templateId]).toBeUndefined();
  });
});
