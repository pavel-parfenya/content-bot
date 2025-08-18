import puppeteer from "puppeteer";
import { NewsStore } from "store/news/news.store";
import { delay } from "utils/delay";

export class CyberSportsParser {
  async parse(): Promise<{ content: string; imageUrl: string }> {
    console.log("Парсинг cyber.sports.ru");
    try {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "shell",
      });
      const page = await browser.newPage();

      await page.goto("https://cyber.sports.ru/dota2/");
      const newsElements = await page.$$(
        "main.columns-layout__main article h2 a",
      );
      const news = await page.$$eval(".material-list__title a", (els) =>
        els.map((el) => el.innerHTML.trim()),
      );

      const existedNews = NewsStore.getAll();

      const title = news.find((newsItem) => !existedNews.includes(newsItem));
      if (title) {
        NewsStore.add(title);
        const titleIndex = news.indexOf(title);
        const currentElement = newsElements[titleIndex];
        const img = await currentElement.$(".material-list__item-img");
        const imageUrl = await img?.evaluate((el) => el.getAttribute("src"));
        await currentElement.click();
        await delay(5000);
        const content = await page.$eval(".post-content", (el) =>
          el.innerHTML.trim(),
        );

        await browser.close();
        return { content, imageUrl: imageUrl || "" };
      }
    } catch (error) {
      console.error("Parser error", error);
    }

    return { content: "", imageUrl: "" };
  }
}

export const cyberSportsParser = new CyberSportsParser();
