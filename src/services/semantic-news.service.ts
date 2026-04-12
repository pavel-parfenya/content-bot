import { DeepseekService } from "services/deepseek.service";
import { NewsStore } from "db/news";

const MAX_EXISTING_TITLES = 400;
/** Сколько следующих по списку новостей проверить на уникальность по смыслу. */
export const MAX_NEWS_PICK_ATTEMPTS = 5;

export type NewsPickResult =
  | { kind: "ok"; title: string }
  /** Все проверенные кандидаты оказались дублями по смыслу. */
  | { kind: "no_unique" }
  | { kind: "empty" };

export async function pickFirstNonDuplicateTitle(
  candidates: string[],
): Promise<NewsPickResult> {
  if (candidates.length === 0) {
    return { kind: "empty" };
  }
  const existingTitles = await NewsStore.getAll();
  const slice = existingTitles.slice(-MAX_EXISTING_TITLES);

  for (const candidate of candidates.slice(0, MAX_NEWS_PICK_ATTEMPTS)) {
    if (await DeepseekService.isJunkListingTitle(candidate)) {
      console.log("Пропуск заголовка (реклама/квиз/розыгрыш):", candidate);
      await NewsStore.add(candidate);
      continue;
    }
    const r = await DeepseekService.compareSemanticDuplicate(
      candidate,
      slice,
    );
    if (!r.duplicate) {
      return { kind: "ok", title: candidate };
    }
  }

  return { kind: "no_unique" };
}
