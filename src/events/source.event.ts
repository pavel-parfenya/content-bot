import { Source } from "constants/source";
import { generatePostJob } from "jobs/generate-post.job";
import { MyContext } from "types";
import { answerCallbackSafe } from "utils/safeAnswerCallback";

export const sourceEvent = async (ctx: MyContext) => {
  try {
    const source = ctx.callbackQuery?.data?.replace("source:", "") as Source;

    await answerCallbackSafe(ctx);
    await generatePostJob(ctx.api, source);
  } catch (error) {
    await ctx.reply(`❌ Не удалось опубликовать пост. ${error}`);
  }
};
