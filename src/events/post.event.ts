import { env } from "config";
import { InputFile } from "grammy";
import SessionStore from "store/session/session.store";
import { Readable } from "stream";
import { MyContext } from "types";
import { markdownToHtml } from "utils/markdownToHtml";

const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

export const postEvent = async (ctx: MyContext) => {
  const session = SessionStore.get(CHANNEL_ID);
  const image = session?.generatedImage;
  const text = session?.generatedPost;
  try {
    if (image && text) {
      const imageStream = Readable.from(image);

      await ctx.api.sendPhoto(
        CHANNEL_ID,
        new InputFile(imageStream, "post.jpg"),
        {
          caption: markdownToHtml(text),
          parse_mode: "HTML",
        },
      );
    }

    SessionStore.clear(CHANNEL_ID);
    await ctx.reply("✅ Пост успешно опубликован!");
  } catch (error) {
    await ctx.reply(`❌ Не удалось опубликовать пост. ${error}`);
  }
};
