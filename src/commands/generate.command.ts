import { Source } from "constants/source";
import { InlineKeyboard } from "grammy";
import { MyContext } from "types";

export default async function generateCommand(ctx: MyContext) {
  const keyboard = new InlineKeyboard();

  Object.values(Source).forEach((source) => {
    keyboard.text(source, `source:${source}`).row();
  });

  await ctx.reply("Выберите источник:", {
    reply_markup: keyboard,
  });
}
