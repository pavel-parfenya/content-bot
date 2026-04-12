import puppeteer from "puppeteer";
import { pickFirstNonDuplicateTitle } from "services/semantic-news.service";
import { NewsStore } from "db/news";
import { absolutizeUrl } from "utils/absolutizeUrl";
import { extractImageUrlFromArticlePage } from "utils/articleImageFromPage";
import { pickImageUrlWithMinSize } from "utils/pickImageUrlWithMinSize";
import { puppeteerLaunchOptions } from "utils/puppeteerLaunch";

export class Dota2RuParser {
  async parse(): Promise<{
    content: string;
    imageUrl: string;
    newsNotFound?: boolean;
  }> {
    console.log("Парсинг dota2.ru");
    const browser = await puppeteer.launch(puppeteerLaunchOptions);
    try {
      const page = await browser.newPage();

      await page.goto("https://dota2.ru/news/");
      const newsElements = await page.$$(".index__news-item");
      const news = await page.$$eval(
        ".index__news-item .index__news-name",
        (els) => els.map((el) => el.innerHTML.trim()),
      );
      const pick = await pickFirstNonDuplicateTitle(news);
      if (pick.kind === "empty") {
        return { content: "", imageUrl: "" };
      }
      if (pick.kind === "no_unique") {
        return { content: "", imageUrl: "", newsNotFound: true };
      }
      const title = pick.title;
      if (title) {
        await NewsStore.add(title);
        const titleIndex = news.indexOf(title);
        const currentElement = newsElements[titleIndex];
        const img = await currentElement.$(".index__news-img");
        const rawListing = await img?.evaluate((el) => el.getAttribute("src"));
        const imageUrl = rawListing
          ? absolutizeUrl(rawListing, page.url())
          : "";
        await currentElement.click();
        await page.waitForSelector("main.global-main.container.news-news");
        const contentSelector = "section.global-main__wrap.news-news__main";
        const content = await page.$eval(contentSelector, (el) =>
          el.innerHTML.trim(),
        );
        const fromArticle = await extractImageUrlFromArticlePage(
          page,
          contentSelector,
        );
        const picked = await pickImageUrlWithMinSize(
          fromArticle,
          imageUrl ?? "",
        );
        return { content, imageUrl: picked };
      }
    } catch (error) {
      console.error("Parser error", error);
    } finally {
      await browser.close();
    }

    return { content: "", imageUrl: "" };
  }
}

export const dota2RuParser = new Dota2RuParser();
