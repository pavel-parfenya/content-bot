import axios from "axios";
import { duplicateCheckSystemPrompt } from "constants/prompts/duplicate.prompt";
import { junkListingTitleSystemPrompt } from "constants/prompts/junk-title.prompt";
import { systemPrompt } from "constants/prompts/system.prompt";
import { config } from "dotenv";

config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  return JSON.parse(raw.trim()) as unknown;
}

export const DeepseekService = {
  isJunkListingTitle: async (title: string): Promise<boolean> => {
    console.log("DeepSeek: проверка заголовка на рекламу/квиз/розыгрыш");
    const chatRes = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: junkListingTitleSystemPrompt },
          { role: "user", content: JSON.stringify({ title }) },
        ],
        temperature: 0.1,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    const content = chatRes.data.choices[0].message.content.trim();
    try {
      const parsed = extractJsonObject(content) as { junk?: boolean };
      return Boolean(parsed.junk);
    } catch (e) {
      console.error("DeepSeek junk-title JSON parse error:", e, content);
      return false;
    }
  },

  compareSemanticDuplicate: async (
    candidateTitle: string,
    existingTitles: string[],
  ): Promise<{ duplicate: boolean; similarTitle: string | null }> => {
    if (existingTitles.length === 0) {
      return { duplicate: false, similarTitle: null };
    }
    console.log("DeepSeek: проверка дубликата по смыслу");
    const userContent = JSON.stringify(
      { candidateTitle, existingTitles },
      null,
      2,
    );
    const chatRes = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: duplicateCheckSystemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const content = chatRes.data.choices[0].message.content.trim();
    try {
      const parsed = extractJsonObject(content) as {
        duplicate?: boolean;
        similarTitle?: string | null;
      };
      return {
        duplicate: Boolean(parsed.duplicate),
        similarTitle:
          typeof parsed.similarTitle === "string" ? parsed.similarTitle : null,
      };
    } catch (e) {
      console.error("DeepSeek duplicate JSON parse error:", e, content);
      return { duplicate: false, similarTitle: null };
    }
  },

  use: async (prompt: string): Promise<{ title: string; text: string }> => {
    console.log("Запрос в deepseek");
    const chatRes = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.9,
        top_p: 0.95,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const res = chatRes.data.choices[0].message.content.trim().split("&");
    return { title: res[1], text: res[0] };
  },
};
