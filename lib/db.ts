import pg from "pg";
import type { Snapshot } from "@/lib/schema";

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  pool = new pg.Pool({ connectionString });
  return pool;
}

export async function upsertSnapshot(payload: Snapshot): Promise<void> {
  const sql = `
    INSERT INTO mirror_snapshots (id, payload, generated_at, ingested_at)
    VALUES ('latest', $1::jsonb, $2::timestamptz, now())
    ON CONFLICT (id) DO UPDATE
    SET payload = EXCLUDED.payload,
        generated_at = EXCLUDED.generated_at,
        ingested_at = now()
  `;
  await getPool().query(sql, [JSON.stringify(payload), payload.generated_at]);
}

export interface StoredSnapshot {
  payload: Snapshot;
  ingested_at: Date;
}

export async function getLatestSnapshot(): Promise<StoredSnapshot | null> {
  const sql = `SELECT payload, ingested_at FROM mirror_snapshots WHERE id = 'latest' LIMIT 1`;
  const { rows } = await getPool().query(sql);
  if (!rows.length) return null;
  return { payload: rows[0].payload as Snapshot, ingested_at: rows[0].ingested_at as Date };
}
