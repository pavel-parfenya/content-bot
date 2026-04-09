import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env",
});

type NodeEnv = "dev" | "prod";

export type BotMode = "polling" | "webhook";

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
  /** long polling (по умолчанию) или HTTPS webhook. */
  MODE: BotMode;
  /** Полный URL для Telegram (POST на path из URL), только при MODE=webhook. */
  WEBHOOK_URL?: string;
  /** Секрет X-Telegram-Bot-Api-Secret-Token, опционально. */
  WEBHOOK_SECRET?: string;
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

function parseMode(): BotMode {
  const m = process.env.MODE?.trim().toLowerCase();
  if (m === "webhook") {
    return "webhook";
  }
  return "polling";
}

function requireWebhookUrl(): string {
  const raw = process.env.WEBHOOK_URL?.trim();
  if (!raw) {
    throw new Error(
      "MODE=webhook требует WEBHOOK_URL — полный HTTPS URL, например https://your-app.onrender.com/telegram",
    );
  }
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error(`WEBHOOK_URL некорректный: ${raw}`);
  }
  const isProd = (process.env.NODE_ENV as NodeEnv) === "prod";
  if (isProd && u.protocol !== "https:") {
    throw new Error(
      "В production WEBHOOK_URL должен начинаться с https:// (Telegram требует HTTPS для webhook).",
    );
  }
  return raw;
}

const mode = parseMode();

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
  MODE: mode,
  WEBHOOK_URL: mode === "webhook" ? requireWebhookUrl() : undefined,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET?.trim() || undefined,
};
