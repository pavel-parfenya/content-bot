import { env } from "config";
import { Pool } from "pg";

let pool: Pool | null = null;

/** Render / облачные Postgres часто требуют SSL; локальный localhost — без SSL. */
function poolOptions(): ConstructorParameters<typeof Pool>[0] {
  const connectionString = env.DATABASE_URL;
  const hostLooksRemote =
    connectionString.includes("render.com") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co");
  return {
    connectionString,
    ...(hostLooksRemote
      ? { ssl: { rejectUnauthorized: false } }
      : undefined),
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolOptions());
  }
  return pool;
}
