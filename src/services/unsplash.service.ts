import axios from "axios";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;

export async function getRandomImage(): Promise<string | null> {
  console.log("Тянем картинку с Unsplash");
  try {
    const response = await axios.get("https://api.unsplash.com/photos/random", {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
      params: {
        query: "esports",
        orientation: "landscape",
        content_filter: "high",
      },
    });

    return response.data?.urls?.regular ?? null;
  } catch (error) {
    console.error("❌ Unsplash error:", error);
    return null;
  }
}
