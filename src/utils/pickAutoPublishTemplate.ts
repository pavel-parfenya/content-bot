import { PostTemplate } from "constants/post-template";
import { isImageGoodForFullBleed } from "utils/isImageGoodForFullBleed";

/**
 * Автовыбор шаблона после таймаута: те же критерии, что и кнопка «Фон»;
 * иначе 50/50 «Классика» / «Без шаблона».
 */
export async function pickAutoPublishTemplate(
  buffer: Buffer,
): Promise<PostTemplate> {
  if (await isImageGoodForFullBleed(buffer)) {
    return PostTemplate.Alt;
  }
  return Math.random() < 0.5 ? PostTemplate.Classic : PostTemplate.None;
}
