import { env } from "config";
import { clearDraftAutoPublish } from "jobs/draft-auto-publish.job";
import SessionStore from "store/session/session.store";
import { MyContext } from "types";

const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

/** Снимаем клавиатуру, отменяем автопубликацию по таймеру, очищаем черновик. */
export const cancelEvent = async (ctx: MyContext) => {
  await ctx.answerCallbackQuery({ text: "Отменено" });
  const session = SessionStore.get(CHANNEL_ID);
  clearDraftAutoPublish(session?.draftId);
  SessionStore.clear(CHANNEL_ID);
  try {
    await ctx.editMessageReplyMarkup({
      reply_markup: { inline_keyboard: [] },
    });
  } catch {
    /* сообщение устарело или разметка уже снята */
  }
};
