// CSV files in and out: saving a view as one, and reading one chosen by
// the person into a new database. Nothing is kept in the store but the
// database an import makes.
import { selectPageTitle } from "../../blocks/page/index.ts";
import { parseCsv } from "../../model/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { downloadTextFile } from "../../ui/download/index.ts";
import { selectViewCsv } from "./csv-export.selectors.ts";
import { importCsv } from "./csv-import.commands.ts";
import { planCsvImport } from "./csv-import.ts";
import type { TableModel } from "./table-model.selectors.ts";

// A byte order mark, so spreadsheets read the file as UTF-8, as Notion's.
const BOM = "﻿";

export function exportViewAsCsv(model: TableModel): void {
  const title = selectPageTitle(model.database);
  const name = title === "" ? COPY.sidebar.untitled : title;
  downloadTextFile({
    name: `${name}.csv`,
    type: "text/csv",
    text: BOM + selectViewCsv(model),
  });
  announce(COPY.database.exportedCsv);
}

// Reads the file and makes a database of it, named as the file is.
export async function importCsvFile(
  file: File,
  dispatch: Dispatch,
): Promise<void> {
  const plan = planCsvImport(parseCsv(await file.text()));
  if (plan.rows.length === 0 && plan.columns.length === 0) {
    announce(COPY.database.csvEmpty);
    return;
  }
  const title = file.name.replace(/\.csv$/i, "");
  dispatch(importCsv.create({ parentId: null, title, plan }));
  announce(COPY.database.importedCsv);
}
