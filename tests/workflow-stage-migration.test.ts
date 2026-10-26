import { describe, expect, test } from "bun:test";
import path from "node:path";

import initSqlJs from "sql.js";

import { migrateWorkflowStages } from "@/db/client";

describe("workflow stage migration", () => {
  test("maps old stage values to the renamed ones and is idempotent", async () => {
    const SQL = await initSqlJs({
      locateFile: () => path.join(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm"),
    });
    const connection = new SQL.Database();
    connection.run("CREATE TABLE files (id TEXT PRIMARY KEY, workflow_stage TEXT NOT NULL)");
    connection.run(
      `INSERT INTO files VALUES
        ('a', 'before_photo'), ('b', 'image_concept'), ('c', 'proposal_needed'),
        ('d', 'new_file'), ('e', 'accepted'), ('f', 'archived')`
    );

    migrateWorkflowStages(connection);
    migrateWorkflowStages(connection);

    const rows = connection.exec("SELECT id, workflow_stage FROM files ORDER BY id")[0]?.values;
    expect(rows).toEqual([
      ["a", "site_visit"],
      ["b", "design_concept"],
      ["c", "proposal"],
      ["d", "new_file"],
      ["e", "accepted"],
      ["f", "archived"],
    ]);
    connection.close();
  });
});
