import { env } from "config";
import { postTemplateLabel, PostTemplate } from "constants/post-template";
import type { Api, RawApi } from "grammy";
import {
  publishDraftToChannel,
  stripAdminDraftKeyboard,
} from "services/publish-draft.service";
import SessionStore from "store/session/session.store";
import { pickAutoPublishTemplate } from "utils/pickAutoPublishTemplate";

const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;
const ADMIN_ID = env.TELEGRAM_ADMIN_ID;

const AUTO_PUBLISH_MS = 5 * 60 * 1000;

const pending = new Map<string, ReturnType<typeof setTimeout>>();

export function clearDraftAutoPublish(draftId: string | undefined | null): void {
  if (!draftId) {
    return;
  }
  const t = pending.get(draftId);
  if (t) {
    clearTimeout(t);
    pending.delete(draftId);
  }
}

export function scheduleDraftAutoPublish(
  draftId: string,
  api: Api<RawApi>,
): void {
  clearDraftAutoPublish(draftId);
  const timer = setTimeout(() => {
    pending.delete(draftId);
    void runAutoPublish(api, draftId);
  }, AUTO_PUBLISH_MS);
  pending.set(draftId, timer);
}

async function runAutoPublish(
  api: Api<RawApi>,
  draftId: string,
): Promise<void> {
  const session = SessionStore.get(CHANNEL_ID);
  if (session?.draftId !== draftId) {
    return;
  }

  const text = session.generatedPost;
  const title = session.draftTitle;
  const imageUrl = session.draftImageUrl;
  const previewBuffer = session.generatedImage;
  if (!text || !title || !imageUrl || !previewBuffer) {
    return;
  }

  const style = await pickAutoPublishTemplate(Buffer.from(previewBuffer));

  try {
    await publishDraftToChannel(api, style, session);
    clearDraftAutoPublish(draftId);
    SessionStore.clear(CHANNEL_ID);
    await stripAdminDraftKeyboard(
      api,
      session.adminPreviewChatId,
      session.adminPreviewMessageId,
    );
    await api.sendMessage(
      ADMIN_ID,
      `✅ Пост опубликован автоматически («${postTemplateLabel(style)}»). Таймаут 5 мин без выбора.`,
    );
  } catch (error) {
    await api.sendMessage(
      ADMIN_ID,
      `❌ Автопубликация не удалась: ${error}`,
    );
  }
}
