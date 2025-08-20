import { env } from "config";
import { Source } from "constants/source";
import { generatePostJob } from "jobs/generate-post.job";
import SessionStore from "store/session/session.store";
import { MyContext } from "types";

const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

export const sourceEvent = async (ctx: MyContext) => {
  try {
    const source = ctx.callbackQuery?.data?.replace("source:", "") as Source;

    await ctx.answerCallbackQuery();
    await generatePostJob(ctx.api, source);

    SessionStore.clear(CHANNEL_ID);
  } catch (error) {
    await ctx.reply(`❌ Не удалось опубликовать пост. ${error}`);
  }
};
