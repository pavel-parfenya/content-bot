import "dotenv/config";
import { bot } from "bot";
import { env } from "config";
import { initDatabase } from "db/init";
import { listenHealthPort } from "server/health-port";
import { registerGracefulShutdown } from "server/shutdown";
import { listenWebhook } from "server/webhook";
import type { Server } from "http";

const isRender = process.env.RENDER === "true";

(async () => {
  try {
    console.log(`🚀 Запуск (MODE=${env.MODE})...`);
    await initDatabase();

    let httpServer: Server | null = null;

    if (env.MODE === "webhook") {
      httpServer = await listenWebhook();
    } else {
      if (isRender) {
        const port = Number(process.env.PORT);
        if (!Number.isFinite(port) || port <= 0) {
          throw new Error(
            "На Render задайте переменную PORT (задаётся платформой автоматически для Web Service).",
          );
        }
        httpServer = await listenHealthPort(port);
        console.log(
          `Health check 0.0.0.0:${port} (Render + polling, long polling к Telegram отдельно)`,
        );
      }
      await bot.start();
    }

    registerGracefulShutdown(httpServer);
    console.log("✅ Бот успешно запущен!");
  } catch (err) {
    console.error("❌ Ошибка запуска:", err);
    process.exit(1);
  }
})();
