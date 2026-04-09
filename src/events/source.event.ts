import { Source } from "constants/source";
import { generatePostJob } from "jobs/generate-post.job";
import { MyContext } from "types";
import { answerCallbackSafe } from "utils/safeAnswerCallback";

/**
 * Webhook должен быстро вернуть 200. Генерация (парсер, DeepSeek, картинка) идёт в фоне,
 * иначе Render/прокси обрывает запрос — остаётся только «Генерирую пост…».
 */
export const sourceEvent = async (ctx: MyContext) => {
  try {
    const source = ctx.callbackQuery?.data?.replace("source:", "") as Source;

    await answerCallbackSafe(ctx);
    void generatePostJob(ctx.api, source).catch((err) => {
      console.error("generatePostJob:", err);
    });
  } catch (error) {
    await ctx.reply(`❌ Не удалось запустить генерацию. ${error}`);
  }
};
