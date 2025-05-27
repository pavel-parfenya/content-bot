import * as dotenv from "dotenv";
dotenv.config();

export const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN!;
export const TELEGRAM_CHANNEL_ID = process.env.CHANNEL_ID!;
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
export const POST_CRON = process.env.POST_CRON || "0 * * * *"; // по умолчанию — каждый час
