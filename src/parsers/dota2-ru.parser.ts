import puppeteer from "puppeteer";
import { NewsStore } from "store/news/news.store";

export const Dota2RuParser = {
  parse: async (): Promise<{ content: string; imageUrl: string }> => {
    console.log("Парсинг dota2.ru");
    try {
      const browser = await puppeteer.launch({ headless: "shell" });
      const page = await browser.newPage();

      await page.goto("https://dota2.ru/news/");
      const newsElements = await page.$$(".index__news-item");
      const news = await page.$$eval(
        ".index__news-item .index__news-name",
        (els) => els.map((el) => el.innerHTML.trim()),
      );
      const existedNews = NewsStore.getAll();

      const title = news.find((newsItem) => !existedNews.includes(newsItem));
      if (title) {
        NewsStore.add(title);
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

        await browser.close();
        return { content, imageUrl: imageUrl || "" };
      }
    } catch (error) {
      console.error("Parser error", error);
    }

    return { content: "", imageUrl: "" };
  },
};
