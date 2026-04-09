import puppeteer from "puppeteer";
import { pickFirstNonDuplicateTitle } from "services/semantic-news.service";
import { NewsStore } from "db/news";
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
        const imageUrl = await img?.evaluate((el) => el.getAttribute("src"));
        await currentElement.click();
        await page.waitForSelector("main.global-main.container.news-news");
        const content = await page.$eval(
          "section.global-main__wrap.news-news__main",
          (el) => el.innerHTML.trim(),
        );

        return { content, imageUrl: imageUrl || "" };
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
