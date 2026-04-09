/**
 * Общие опции для Render/Docker: мало RAM, нет /dev/shm по умолчанию.
 * @see https://pptr.dev/troubleshooting#running-puppeteer-on-gitlabci
 */
export const puppeteerLaunchOptions = {
  headless: "shell" as const,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
  ],
};
