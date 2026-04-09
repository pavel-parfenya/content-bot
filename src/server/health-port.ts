import { createServer, type Server } from "http";

function requestPath(url: string | undefined): string {
  const path = (url ?? "/").split("?")[0];
  return path === "" ? "/" : path;
}

/**
 * Минимальный HTTP только для health check (Render Web Service + MODE=polling).
 * Telegram по-прежнему через long polling.
 */
export function listenHealthPort(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const path = requestPath(req.url);
      if (req.method === "GET" && (path === "/" || path === "/health")) {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("ok");
        return;
      }
      res.writeHead(404);
      res.end();
    });

    server.once("error", reject);
    server.listen(port, "0.0.0.0", () => resolve(server));
  });
}
