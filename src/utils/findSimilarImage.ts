import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export async function findSimilarImageFromBase64(
  base64Input: string,
): Promise<string | null> {
  const buffer = Buffer.from(base64Input, "base64");
  const tempFilePath = path.resolve(`temp-${uuidv4()}.jpg`);
  await fs.writeFile(tempFilePath, buffer);

  const browser = await puppeteer.launch({ headless: "shell" });
  const page = await browser.newPage();
  await page.goto("https://yandex.ru/images/", {
    waitUntil: "domcontentloaded",
  });

  const cbirButtonSelector = 'button[aria-label="Поиск по картинке"]';
  await page.waitForSelector(cbirButtonSelector, { timeout: 10000 });

  const buttonHandle = await page.$(cbirButtonSelector);
  if (!buttonHandle) throw new Error("Кнопка поиска по картинке не найдена");

  await page.evaluate((btn) => {
    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    btn.click();
  }, buttonHandle);

  const fileInputSelector = 'input[type="file"]';
  await page.waitForSelector(fileInputSelector, { timeout: 10000 });
  const fileInput = await page.$(fileInputSelector);
  await fileInput?.uploadFile(tempFilePath);

  // Ждём, пока загрузится один из возможных результатов:
  try {
    await page.waitForSelector("div.CbirSites-Item img", { timeout: 15000 });
  } catch {
    console.warn(
      "⚠️ Не найден блок похожих изображений. Пробуем другой вариант...",
    );
    await fs.unlink(tempFilePath);
    await browser.close();
  }

  const similarImageUrl = await page.$eval(
    "div.CbirSites-Item img",
    (img) => (img as HTMLImageElement).src,
  );

  const similarImageBuffer = await axios
    .get(similarImageUrl, { responseType: "arraybuffer" })
    .then((res) => Buffer.from(res.data));

  await fs.unlink(tempFilePath);
  await browser.close();

  return similarImageBuffer.toString("base64");
}
