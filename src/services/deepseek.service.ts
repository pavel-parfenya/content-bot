import axios from "axios";
import { systemPrompt } from "constants/prompts/system.prompt";
import { config } from "dotenv";

config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;

export const DeepseekService = {
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
