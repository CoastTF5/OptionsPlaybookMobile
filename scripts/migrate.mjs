import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.log("[migrate] DATABASE_URL not set — skipping migrations");
  process.exit(0);
}

const client = new pg.Client({ connectionString });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS mirror_schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
for (const file of files) {
  const { rows } = await client.query("SELECT 1 FROM mirror_schema_migrations WHERE name = $1", [file]);
  if (rows.length) {
    console.log(`skip  ${file}`);
    continue;
  }
  const sql = await readFile(join(migrationsDir, file), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO mirror_schema_migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log(`apply ${file}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`fail  ${file}:`, err);
    process.exit(1);
  }
}
await client.end();
