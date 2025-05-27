import { Api, InlineKeyboard, InputFile, RawApi } from "grammy";
import { ImageService } from "services/image.service";
import { PostService } from "services/post.service";
import { ADMIN_ID, CHANNEL_ID } from "constants/telegram-ids";
import SessionStore from "store/session/session.store";

export const generatePostJob = async (api: Api<RawApi>) => {
  await api.sendMessage(ADMIN_ID, "Генерирую пост (случайная тема) ...");
  try {
    const { title, text, imageUrl } = await PostService.generate();
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
