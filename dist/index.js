"use strict";
require("dotenv/config");
const grammy = require("grammy");
const dotenv = require("dotenv");
const path = require("path");
const puppeteer = require("puppeteer");
const axios = require("axios");
const stream = require("stream");
const sharp = require("sharp");
const crypto = require("crypto");
const pg = require("pg");
const cheerio = require("cheerio");
const cron = require("node-cron");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const cheerio__namespace = /* @__PURE__ */ _interopNamespaceDefault(cheerio);
var Source = /* @__PURE__ */ ((Source2) => {
  Source2["Dota2Ru"] = "Dota2Ru";
  Source2["CyberSportsParser"] = "CyberSportsParser";
  Source2["CyberSportParser"] = "CyberSportParser";
  Source2["HawkLive"] = "HawkLive";
  return Source2;
})(Source || {});
async function generateCommand(ctx) {
  const keyboard = new grammy.InlineKeyboard();
  Object.values(Source).forEach((source) => {
    keyboard.text(source, `source:${source}`).row();
  });
  await ctx.reply("Выберите источник:", {
    reply_markup: keyboard
  });
}
async function startCommand(ctx) {
  await ctx.reply(
    "Привет! Напиши мне новость или команду для генерации поста."
  );
}
dotenv.config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env"
});
const env = {
  TELEGRAM_BOT_TOKEN: process.env.BOT_TOKEN,
  TELEGRAM_CHANEL_ID: process.env.CHANEL_ID,
  TELEGRAM_ADMIN_ID: process.env.ADMIN_ID,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "dev",
  POST_FREQ_MINUTES: process.env.POST_FREQ_MINUTES,
  DATABASE_URL: process.env.DATABASE_URL
};
var PostTemplate = /* @__PURE__ */ ((PostTemplate2) => {
  PostTemplate2["Classic"] = "Classic";
  PostTemplate2["Alt"] = "Alt";
  PostTemplate2["None"] = "None";
  return PostTemplate2;
})(PostTemplate || {});
function postTemplateLabel(t) {
  switch (t) {
    case "Classic":
      return "Классика";
    case "Alt":
      return "Фон";
    case "None":
      return "Без шаблона";
  }
}
async function fetchImageBase64(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const base64 = Buffer.from(response.data).toString("base64");
  const mime = response.headers["content-type"];
  return `data:${mime};base64,${base64}`;
}
const TEMPLATE_HTML = {
  [PostTemplate.Classic]: "post.html",
  [PostTemplate.Alt]: "post-alt.html"
};
const ImageService = {
  create: async (title, imageUrl, template = PostTemplate.Classic) => {
    const base64ImageUrl = await fetchImageBase64(imageUrl);
    if (base64ImageUrl) {
      const fileName = TEMPLATE_HTML[template];
      const absolutePath = path.join(process.cwd(), "dist", fileName);
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "shell"
      });
      const page = await browser.newPage();
      await page.setViewport({
        width: 1280,
        height: 1280,
        deviceScaleFactor: 1
      });
      await page.goto(`file://${absolutePath}`, { waitUntil: "networkidle0" });
      await page.evaluate(
        (title2, imageSrc) => {
          const heading = document.getElementById("title");
          if (heading) heading.textContent = title2;
          const image = document.getElementById("image");
          if (image) image.setAttribute("src", imageSrc);
        },
        title,
        base64ImageUrl
      );
      const buffer = await page.screenshot({ type: "png" });
      await browser.close();
      return Buffer.from(buffer);
    }
    return null;
  }
};
function markdownToHtml(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/_(.+?)_/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>");
}
async function urlToBuffer(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer"
  });
  return Buffer.from(response.data);
}
const CHANNEL_ID$4 = env.TELEGRAM_CHANEL_ID;
async function publishDraftToChannel(api, style, draft) {
  const text = draft.generatedPost;
  const title = draft.draftTitle;
  const imageUrl = draft.draftImageUrl;
  const previewBuffer = draft.generatedImage;
  let imageBuffer;
  if (style === PostTemplate.None) {
    imageBuffer = Buffer.from(previewBuffer);
  } else {
    const rendered = await ImageService.create(title, imageUrl, style);
    imageBuffer = rendered ?? await urlToBuffer(imageUrl);
  }
  await api.sendPhoto(
    CHANNEL_ID$4,
    new grammy.InputFile(stream.Readable.from(imageBuffer), "post.jpg"),
    {
      caption: markdownToHtml(text),
      parse_mode: "HTML"
    }
  );
}
async function stripAdminDraftKeyboard(api, chatId, messageId) {
  if (chatId == null || messageId == null) {
    return;
  }
  try {
    await api.editMessageReplyMarkup(chatId, messageId, {
      reply_markup: { inline_keyboard: [] }
    });
  } catch {
  }
}
class SessionStore {
  constructor(data) {
    this.data = data;
  }
  set(id, data) {
    this.data.set(id, data);
  }
  get(id) {
    return this.data.get(id);
  }
  clear(id) {
    this.data.set(id, void 0);
  }
}
const SessionStore$1 = new SessionStore(/* @__PURE__ */ new Map());
const MIN_SIDE_FOR_BACKGROUND = 1280;
async function pickAutoPublishTemplate(buffer) {
  try {
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (Math.min(w, h) >= MIN_SIDE_FOR_BACKGROUND) {
      return PostTemplate.Alt;
    }
  } catch {
  }
  return Math.random() < 0.5 ? PostTemplate.Classic : PostTemplate.None;
}
const CHANNEL_ID$3 = env.TELEGRAM_CHANEL_ID;
const ADMIN_ID$1 = env.TELEGRAM_ADMIN_ID;
const AUTO_PUBLISH_MS = 5 * 60 * 1e3;
const pending = /* @__PURE__ */ new Map();
function clearDraftAutoPublish(draftId) {
  if (!draftId) {
    return;
  }
  const t = pending.get(draftId);
  if (t) {
    clearTimeout(t);
    pending.delete(draftId);
  }
}
function scheduleDraftAutoPublish(draftId, api) {
  clearDraftAutoPublish(draftId);
  const timer = setTimeout(() => {
    pending.delete(draftId);
    void runAutoPublish(api, draftId);
  }, AUTO_PUBLISH_MS);
  pending.set(draftId, timer);
}
async function runAutoPublish(api, draftId) {
  const session = SessionStore$1.get(CHANNEL_ID$3);
  if (session?.draftId !== draftId) {
    return;
  }
  const text = session.generatedPost;
  const title = session.draftTitle;
  const imageUrl = session.draftImageUrl;
  const previewBuffer = session.generatedImage;
  if (!text || !title || !imageUrl || !previewBuffer) {
    return;
  }
  const style = await pickAutoPublishTemplate(Buffer.from(previewBuffer));
  try {
    await publishDraftToChannel(api, style, session);
    clearDraftAutoPublish(draftId);
    SessionStore$1.clear(CHANNEL_ID$3);
    await stripAdminDraftKeyboard(
      api,
      session.adminPreviewChatId,
      session.adminPreviewMessageId
    );
    await api.sendMessage(
      ADMIN_ID$1,
      `✅ Пост опубликован автоматически («${postTemplateLabel(style)}»). Таймаут 5 мин без выбора.`
    );
  } catch (error) {
    await api.sendMessage(
      ADMIN_ID$1,
      `❌ Автопубликация не удалась: ${error}`
    );
  }
}
const CHANNEL_ID$2 = env.TELEGRAM_CHANEL_ID;
const cancelEvent = async (ctx) => {
  await ctx.answerCallbackQuery({ text: "Отменено" });
  const session = SessionStore$1.get(CHANNEL_ID$2);
  clearDraftAutoPublish(session?.draftId);
  SessionStore$1.clear(CHANNEL_ID$2);
  try {
    await ctx.editMessageReplyMarkup({
      reply_markup: { inline_keyboard: [] }
    });
  } catch {
  }
};
const CHANNEL_ID$1 = env.TELEGRAM_CHANEL_ID;
const VALID_STYLES = new Set(Object.values(PostTemplate));
const publishStyleEvent = async (ctx) => {
  const key = ctx.callbackQuery?.data?.replace("publish:", "") ?? "";
  if (!VALID_STYLES.has(key)) {
    await ctx.answerCallbackQuery({ text: "Неизвестный вариант" });
    return;
  }
  const style = key;
  await ctx.answerCallbackQuery();
  const session = SessionStore$1.get(CHANNEL_ID$1);
  const text = session?.generatedPost;
  const title = session?.draftTitle;
  const imageUrl = session?.draftImageUrl;
  const previewBuffer = session?.generatedImage;
  if (!text || !title || !imageUrl || !previewBuffer) {
    await ctx.reply("❌ Черновик устарел. Сгенерируйте пост заново.");
    return;
  }
  if (style === PostTemplate.Alt && session?.allowsBackgroundTemplate !== true) {
    await ctx.reply(
      "❌ Шаблон «Фон» недоступен: исходник слишком маленький или сильно сжат для полноэкранного кадра."
    );
    return;
  }
  const draftId = session.draftId;
  try {
    await publishDraftToChannel(ctx.api, style, session);
    clearDraftAutoPublish(draftId);
    SessionStore$1.clear(CHANNEL_ID$1);
    await stripAdminDraftKeyboard(
      ctx.api,
      ctx.chat?.id,
      ctx.callbackQuery?.message?.message_id
    );
    await ctx.reply("✅ Пост опубликован!");
  } catch (error) {
    await ctx.reply(`❌ Не удалось опубликовать. ${error}`);
  }
};
const duplicateCheckSystemPrompt = `
Ты сравниваешь заголовки новостей для дедупликации.
Нужно определить, означает ли заголовок кандидата ту же самую новость (тот же инфоповод, та же история, тот же матч или тот же инцидент), что и один из заголовков из списка уже опубликованных.
Мелкие отличия в формулировке, HTML-сущности (&nbsp; и т.п.), пунктуация или порядок слов не делают новость другой — важно совпадение смысла и фактов.
Если кандидат — это пересказ или обновление той же истории, что уже есть в списке, это дубликат.

Ответь СТРОГО одним JSON-объектом, без текста до или после, без markdown:
{"duplicate":true или false,"similarTitle":null или "точная строка из входного списка уже опубликованных заголовков, с которой совпадает смысл"}
Если duplicate=false, поле similarTitle должно быть null.
Если duplicate=true, similarTitle — один из заголовков из переданного списка (копируй дословно из списка).
`.trim();
const systemPrompt = `
Ты — профессиональный контент-мейкер и редактор топового Telegram-канала про киберспорт и Dota 2.
Ты пишешь так, как сильные SMM-редакторы и шеф-редакторы игровых медиа: ясно, по делу, с ритмом и удержанием внимания, без сюсюканья и без токсичности.

Твоя задача — пересказывать новость так, чтобы читатель сразу понял суть и захотел дочитать. Стиль — уверенный, современный, «живой», но не кричащий и не кликбейтный.

Жёсткие правила по содержанию:
- Не меняй смысл, не добавляй факты, дат, имён, цифр и выводов, которых нет во входном материале.
- Не смягчай и не обостряй смысл ради эффекта. Не приписывай людям слова и позиции, если их не было в источнике.
- Если во входе не хватает деталей — не выдумывай; кратко опирайся только на то, что дано.
- Не упоминай источник, сайт, «по данным» и откуда взята информация.

Формат и подача:
- Один связный текст до 500 символов, на русском.
- Сначала сильная первая мысль или контекст (что случилось и почему это важно), дальше факты по сути, без лишней воды.
- Уместные эмодзи — точечно, не перегружай строку.
- Лёгкое оформление: **жирный** для ключевых слов, *курсив* для акцентов, \`код\` для цифр/названий турниров при необходимости (это потом станет HTML для Telegram).

Ты работаешь с темой: матчи, трансферы, патчи, турниры, интервью и инфоповоды из мира Dota 2 и киберспорта.
`.trim();
dotenv.config();
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
function extractJsonObject(text) {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  return JSON.parse(raw.trim());
}
const DeepseekService = {
  compareSemanticDuplicate: async (candidateTitle, existingTitles) => {
    if (existingTitles.length === 0) {
      return { duplicate: false, similarTitle: null };
    }
    console.log("DeepSeek: проверка дубликата по смыслу");
    const userContent = JSON.stringify(
      { candidateTitle, existingTitles },
      null,
      2
    );
    const chatRes = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: duplicateCheckSystemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0.1,
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const content = chatRes.data.choices[0].message.content.trim();
    try {
      const parsed = extractJsonObject(content);
      return {
        duplicate: Boolean(parsed.duplicate),
        similarTitle: typeof parsed.similarTitle === "string" ? parsed.similarTitle : null
      };
    } catch (e) {
      console.error("DeepSeek duplicate JSON parse error:", e, content);
      return { duplicate: false, similarTitle: null };
    }
  },
  use: async (prompt) => {
    console.log("Запрос в deepseek");
    const chatRes = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        top_p: 0.95
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    const res = chatRes.data.choices[0].message.content.trim().split("&");
    return { title: res[1], text: res[0] };
  }
};
let pool = null;
function getPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
}
const NewsStore = {
  getAll: async () => {
    const { rows } = await getPool().query(
      "SELECT title FROM news ORDER BY id ASC"
    );
    return rows.map((r) => r.title);
  },
  add: async (title) => {
    const result = await getPool().query(
      "INSERT INTO news (title) VALUES ($1) ON CONFLICT (title) DO NOTHING",
      [title]
    );
    if (result.rowCount && result.rowCount > 0) {
      console.log("Заголовок добавлен: ", title);
    } else {
      console.log("Заголовок уже существует.");
    }
  }
};
const MAX_NEWS_PICK_ATTEMPTS = 5;
async function pickFirstNonDuplicateTitle(candidates) {
  if (candidates.length === 0) {
    return { kind: "empty" };
  }
  const existingTitles = await NewsStore.getAll();
  if (existingTitles.length === 0) {
    return { kind: "ok", title: candidates[0] };
  }
  const slice = existingTitles.slice(-400);
  for (const candidate of candidates.slice(0, MAX_NEWS_PICK_ATTEMPTS)) {
    const r = await DeepseekService.compareSemanticDuplicate(
      candidate,
      slice
    );
    if (!r.duplicate) {
      return { kind: "ok", title: candidate };
    }
  }
  return { kind: "no_unique" };
}
const ParserPrompt = `
Ниже — HTML со страницы новости. Твоя роль — профессиональный контент-мейкер: сделай из этого готовый текст для Telegram, не искажая смысл и факты.

Что сделать:
1) Внимательно выдели суть: кто, что сделал, когда/где уместно, ключевой итог. Опирайся только на то, что реально есть в HTML. Ничего не придумывай и не додумывай.
2) Сожми в связный пост до 500 символов: динамично, без канцелярита и без кликбейта в заголовке. Читатель должен понять новость без оригинала.
3) Сохрани приоритет фактов: если во фрагменте есть спорные формулировки — перескажи нейтрально, не добавляя своей оценки.
4) Оформление: уместные эмодзи (немного), лёгкая структура абзацем или короткими фразами. Разметка для Telegram: **жирный**, *курсив*, \`вставки\` — как в инструкции к системе.
5) Язык — русский. Ссылки, домены и упоминания источника не выводи.
6) В тексте поста не используй символ & — он зарезервирован для разделителя ниже.

Формат ответа (обязательно):
- Сначала идёт текст поста (с разметкой и эмодзи при необходимости).
- Затем один символ & (амперсанд) без пробелов вокруг.
- Затем отдельный короткий заголовок для превью до 40 символов — без разметки, без эмодзи, без кликбейта; отражает суть новости.

Пример структуры вывода:
Текст поста с **акцентами** и эмодзи.&Короткий заголовок до сорока символов
`.trim();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class Parser {
  constructor(url, linkSelector, titleSelector, contentSelector, adjustUrl = false, urlSuffix = "") {
    this.url = url;
    this.linkSelector = linkSelector;
    this.titleSelector = titleSelector;
    this.contentSelector = contentSelector;
    this.adjustUrl = adjustUrl;
    this.urlSuffix = urlSuffix;
  }
  async getTopicUrl() {
    console.log(`Парсинг ${this.url}`);
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "shell"
    });
    try {
      const page = await browser.newPage();
      await page.goto(`${this.url}${this.urlSuffix}`);
      await delay(1e3);
      const newsElements = await page.$$(this.linkSelector);
      const news = await page.$$eval(
        this.titleSelector,
        (els) => els.map((el) => el.innerHTML.trim())
      );
      this.newsNotFound = void 0;
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
        this.topicLink = await currentElement?.evaluate(
          (el) => el.getAttribute("href")
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
  async parse() {
    await this.getTopicUrl();
    if (this.newsNotFound) {
      return { content: "", imageUrl: "", newsNotFound: true };
    }
    if (!this.topicLink) {
      return { content: "", imageUrl: "" };
    }
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "shell"
    });
    const page = await browser.newPage();
    await page.goto(
      this.adjustUrl ? `${this.url}${this.topicLink}` : `${this.topicLink}`
    );
    await delay(1e3);
    const content = await page.$eval(
      this.contentSelector,
      (el) => el.innerHTML.trim()
    );
    await browser.close();
    return { content, imageUrl: this.imageUrl || "" };
  }
}
const cyberSportsParser = new Parser(
  "https://cyber.sports.ru/dota2/",
  "main.columns-layout__main article a.material-list__item-img-link",
  ".material-list__title a",
  ".post-content",
  false
);
const cyberSportParser = new Parser(
  "https://www.cybersport.ru",
  ".rounded-block > article > a",
  ".rounded-block article a h3",
  ".text-content",
  true,
  "/tags/dota-2"
);
class Dota2RuParser {
  async parse() {
    console.log("Парсинг dota2.ru");
    try {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "shell"
      });
      const page = await browser.newPage();
      await page.goto("https://dota2.ru/news/");
      const newsElements = await page.$$(".index__news-item");
      const news = await page.$$eval(
        ".index__news-item .index__news-name",
        (els) => els.map((el) => el.innerHTML.trim())
      );
      const pick = await pickFirstNonDuplicateTitle(news);
      if (pick.kind === "empty") {
        await browser.close();
        return { content: "", imageUrl: "" };
      }
      if (pick.kind === "no_unique") {
        await browser.close();
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
          (el) => el.innerHTML.trim()
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
const dota2RuParser = new Dota2RuParser();
const TAG_URL = "https://hawk.live/ru/tags/dota-2-news";
const http = axios.create({
  timeout: 45e3,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; ContentBot/1.0; +https://hawk.live)",
    Accept: "text/html,application/xhtml+xml",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8"
  }
});
function parseListingPosts(html) {
  const $ = cheerio__namespace.load(html);
  const raw = $("#app").attr("data-page");
  if (!raw) {
    return [];
  }
  try {
    const page = JSON.parse(raw);
    return page.props?.posts ?? [];
  } catch {
    return [];
  }
}
function extractArticleBody(html) {
  const $ = cheerio__namespace.load(html);
  const scripts = $('script[type="application/ld+json"]');
  for (const el of scripts.toArray()) {
    const text = $(el).html();
    if (!text) {
      continue;
    }
    try {
      const data = JSON.parse(text.trim());
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        if (typeof node === "object" && node !== null && node["@type"] === "NewsArticle" && typeof node.articleBody === "string") {
          return node.articleBody;
        }
      }
    } catch {
      continue;
    }
  }
  return "";
}
const hawkLiveParser = {
  async parse() {
    console.log("Парсинг Hawk Live (dota-2-news)");
    try {
      const { data: listHtml } = await http.get(TAG_URL);
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
      const { data: postHtml } = await http.get(articleUrl);
      let content = extractArticleBody(postHtml);
      if (!content.trim()) {
        content = `<p>${chosen.title}</p>`;
      }
      const imageUrl = chosen.image?.url ?? "";
      return { content, imageUrl };
    } catch (error) {
      console.error("Hawk Live parser error", error);
      return { content: "", imageUrl: "" };
    }
  }
};
const getContent = async (source) => {
  switch (source) {
    case Source.Dota2Ru:
      return await dota2RuParser.parse();
    case Source.CyberSportsParser:
      return await cyberSportsParser.parse();
    case Source.CyberSportParser:
      return await cyberSportParser.parse();
    case Source.HawkLive:
      return await hawkLiveParser.parse();
  }
};
const PostService = {
  generate: async (source = Source.CyberSportParser) => {
    console.log("Генерирую пост");
    const parsed = await getContent(source);
    if (parsed.newsNotFound) {
      return {
        title: "",
        text: "",
        imageUrl: "",
        newsNotFound: true
      };
    }
    const { content, imageUrl } = parsed;
    if (content && imageUrl) {
      const { title, text } = await DeepseekService.use(
        `${ParserPrompt} HTML:${content}`
      );
      return { title, text, imageUrl };
    }
    return { title: "", text: "", imageUrl: "" };
  }
};
const MIN_SIDE = 1280;
const MIN_BYTES_PER_PIXEL_LOSSY = 0.03;
async function isImageGoodForFullBleed(buffer) {
  let meta;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    return false;
  }
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < MIN_SIDE || h < MIN_SIDE) {
    return false;
  }
  const fmt = (meta.format ?? "").toLowerCase();
  const lossy = fmt === "jpeg" || fmt === "jpg" || fmt === "webp" || fmt === "avif";
  if (lossy) {
    const bpp = buffer.length / (w * h);
    if (bpp < MIN_BYTES_PER_PIXEL_LOSSY) {
      return false;
    }
  }
  return true;
}
const ADMIN_ID = env.TELEGRAM_ADMIN_ID;
const CHANNEL_ID = env.TELEGRAM_CHANEL_ID;
const generatePostJob = async (api, source) => {
  await api.sendMessage(ADMIN_ID, `Генерирую пост (${source}) ...`);
  try {
    const previous = SessionStore$1.get(CHANNEL_ID);
    clearDraftAutoPublish(previous?.draftId);
    const result = await PostService.generate(source);
    if (result.newsNotFound) {
      await api.sendMessage(
        ADMIN_ID,
        `Уникальная новость не найдена: проверено ${MAX_NEWS_PICK_ATTEMPTS} следующих по списку — все уже есть в базе по смыслу.`
      );
      return;
    }
    const { title, text, imageUrl } = result;
    const previewImage = await urlToBuffer(imageUrl);
    const allowsBackgroundTemplate = await isImageGoodForFullBleed(previewImage);
    const draftId = crypto.randomUUID();
    if (text && title) {
      const keyboard = new grammy.InlineKeyboard().text("Классика", "publish:Classic").text("Без шаблона", "publish:None").row();
      if (allowsBackgroundTemplate) {
        keyboard.text("Фон", "publish:Alt").text("Отменить", "cancel");
      } else {
        keyboard.text("Отменить", "cancel");
      }
      const sent = await api.sendPhoto(ADMIN_ID, new grammy.InputFile(previewImage), {
        caption: text,
        reply_markup: keyboard
      });
      SessionStore$1.set(CHANNEL_ID, {
        generatedPost: text,
        generatedImage: previewImage,
        draftTitle: title,
        draftImageUrl: imageUrl,
        allowsBackgroundTemplate,
        draftId,
        adminPreviewChatId: sent.chat.id,
        adminPreviewMessageId: sent.message_id
      });
      scheduleDraftAutoPublish(draftId, api);
    }
  } catch (error) {
    await api.sendMessage(
      ADMIN_ID,
      `Произошла ошибка при генерации поста 😥 ${error}`
    );
  }
};
const sourceEvent = async (ctx) => {
  try {
    const source = ctx.callbackQuery?.data?.replace("source:", "");
    await ctx.answerCallbackQuery();
    await generatePostJob(ctx.api, source);
  } catch (error) {
    await ctx.reply(`❌ Не удалось опубликовать пост. ${error}`);
  }
};
function getRandomEnumValue(enumObj) {
  const values = Object.values(enumObj);
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
}
const bot = new grammy.Bot(env.TELEGRAM_BOT_TOKEN);
console.log(env.TELEGRAM_CHANEL_ID);
bot.use(
  grammy.session({
    initial: () => ({
      waitingForPrompt: false,
      generatedPost: null,
      generatedImage: null,
      draftTitle: null,
      draftImageUrl: null
    })
  })
);
bot.command("start", startCommand);
bot.command("generate", generateCommand);
bot.callbackQuery("cancel", cancelEvent);
bot.callbackQuery(/^publish:/, publishStyleEvent);
bot.callbackQuery(/^source:/, sourceEvent);
if (env.NODE_ENV === "prod") {
  cron.schedule(`${env.POST_FREQ_MINUTES} 08-21 * * *`, () => {
    const source = getRandomEnumValue(Source);
    void generatePostJob(bot.api, source);
  });
}
async function initDatabase() {
  const pool2 = getPool();
  await pool2.query(`
    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
(async () => {
  try {
    console.log("🚀 Запускаю бота...");
    await initDatabase();
    await bot.start();
    console.log("✅ Бот успешно запущен!");
  } catch (err) {
    console.error("❌ Ошибка запуска:", err);
    process.exit(1);
  }
})();
