import axios from "axios";
import * as cheerio from "cheerio";
import { pickFirstNonDuplicateTitle } from "services/semantic-news.service";
import { NewsStore } from "db/news";
import { absolutizeUrl } from "utils/absolutizeUrl";
import { extractImageUrlFromArticleHtml } from "utils/articleImageFromHtml";
import { pickImageUrlWithMinSize } from "utils/pickImageUrlWithMinSize";

const TAG_URL = "https://hawk.live/ru/tags/dota-2-news";

const http = axios.create({
  timeout: 45000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; ContentBot/1.0; +https://hawk.live)",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
  },
});

type HawkPost = {
  title: string;
  slug: string;
  image?: { url?: string };
};

function parseListingPosts(html: string): HawkPost[] {
  const $ = cheerio.load(html);
  const raw = $("#app").attr("data-page");
  if (!raw) {
    return [];
  }
  try {
    const page = JSON.parse(raw) as {
      props?: { posts?: HawkPost[] };
    };
    return page.props?.posts ?? [];
  } catch {
    return [];
  }
}

function extractArticleBody(html: string): string {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');
  for (const el of scripts.toArray()) {
    const text = $(el).html();
    if (!text) {
      continue;
    }
    try {
      const data = JSON.parse(text.trim()) as unknown;
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        if (
          typeof node === "object" &&
          node !== null &&
          (node as { "@type"?: string })["@type"] === "NewsArticle" &&
          typeof (node as { articleBody?: string }).articleBody === "string"
        ) {
          return (node as { articleBody: string }).articleBody;
        }
      }
    } catch {
      continue;
    }
  }
  return "";
}

export const hawkLiveParser = {
  async parse(): Promise<{
    content: string;
    imageUrl: string;
    newsNotFound?: boolean;
  }> {
    console.log("Парсинг Hawk Live (dota-2-news)");
    try {
      const { data: listHtml } = await http.get<string>(TAG_URL);
      const posts = parseListingPosts(listHtml);
      if (posts.length === 0) {
        return { content: "", imageUrl: "" };
      }

      const titles = posts.map((p) => p.title);
      const pick = await pickFirstNonDuplicateTitle(titles);
      if (pick.kind === "empty") {
        return { content: "", imageUrl: "" };
      }
      if (pick.kind === "no_unique") {
        return { content: "", imageUrl: "", newsNotFound: true };
      }

      const chosen = posts.find((p) => p.title === pick.title);
      if (!chosen) {
        return { content: "", imageUrl: "" };
      }

      await NewsStore.add(pick.title);

      const articleUrl = `https://hawk.live/ru/posts/${chosen.slug}`;
      const { data: postHtml } = await http.get<string>(articleUrl);
      let content = extractArticleBody(postHtml);
      if (!content.trim()) {
        content = `<p>${chosen.title}</p>`;
      }

      const listingRaw = chosen.image?.url?.trim() ?? "";
      const listingImage = listingRaw
        ? absolutizeUrl(listingRaw, TAG_URL)
        : "";
      const fromArticle = extractImageUrlFromArticleHtml(postHtml, articleUrl);
      const imageUrl = await pickImageUrlWithMinSize(fromArticle, listingImage);
      return { content, imageUrl };
    } catch (error) {
      console.error("Hawk Live parser error", error);
      return { content: "", imageUrl: "" };
    }
  },
};
