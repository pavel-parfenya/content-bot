import { env } from "config";
import { ImageService } from "services/image.service";
import { PostService } from "services/post.service";
import SessionStore from "store/session/session.store";
import { MyContext } from "types";
import { sendPostWithButtons } from "utils/sendPostWithButtons";

const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

export default async function generateCommand(ctx: MyContext) {
  await ctx.reply("Генерирую пост (случайная тема) ...");
  try {
    const { title, text, imageUrl } = await PostService.generate();

    if (imageUrl && text && title) {
      const image = await ImageService.create(title, imageUrl);
      SessionStore.set(CHANNEL_ID, {
        generatedPost: text,
        generatedImage: image,
      });

      await sendPostWithButtons(ctx);
    }
  } catch (error) {
    console.error(error);
    await ctx.reply("Произошла ошибка при генерации поста 😥");
  }
}
