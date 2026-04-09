import generateCommand from "commands/generate.command";
import startCommand from "commands/start.command";
import { env } from "config";
import { Source } from "constants/source";
import { cancelEvent } from "events/cancel.event";
import { publishStyleEvent } from "events/publish-style.event";
import { sourceEvent } from "events/source.event";
import { Bot, session } from "grammy";
import { generatePostJob } from "jobs/generate-post.job";
import cron from "node-cron";
import { MyContext, SessionData } from "types";
import { getRandomEnumValue } from "utils/getRandomEnumValue";

export const bot = new Bot<MyContext>(env.TELEGRAM_BOT_TOKEN);

console.log(env.TELEGRAM_CHANEL_ID);

bot.use(
  session({
    initial: (): SessionData => ({
      waitingForPrompt: false,
      generatedPost: null,
      generatedImage: null,
      draftTitle: null,
      draftImageUrl: null,
    }),
  }),
);

bot.command("start", startCommand);
bot.command("generate", generateCommand);

bot.callbackQuery("cancel", cancelEvent);
bot.callbackQuery(/^publish:/, publishStyleEvent);
bot.callbackQuery(/^source:/, sourceEvent);

if (env.NODE_ENV === "prod") {
  cron.schedule(`${env.POST_FREQ_MINUTES} 08-21 * * *`, () => {
    const source = getRandomEnumValue(Source);
    void generatePostJob(bot.api, source);
  });
}
