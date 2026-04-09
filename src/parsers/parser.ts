import puppeteer from "puppeteer";
import { pickFirstNonDuplicateTitle } from "services/semantic-news.service";
import { NewsStore } from "db/news";
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
  private newsNotFound?: boolean;

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
      this.newsNotFound = undefined;
      const pick = await pickFirstNonDuplicateTitle(news);
      if (pick.kind === "empty") {
        return;
      }
      if (pick.kind === "no_unique") {
        this.newsNotFound = true;
        return;
      }
      const title = pick.title;

      if (title) {
        await NewsStore.add(title);
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

  async parse(): Promise<{
    content: string;
    imageUrl: string;
    newsNotFound?: boolean;
  }> {
    await this.getTopicUrl();

    if (this.newsNotFound) {
      return { content: "", imageUrl: "", newsNotFound: true };
    }
    if (!this.topicLink) {
      return { content: "", imageUrl: "" };
    }

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
