import { InlineKeyboard, InputFile } from "grammy";
import { CHANNEL_ID } from "constants/telegram-ids";
import SessionStore from "store/session/session.store";
import { MyContext } from "types";

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
