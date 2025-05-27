import generateCommand from "commands/generate.command";
import imageCommand from "commands/image.command";
import { promptCommand } from "commands/prompt.command";
import startCommand from "commands/start.command";
import { Bot, session } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "config";
import { generatePostJob } from "jobs/generate-post.job";
import { MyContext, SessionData } from "./types";
import { callbackQueryDataEvent } from "events/callback-query-data.event";
import cron from "node-cron";

export const bot = new Bot<MyContext>(TELEGRAM_BOT_TOKEN);

bot.use(
  session({
    initial: (): SessionData => ({
      waitingForPrompt: false,
      generatedPost: null,
      generatedImage: null,
    }),
  }),
);

bot.command("start", startCommand);
bot.command("generate", generateCommand);
bot.command("prompt", promptCommand);
bot.command("image", imageCommand);

bot.callbackQuery("post", callbackQueryDataEvent);

cron.schedule("0 * * * *", () => generatePostJob(bot.api));
