import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env",
});

type NodeEnv = "dev" | "prod";

type Env = {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHANEL_ID: string;
  TELEGRAM_ADMIN_ID: string;
  DEEPSEEK_API_KEY: string;
  NODE_ENV: NodeEnv;
  POST_FREQ_MINUTES: string;
  DATABASE_URL: string;
  /** Схема в общей БД (другой проект может жить в `public` или своей схеме). */
  DATABASE_SCHEMA: string;
};

function requireDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL не задан. На Render: создай PostgreSQL и в Environment веб-сервиса задай DATABASE_URL = Internal Database URL из панели БД (хост вида dpg-….render.com, порт в строке обычно 5432). В контейнере нельзя подключаться к localhost:5432 — там нет Postgres.",
    );
  }
  return raw;
}

export const env: Env = {
  TELEGRAM_BOT_TOKEN: process.env.BOT_TOKEN!,
  TELEGRAM_CHANEL_ID: process.env.CHANEL_ID!,
  TELEGRAM_ADMIN_ID: process.env.ADMIN_ID!,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY!,
  NODE_ENV: (process.env.NODE_ENV as NodeEnv) || "dev",
  POST_FREQ_MINUTES: process.env.POST_FREQ_MINUTES!,
  DATABASE_URL: requireDatabaseUrl(),
  DATABASE_SCHEMA:
    (process.env.DATABASE_SCHEMA ?? "content_bot").trim() || "content_bot",
};
