import sharp from "sharp";

const MIN_SIDE = 1280;
/** JPEG/WebP: слишком мало байт на пиксель — заметные блоки/артефакты при показе на 1280×1280. */
const MIN_BYTES_PER_PIXEL_LOSSY = 0.03;

/**
 * Подходит ли исходник для шаблона «Фон» (post-alt):
 * без апскейла под cover 1280×1280 и без явно «жатого» JPEG/WebP.
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
  if (w < MIN_SIDE || h < MIN_SIDE) {
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
