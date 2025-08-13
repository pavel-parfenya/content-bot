import generateCommand from "commands/generate.command";
import startCommand from "commands/start.command";
import { TELEGRAM_BOT_TOKEN } from "config";
import { Source } from "constants/source";
import { callbackQueryDataEvent } from "events/callback-query-data.event";
import { Bot, session } from "grammy";
import { generatePostJob } from "jobs/generate-post.job";
import cron from "node-cron";
import { MyContext, SessionData } from "types";

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

bot.callbackQuery("post", callbackQueryDataEvent);

cron.schedule("0 10-23 * * *", () => generatePostJob(bot.api, Source.Dota2Ru));
cron.schedule("30 10-23 * * *", () =>
  generatePostJob(bot.api, Source.Dotesports),
);
