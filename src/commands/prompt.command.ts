import { MyContext } from "types";

export const promptCommand = async (ctx: MyContext) => {
  ctx.session.waitingForPrompt = true;
  await ctx.reply("Введите свой запрос для генерации поста:");
};
