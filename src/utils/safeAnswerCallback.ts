import type { MyContext } from "types";

/** Telegram принимает ответ на callback ~до 10 с; после — 400, но логику можно выполнить. */
export function isCallbackQueryExpiredError(e: unknown): boolean {
  const s = String(e).toLowerCase();
  return (
    s.includes("query is too old") ||
    s.includes("query id is invalid") ||
    s.includes("response timeout expired")
  );
}

export async function answerCallbackSafe(
  ctx: MyContext,
  options?: Parameters<MyContext["answerCallbackQuery"]>[0],
): Promise<void> {
  try {
    await ctx.answerCallbackQuery(options);
  } catch (e) {
    if (isCallbackQueryExpiredError(e)) {
      console.warn("[tg] answerCallbackQuery пропущен (истёк или уже отвечен):", e);
      return;
    }
    throw e;
  }
}
