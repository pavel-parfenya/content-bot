/** Типичный вид токена в URL и текстах ошибок (`/bot<token>/method`). */
const TELEGRAM_BOT_TOKEN_LIKE = /\b\d{8,12}:[A-Za-z0-9_-]{30,120}\b/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Убирает BOT_TOKEN из строки (логи, сообщения пользователю). */
export function redactSecrets(text: string): string {
  let s = text;
  const token = process.env.BOT_TOKEN?.trim();
  if (token) {
    s = s.replace(new RegExp(escapeRegExp(token), "g"), "[BOT_TOKEN]");
  }
  return s.replace(TELEGRAM_BOT_TOKEN_LIKE, "[BOT_TOKEN]");
}

/** Полный текст ошибки для логов без утечки токена. */
export function sanitizeErrorForLogs(error: unknown): string {
  if (error instanceof Error) {
    const parts = [error.name + ": " + error.message];
    if (error.stack) {
      parts.push(error.stack);
    }
    return redactSecrets(parts.join("\n"));
  }
  return redactSecrets(String(error));
}

/** Короткое сообщение об ошибке для Telegram (без стека). */
export function errorMessageForUser(error: unknown): string {
  if (error instanceof Error) {
    return redactSecrets(error.message);
  }
  return redactSecrets(String(error));
}
