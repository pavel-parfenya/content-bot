import type { Page } from "puppeteer";
import { absolutizeUrl } from "utils/absolutizeUrl";

/**
 * Картинка со страницы новости: og/twitter → img в блоке контента → img в article.
 * Пустая строка, если не найдено.
 */
export async function extractImageUrlFromArticlePage(
  page: Page,
  contentSelector: string,
): Promise<string> {
  const base = page.url();

  const ogHandle = await page.$('meta[property="og:image"]');
  const og = ogHandle
    ? await ogHandle.evaluate((el) => el.getAttribute("content")?.trim() ?? "")
    : "";
  if (og) {
    return absolutizeUrl(og, base);
  }

  const twHandle = await page.$('meta[name="twitter:image"]');
  const tw = twHandle
    ? await twHandle.evaluate((el) => el.getAttribute("content")?.trim() ?? "")
    : "";
  if (tw) {
    return absolutizeUrl(tw, base);
  }

  const inContent = await page
    .$eval(contentSelector, (root) => {
      const img = root.querySelector("img");
      if (!img) {
        return "";
      }
      return (
        img.getAttribute("src")?.trim() ||
        img.getAttribute("data-src")?.trim() ||
        img.getAttribute("data-lazy-src")?.trim() ||
        ""
      );
    })
    .catch(() => "");
  if (inContent) {
    return absolutizeUrl(inContent, base);
  }

  const articleImg = await page
    .$$eval("article img", (imgs) => {
      for (const img of imgs) {
        const s =
          img.getAttribute("src")?.trim() ||
          img.getAttribute("data-src")?.trim() ||
          img.getAttribute("data-lazy-src")?.trim() ||
          "";
        if (s) {
          return s;
        }
      }
      return "";
    })
    .catch(() => "");

  if (articleImg) {
    return absolutizeUrl(articleImg, base);
  }

  return "";
}
