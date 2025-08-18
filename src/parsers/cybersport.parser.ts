import puppeteer from "puppeteer";
import { NewsStore } from "store/news/news.store";
import { delay } from "utils/delay";

class CyberSportParser {
  private url = "https://www.cybersport.ru";
  private topicLink?: string | null;
  private imageUrl?: string | null;

  async getTopicUrl() {
    console.log("Парсинг cybersport.ru");

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "shell",
    });

    try {
      const page = await browser.newPage();
      await page.goto(`${this.url}/tags/dota-2`);
      await delay(1000);
      const newsElements = await page.$$(".rounded-block > article > a");
      const news = await page.$$eval(".rounded-block article a h3", (els) =>
        els.map((el) => el.innerHTML.trim()),
      );
      const existedNews = NewsStore.getAll();
      const title = news.find((newsItem) => !existedNews.includes(newsItem));

      if (title) {
        NewsStore.add(title);
        const titleIndex = news.indexOf(title);
        const currentElement = newsElements[titleIndex];

        this.topicLink = await currentElement?.evaluate((el) =>
          el.getAttribute("href"),
        );

        const img = await currentElement.$("" + "img");
        this.imageUrl = await img?.evaluate((el) => el.getAttribute("src"));
      }
    } catch (error) {
      console.error("Parser error", error);
    } finally {
      await browser.close();
    }
  }

  async parse(): Promise<{ content: string; imageUrl: string }> {
    await this.getTopicUrl();

    console.log(1);
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "shell",
    });
    console.log(2);
    const page = await browser.newPage();
    console.log(3, `${this.url}${this.topicLink}`);
    await page.goto(`${this.url}${this.topicLink}`);
    console.log(4);
    await delay(1000);
    const content = await page.$eval(".text-content", (el) =>
      el.innerHTML.trim(),
    );
    console.log(5);
    await browser.close();
    console.log(this.imageUrl);
    return { content, imageUrl: this.imageUrl || "" };
  }
}

export const cyberSportParser = new CyberSportParser();
