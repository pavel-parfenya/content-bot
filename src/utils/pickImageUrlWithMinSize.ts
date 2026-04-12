import { getImageResolution } from "utils/getImageResolution";

/** Минимум для «картинки со страницы новости»; иначе — превью из списка. */
const MIN_WIDTH = 266;
const MIN_HEIGHT = 165;

/**
 * Возвращает primary, если картинка по URL тянется и оба измерения ≥ порога;
 * иначе fallback (превью со списка). При ошибке загрузки или пустом primary — fallback.
 * Если fallback пуст, остаётся primary (лучше маленькая картинка, чем никакой).
 */
export async function pickImageUrlWithMinSize(
  primary: string,
  fallback: string,
): Promise<string> {
  const p = primary?.trim() ?? "";
  const f = fallback?.trim() ?? "";
  if (!p) {
    return f;
  }
  try {
    const dim = await getImageResolution(p);
    const w = dim.width ?? 0;
    const h = dim.height ?? 0;
    if (w >= MIN_WIDTH && h >= MIN_HEIGHT) {
      return p;
    }
  } catch {
    /* не загрузилось или не изображение */
  }
  return f || p;
}
