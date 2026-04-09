import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  waitingForPrompt?: boolean;
  generatedPost?: string | null;
  /** Превью: исходное фото новости (без шаблона). */
  generatedImage?: Buffer<ArrayBufferLike> | null;
  /** Для рендера классика/фон после выбора. */
  draftTitle?: string | null;
  draftImageUrl?: string | null;
  /** Доступен шаблон «Фон» (post-alt): исходник ок для полноэкранного кадра 1280×1280. */
  allowsBackgroundTemplate?: boolean;
  /** Идентификатор черновика для таймаута автопубликации. */
  draftId?: string | null;
  adminPreviewChatId?: number | null;
  adminPreviewMessageId?: number | null;
}

export type MyContext = Context & SessionFlavor<SessionData>;
