import axios from "axios";
import { imageSize } from "image-size";

export async function getImageResolution(url: string) {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
  });

  const buffer = Buffer.from(response.data);
  return imageSize(buffer); // { width: 1920, height: 1080, type: 'jpg' }
}
