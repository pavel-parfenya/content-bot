import axios from "axios";
import { env } from "config";

type Message = { role: "user" | "assistant" | "system"; content: string };

const deepSeekSessions: Record<string, Message[]> = {};

export async function generatePostWithSession(
  chatId: string,
  prompt: string,
): Promise<string> {
  if (!deepSeekSessions[chatId]) {
    deepSeekSessions[chatId] = [];
  }

  deepSeekSessions[chatId].push({ role: "user", content: prompt });

  const response = await axios.post(
    "https://api.deepseek.com/chat/completions",
    {
      model: "deepseek-chat",
      messages: deepSeekSessions[chatId],
    },
    {
      headers: {
        Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const assistantMessage = response.data.choices?.[0]?.message;

  if (assistantMessage) {
    deepSeekSessions[chatId].push(assistantMessage);
    return assistantMessage.content.trim();
  }

  return "";
}
