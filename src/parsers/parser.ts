import puppeteer from "puppeteer";
import { NewsStore } from "store/news/news.store";
import { delay } from "utils/delay";

export class Parser {
  constructor(
    private readonly url: string,
    private readonly linkSelector: string,
    private readonly titleSelector: string,
    private readonly contentSelector: string,
    private readonly adjustUrl: boolean = false,
    private readonly urlSuffix: string = "",
  ) {}

  private topicLink?: string | null;
  private imageUrl?: string | null;

  async getTopicUrl() {
    console.log(`Парсинг ${this.url}`);

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "shell",
    });

    try {
      const page = await browser.newPage();
      await page.goto(`${this.url}${this.urlSuffix}`);
      await delay(1000);
      const newsElements = await page.$$(this.linkSelector);
      const news = await page.$$eval(this.titleSelector, (els) =>
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

        const img = await currentElement.$("img");
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

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "shell",
    });
    const page = await browser.newPage();
    await page.goto(
      this.adjustUrl ? `${this.url}${this.topicLink}` : `${this.topicLink}`,
    );
    await delay(1000);
    const content = await page.$eval(this.contentSelector, (el) =>
      el.innerHTML.trim(),
    );
    await browser.close();
    return { content, imageUrl: this.imageUrl || "" };
  }
}
