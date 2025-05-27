import axios from "axios";
import { DEEPSEEK_API_KEY } from "config";

type Message = { role: "user" | "assistant" | "system"; content: string };

// В памяти: ключ — chatId (или userId), значение — массив сообщений
const deepSeekSessions: Record<string, Message[]> = {};

export async function generatePostWithSession(
  chatId: string,
  prompt: string,
): Promise<string> {
  if (!deepSeekSessions[chatId]) {
    deepSeekSessions[chatId] = [];
  }

  // Добавляем пользовательский запрос
  deepSeekSessions[chatId].push({ role: "user", content: prompt });

  const response = await axios.post(
    "https://api.deepseek.com/chat/completions",
    {
      model: "deepseek-chat",
      messages: deepSeekSessions[chatId],
    },
    {
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const assistantMessage = response.data.choices?.[0]?.message;

  if (assistantMessage) {
    // Добавляем ответ модели в сессию
    deepSeekSessions[chatId].push(assistantMessage);
    return assistantMessage.content.trim();
  }

  return "";
}
