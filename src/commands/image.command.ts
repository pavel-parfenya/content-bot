import { getRandomImage } from "services/unsplash.service";
import { MyContext } from "types";

export default async function imageCommand(ctx: MyContext) {
  await ctx.reply("Генерирую картинку ...");
  try {
    const imageUrl = await getRandomImage();

    if (imageUrl) {
      await ctx.replyWithPhoto(imageUrl);
    }
  } catch (error) {
    console.error(error);
    await ctx.reply("Произошла ошибка при генерации картинки 😥");
  }
}
