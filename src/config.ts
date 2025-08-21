import * as dotenv from "dotenv";
import * as process from "node:process";
dotenv.config();

type NodeEnv = "dev" | "prod";

type Env = {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHANEL_ID: string;
  TELEGRAM_ADMIN_ID: string;
  DEEPSEEK_API_KEY: string;
  NODE_ENV: NodeEnv;
  POST_FREQ_MINUTES: string;
};

export const env: Env = {
  TELEGRAM_BOT_TOKEN: process.env.BOT_TOKEN!,
  TELEGRAM_CHANEL_ID: process.env.CHANEL_ID!,
  TELEGRAM_ADMIN_ID: process.env.ADMIN_ID!,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY!,
  NODE_ENV: (process.env.NODE_ENV as NodeEnv) || "dev",
  POST_FREQ_MINUTES: process.env.POST_FREQ_MINUTES!,
};
