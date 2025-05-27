import Parser from "rss-parser";
import { NewsStore } from "store/news/news.store";

const parser = new Parser();

export const DotesportsParser = {
  parse: async (): Promise<{ content: string; imageUrl: string }> => {
    console.log("Парсинг DotEsports RSS");
    try {
      const feed = await parser.parseURL("https://dotesports.com/dota-2/feed");
      const existedNews = NewsStore.getAll();

      const firstNewPost = feed.items.find(
        (item) => item.title && !existedNews.includes(item.title),
      );

      if (firstNewPost && firstNewPost.title) {
        NewsStore.add(firstNewPost.title);

        const content =
          firstNewPost.contentSnippet || firstNewPost.content || "";
        const imageMatch = firstNewPost.content?.match(/<img.*?src="(.*?)"/);
        const imageUrl = imageMatch ? imageMatch[1] : "";

        return { content, imageUrl };
      }
    } catch (error) {
      console.error("DotEsportsParser error", error);
    }

    return { content: "", imageUrl: "" };
  },
};
