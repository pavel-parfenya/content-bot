import * as cheerio from "cheerio";
import { absolutizeUrl } from "utils/absolutizeUrl";

function pickSrcFromImgEl($img: { attr: (name: string) => string | undefined }): string {
  const src =
    $img.attr("src")?.trim() ||
    $img.attr("data-src")?.trim() ||
    $img.attr("data-lazy-src")?.trim() ||
    "";
  return src;
}

/** Картинка из HTML страницы новости (axios + cheerio). */
export function extractImageUrlFromArticleHtml(
  html: string,
  baseUrl: string,
): string {
  const $ = cheerio.load(html);

  const og = $('meta[property="og:image"]').attr("content")?.trim() ?? "";
  if (og) {
    return absolutizeUrl(og, baseUrl);
  }

  const tw = $('meta[name="twitter:image"]').attr("content")?.trim() ?? "";
  if (tw) {
    return absolutizeUrl(tw, baseUrl);
  }

  for (const sel of [
    "article img",
    ".post-content img",
    ".text-content img",
    '[itemprop="articleBody"] img',
  ]) {
    const $img = $(sel).first();
    if ($img.length) {
      const s = pickSrcFromImgEl($img);
      if (s && !s.startsWith("data:")) {
        return absolutizeUrl(s, baseUrl);
      }
    }
  }

  const any = $("body img[src]").first();
  if (any.length) {
    const s = pickSrcFromImgEl(any);
    if (s && !s.startsWith("data:")) {
      return absolutizeUrl(s, baseUrl);
    }
  }

  return "";
}
