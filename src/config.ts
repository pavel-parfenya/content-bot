import * as dotenv from "dotenv";
import * as process from "node:process";
dotenv.config();

type NodeEnv = "dev" | "prod";

type Env = {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHANEL_ID: string;
  TELEGRAM_ADMIN_ID: string;
  DEEPSEEK_API_KEY: string;
  POST_CRON: string;
  NODE_ENV: NodeEnv;
};

export const env: Env = {
  TELEGRAM_BOT_TOKEN: process.env.BOT_TOKEN!,
  TELEGRAM_CHANEL_ID: process.env.CHANEL_ID!,
  TELEGRAM_ADMIN_ID: process.env.ADMIN_ID!,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY!,
  POST_CRON: process.env.POST_CRON || "0 10-23 * * *",
  NODE_ENV: (process.env.NODE_ENV as NodeEnv) || "dev",
};
