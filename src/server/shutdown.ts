import { bot } from "bot";
import { env } from "config";
import type { Server } from "http";
import { shutdownWebhook } from "server/webhook";

/** Для webhook — сервер с Telegram; для polling на Render — только health. */
export function registerGracefulShutdown(httpServer: Server | null): void {
  const shutdown = async () => {
    try {
      if (env.MODE === "webhook" && httpServer) {
        await shutdownWebhook(httpServer);
      } else {
        if (httpServer) {
          await new Promise<void>((resolve, reject) => {
            httpServer!.close((err) => (err ? reject(err) : resolve()));
          });
        }
        await bot.stop();
      }
    } catch (e) {
      console.error("Shutdown error:", e);
    } finally {
      process.exit(0);
    }
  };

  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}
