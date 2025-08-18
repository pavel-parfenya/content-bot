import { env } from "config";
import { InlineKeyboard, InputFile } from "grammy";
import SessionStore from "store/session/session.store";
import { MyContext } from "types";

const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

export async function sendPostWithButtons(ctx: MyContext) {
  const session = SessionStore.get(CHANNEL_ID);
  const post = session?.generatedPost;
  const image = session?.generatedImage;

  if (post && image) {
    const keyboard = new InlineKeyboard().text("Запостить", "post");

    await ctx.replyWithPhoto(new InputFile(image), {
      caption: post,
      reply_markup: keyboard,
    });
  }
}
