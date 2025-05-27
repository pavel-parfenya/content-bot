import path from "path";
import puppeteer from "puppeteer";
import { fetchImageBase64 } from "utils/fetchBase64Image";

export const ImageService = {
  create: async (title: string, imageUrl: string): Promise<Buffer | null> => {
    const base64ImageUrl = await fetchImageBase64(imageUrl);

    if (base64ImageUrl) {
      const absolutePath = path.resolve("./src/assets/post/post.html");
      const browser = await puppeteer.launch({ headless: "shell" });
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 900 });

      await page.goto(`file://${absolutePath}`);

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
