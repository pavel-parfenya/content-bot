import { env } from "config";
import { PostTemplate } from "constants/post-template";
import { clearDraftAutoPublish } from "jobs/draft-auto-publish.job";
import {
  publishDraftToChannel,
  stripAdminDraftKeyboard,
} from "services/publish-draft.service";
import SessionStore from "store/session/session.store";
import { MyContext } from "types";

const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

const VALID_STYLES = new Set<string>(Object.values(PostTemplate));

export const publishStyleEvent = async (ctx: MyContext) => {
  const key = ctx.callbackQuery?.data?.replace("publish:", "") ?? "";
  if (!VALID_STYLES.has(key)) {
    await ctx.answerCallbackQuery({ text: "Неизвестный вариант" });
    return;
  }
  const style = key as PostTemplate;

  await ctx.answerCallbackQuery();

  const session = SessionStore.get(CHANNEL_ID);
  const text = session?.generatedPost;
  const title = session?.draftTitle;
  const imageUrl = session?.draftImageUrl;
  const previewBuffer = session?.generatedImage;

  if (!text || !title || !imageUrl || !previewBuffer) {
    await ctx.reply("❌ Черновик устарел. Сгенерируйте пост заново.");
    return;
  }

  if (
    style === PostTemplate.Alt &&
    session?.allowsBackgroundTemplate !== true
  ) {
    await ctx.reply(
      "❌ Шаблон «Фон» недоступен: исходник слишком маленький или сильно сжат для полноэкранного кадра.",
    );
    return;
  }

  const draftId = session.draftId;
  try {
    await publishDraftToChannel(ctx.api, style, session);
    clearDraftAutoPublish(draftId);
    SessionStore.clear(CHANNEL_ID);
    await stripAdminDraftKeyboard(
      ctx.api,
      ctx.chat?.id,
      ctx.callbackQuery?.message?.message_id,
    );
    await ctx.reply("✅ Пост опубликован!");
  } catch (error) {
    await ctx.reply(`❌ Не удалось опубликовать. ${error}`);
  }
};
