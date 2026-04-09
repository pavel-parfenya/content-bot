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
};

export const env: Env = {
  TELEGRAM_BOT_TOKEN: process.env.BOT_TOKEN!,
  TELEGRAM_CHANEL_ID: process.env.CHANEL_ID!,
  TELEGRAM_ADMIN_ID: process.env.ADMIN_ID!,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY!,
  NODE_ENV: (process.env.NODE_ENV as NodeEnv) || "dev",
  POST_FREQ_MINUTES: process.env.POST_FREQ_MINUTES!,
  DATABASE_URL: process.env.DATABASE_URL!,
};
