import axios from "axios";

export async function fetchImageBase64(url: string): Promise<string> {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const base64 = Buffer.from(response.data).toString("base64");
  const mime = response.headers["content-type"];
  return `data:${mime};base64,${base64}`;
}
