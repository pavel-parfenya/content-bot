import { env } from "config";

const IDENT = /^[a-z_][a-z0-9_]*$/i;

/** Безопасное имя схемы/таблицы для подстановки в SQL. */
export function quoteIdent(ident: string): string {
  const s = ident.trim();
  if (!IDENT.test(s)) {
    throw new Error(`Недопустимый идентификатор БД: ${JSON.stringify(s)}`);
  }
  return `"${s.replace(/"/g, '""')}"`;
}

export function getDbSchema(): string {
  return env.DATABASE_SCHEMA;
}

/** Полное имя таблицы: "schema"."table" */
export function qualifiedTable(tableName: string): string {
  return `${quoteIdent(getDbSchema())}.${quoteIdent(tableName)}`;
}
