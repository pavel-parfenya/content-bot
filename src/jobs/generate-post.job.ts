import { env } from "config";
import { Source } from "constants/source";
import { Api, InlineKeyboard, InputFile, RawApi } from "grammy";
import { ImageService } from "services/image.service";
import { PostService } from "services/post.service";
import SessionStore from "store/session/session.store";

const ADMIN_ID = env.TELEGRAM_ADMIN_ID;
const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

export const generatePostJob = async (api: Api<RawApi>, source: Source) => {
  await api.sendMessage(ADMIN_ID, `Генерирую пост (${source}) ...`);
  try {
    const { title, text, imageUrl } = await PostService.generate(source);
    const image = await ImageService.create(title, imageUrl);

    SessionStore.set(CHANNEL_ID, {
      generatedPost: text,
      generatedImage: image,
    });

    if (image && text && title) {
      const keyboard = new InlineKeyboard().text("Запостить", "post");

      await api.sendPhoto(ADMIN_ID, new InputFile(image), {
        caption: text,
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    console.error(error);
    await api.sendMessage(ADMIN_ID, "Произошла ошибка при генерации поста 😥");
  }
};
