import { MyContext } from "types";

export async function stripInlineKeyboard(ctx: MyContext): Promise<void> {
  try {
    await ctx.editMessageReplyMarkup({
      reply_markup: { inline_keyboard: [] },
    });
  } catch {
    /* ignore */
  }
}
