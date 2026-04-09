import { env } from "config";
import { PostTemplate } from "constants/post-template";
import type { Api, RawApi } from "grammy";
import { InputFile } from "grammy";
import { ImageService } from "services/image.service";
import { Readable } from "stream";
import type { SessionData } from "types";
import { markdownToHtml } from "utils/markdownToHtml";
import { urlToBuffer } from "utils/urlToBuffer";

const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;

export type DraftFields = Pick<
  SessionData,
  | "generatedPost"
  | "generatedImage"
  | "draftTitle"
  | "draftImageUrl"
>;

export async function publishDraftToChannel(
  api: Api<RawApi>,
  style: PostTemplate,
  draft: DraftFields,
): Promise<void> {
  const text = draft.generatedPost!;
  const title = draft.draftTitle!;
  const imageUrl = draft.draftImageUrl!;
  const previewBuffer = draft.generatedImage!;

  let imageBuffer: Buffer;
  if (style === PostTemplate.None) {
    imageBuffer = Buffer.from(previewBuffer);
  } else {
    const rendered = await ImageService.create(title, imageUrl, style);
    imageBuffer = rendered ?? (await urlToBuffer(imageUrl));
  }

  await api.sendPhoto(
    CHANNEL_ID,
    new InputFile(Readable.from(imageBuffer), "post.jpg"),
    {
      caption: markdownToHtml(text),
      parse_mode: "HTML",
    },
  );
}

export async function stripAdminDraftKeyboard(
  api: Api<RawApi>,
  chatId: number | undefined | null,
  messageId: number | undefined | null,
): Promise<void> {
  if (chatId == null || messageId == null) {
    return;
  }
  try {
    await api.editMessageReplyMarkup(chatId, messageId, {
      reply_markup: { inline_keyboard: [] },
    });
  } catch {
    /* разметка уже снята или сообщение недоступно */
  }
}
