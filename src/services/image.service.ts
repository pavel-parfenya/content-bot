import { PostTemplate } from "constants/post-template";
import path from "path";
import puppeteer from "puppeteer";
import { fetchImageBase64 } from "utils/fetchBase64Image";

type HtmlPostTemplate = PostTemplate.Classic | PostTemplate.Alt;

const TEMPLATE_HTML: Record<HtmlPostTemplate, string> = {
  [PostTemplate.Classic]: "post.html",
  [PostTemplate.Alt]: "post-alt.html",
};

export const ImageService = {
  create: async (
    title: string,
    imageUrl: string,
    template: HtmlPostTemplate = PostTemplate.Classic,
  ): Promise<Buffer | null> => {
    const base64ImageUrl = await fetchImageBase64(imageUrl);

    if (base64ImageUrl) {
      const fileName = TEMPLATE_HTML[template];
      const absolutePath = path.join(process.cwd(), "dist", fileName);
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "shell",
      });
      const page = await browser.newPage();
      await page.setViewport({
        width: 1280,
        height: 1280,
        deviceScaleFactor: 1,
      });

      await page.goto(`file://${absolutePath}`, { waitUntil: "networkidle0" });

      await page.evaluate(
        (title, imageSrc) => {
          const heading = document.getElementById("title");
          if (heading) heading.textContent = title;

          const image = document.getElementById("image");
          if (image) image.setAttribute("src", imageSrc);
        },
        title,
        base64ImageUrl,
      );

      const buffer = await page.screenshot({ type: "png" });

      await browser.close();

      return Buffer.from(buffer);
    }

    return null;
  },
};
