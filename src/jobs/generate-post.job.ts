import { randomUUID } from "crypto";
import { env } from "config";
import { Source } from "constants/source";
import {
  clearDraftAutoPublish,
  scheduleDraftAutoPublish,
} from "jobs/draft-auto-publish.job";
import { Api, InlineKeyboard, InputFile, RawApi } from "grammy";
import { MAX_NEWS_PICK_ATTEMPTS } from "services/semantic-news.service";
import { PostService } from "services/post.service";
import SessionStore from "store/session/session.store";
import { isImageGoodForFullBleed } from "utils/isImageGoodForFullBleed";
import { markdownToHtml } from "utils/markdownToHtml";
import { errorMessageForUser, sanitizeErrorForLogs } from "utils/redactSecrets";
import { urlToBuffer } from "utils/urlToBuffer";

const ADMIN_ID = env.TELEGRAM_ADMIN_ID;
const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

export const generatePostJob = async (api: Api<RawApi>, source: Source) => {
  await api.sendMessage(ADMIN_ID, `Генерирую пост (${source}) ...`);
  try {
    const previous = SessionStore.get(CHANNEL_ID);
    clearDraftAutoPublish(previous?.draftId);

    const result = await PostService.generate(source);
    if (result.newsNotFound) {
      await api.sendMessage(
        ADMIN_ID,
        `Уникальная новость не найдена: проверено ${MAX_NEWS_PICK_ATTEMPTS} следующих по списку — все уже есть в базе по смыслу.`,
      );
      return;
    }
    const { title, text, imageUrl } = result;
    if (!title?.trim() || !text?.trim() || !imageUrl?.trim()) {
      await api.sendMessage(
        ADMIN_ID,
        "Не удалось получить материал для поста: источник не ответил вовремя, вернул пустую страницу или нет картинки. Посмотрите логи сервера (часто это таймаут или блокировка запросов к hawk.live).",
      );
      return;
    }
    const previewImage = await urlToBuffer(imageUrl);
    const allowsBackgroundTemplate =
      await isImageGoodForFullBleed(previewImage);

    const draftId = randomUUID();

    if (text && title) {
      const keyboard = new InlineKeyboard()
        .text("Классика", "publish:Classic")
        .text("Без шаблона", "publish:None")
        .row();

      if (allowsBackgroundTemplate) {
        keyboard.text("Фон", "publish:Alt").text("Отменить", "cancel");
      } else {
        keyboard.text("Отменить", "cancel");
      }

      const sent = await api.sendPhoto(ADMIN_ID, new InputFile(previewImage), {
        caption: markdownToHtml(text),
        parse_mode: "HTML",
        reply_markup: keyboard,
      });

      SessionStore.set(CHANNEL_ID, {
        generatedPost: text,
        generatedImage: previewImage,
        draftTitle: title,
        draftImageUrl: imageUrl,
        allowsBackgroundTemplate,
        draftId,
        adminPreviewChatId: sent.chat.id,
        adminPreviewMessageId: sent.message_id,
      });

      scheduleDraftAutoPublish(draftId, api);
    }
  } catch (error) {
    console.error("generatePostJob:", sanitizeErrorForLogs(error));
    await api.sendMessage(
      ADMIN_ID,
      `Произошла ошибка при генерации поста 😥 ${errorMessageForUser(error)}`,
    );
  }
};
