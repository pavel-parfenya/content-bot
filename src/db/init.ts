import { getPool } from "db/pool";
import { getDbSchema, quoteIdent } from "db/schema";

export async function initDatabase(): Promise<void> {
  const pool = getPool();
  const schema = getDbSchema();

  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)}`);

  const newsTable = `${quoteIdent(schema)}.${quoteIdent("news")}`;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${newsTable} (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
