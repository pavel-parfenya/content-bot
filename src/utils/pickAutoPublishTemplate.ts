import { PostTemplate } from "constants/post-template";
import sharp from "sharp";

/** Минимум стороны: при достаточном размере автоматически выбираем «Фон». */
const MIN_SIDE_FOR_BACKGROUND = 1280;

/**
 * Автовыбор шаблона после таймаута: при min(w,h) ≥ порога — «Фон», иначе 50/50 «Классика» / «Без шаблона».
 */
export async function pickAutoPublishTemplate(
  buffer: Buffer,
): Promise<PostTemplate> {
  try {
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (Math.min(w, h) >= MIN_SIDE_FOR_BACKGROUND) {
      return PostTemplate.Alt;
    }
  } catch {
    /* fallback ниже */
  }
  return Math.random() < 0.5 ? PostTemplate.Classic : PostTemplate.None;
}
