import generateCommand from "commands/generate.command";
import startCommand from "commands/start.command";
import { env } from "config";
import { Source } from "constants/source";
import { postEvent } from "events/post.event";
import { sourceEvent } from "events/source.event";
import { Bot, session } from "grammy";
import { generatePostJob } from "jobs/generate-post.job";
import cron from "node-cron";
import { MyContext, SessionData } from "types";
import { getRandomEnumValue } from "utils/getRandomEnumValue";

export const bot = new Bot<MyContext>(env.TELEGRAM_BOT_TOKEN);

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

bot.callbackQuery("post", postEvent);
bot.callbackQuery(/^source:/, sourceEvent);

if (env.NODE_ENV === "prod") {
  cron.schedule(`${env.POST_FREQ_MINUTES} 08-21 * * *`, () => {
    const source = getRandomEnumValue(Source);
    void generatePostJob(bot.api, source);
  });
}
