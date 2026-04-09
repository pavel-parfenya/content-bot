import { bot } from "bot";
import { env } from "config";
import { webhookCallback } from "grammy";
import { createServer, type Server } from "http";

function requestPath(url: string | undefined): string {
  const path = (url ?? "/").split("?")[0];
  return path === "" ? "/" : path;
}

export async function listenWebhook(): Promise<Server> {
  const webhookUrl = env.WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("WEBHOOK_URL не задан (нужен при MODE=webhook)");
  }

  const parsed = new URL(webhookUrl);
  const pathname = parsed.pathname || "/";

  const secret = env.WEBHOOK_SECRET;
  const handle = secret
    ? webhookCallback(bot, "http", { secretToken: secret })
    : webhookCallback(bot, "http");

  const server = createServer((req, res) => {
    const path = requestPath(req.url);

    if (req.method === "GET" && (path === "/" || path === "/health")) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }

    if (req.method === "POST" && path === pathname) {
      void handle(req, res);
      return;
    }

    res.writeHead(404);
    res.end();
  });

  const port = Number(process.env.PORT) || 3000;

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    // Render / Docker: слушать все интерфейсы, иначе «No open ports detected»
    server.listen(port, "0.0.0.0", () => resolve());
  });

  console.log(`HTTP 0.0.0.0:${port}, webhook POST path: ${pathname}`);

  await bot.api.setWebhook(
    webhookUrl,
    secret ? { secret_token: secret } : undefined,
  );

  console.log(`Telegram webhook: ${webhookUrl}`);
  return server;
}

export async function shutdownWebhook(server: Server): Promise<void> {
  await bot.api.deleteWebhook({ drop_pending_updates: false });
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}
