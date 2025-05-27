import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

export async function generateImageFromHtml(
  htmlFilePath: string,
  outputImagePath:
    | `${string}.png`
    | `${string}.jpeg`
    | `${string}.webp`
    | undefined,
  viewport = { width: 1200, height: 900 },
) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const htmlContent = await fs.readFile(path.resolve(htmlFilePath), "utf-8");
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  await page.setViewport(viewport);

  await page.screenshot({ path: outputImagePath });

  await browser.close();
}
