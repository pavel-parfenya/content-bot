import sharp from "sharp";

/** Минимальный размер исходника для шаблона «Фон» (ниже — только «Классика» / «Без шаблона»). */
const MIN_WIDTH = 728;
const MIN_HEIGHT = 381;

/** JPEG/WebP: порог «слишком жёсткого» сжатия (смягчён относительно 1280×1280). */
const MIN_BYTES_PER_PIXEL_LOSSY = 0.018;

/**
 * Подходит ли исходник для шаблона «Фон» (post-alt, вьюпорт рендера 1280×1280).
 * Меньшие картинки допускаются до MIN_WIDTH×MIN_HEIGHT; возможен апскейл в макете.
 */
export async function isImageGoodForFullBleed(
  buffer: Buffer,
): Promise<boolean> {
  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    return false;
  }

  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < MIN_WIDTH || h < MIN_HEIGHT) {
    return false;
  }

  const fmt = (meta.format ?? "").toLowerCase();
  const lossy =
    fmt === "jpeg" || fmt === "jpg" || fmt === "webp" || fmt === "avif";

  if (lossy) {
    const bpp = buffer.length / (w * h);
    if (bpp < MIN_BYTES_PER_PIXEL_LOSSY) {
      return false;
    }
  }

  return true;
}
